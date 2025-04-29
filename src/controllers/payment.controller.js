import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';
import mongoose from 'mongoose';

/**
 * Tạo thanh toán mới
 * @route POST /api/payments
 * @access Private/Staff/Admin
 */
export const createPayment = async (req, res) => {
  try {
    const { order: orderId, amount, method, bankTransferInfo, note } = req.body;
    const staffId = req.account._id; // Giả sử người tạo là nhân viên đang đăng nhập

    // --- Validation ---
    if (!orderId || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: orderId, amount, method'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'OrderId không hợp lệ' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền phải là số dương' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Kiểm tra nếu đơn hàng đã hoàn thành hoặc hủy
    if (['HOAN_THANH', 'DA_HUY'].includes(order.orderStatus)) {
       return res.status(400).json({ success: false, message: `Không thể tạo thanh toán cho đơn hàng đã ${order.orderStatus}` });
    }

    // --- Logic Tạo Payment ---
    const newPayment = new Payment({
      order: orderId,
      amount,
      method,
      bankTransferInfo: method === 'BANK_TRANSFER' ? bankTransferInfo : undefined,
      status: method === 'BANK_TRANSFER' ? 'PENDING' : 'COMPLETED', // Mặc định COMPLETED cho CASH
      note,
      // createdBy: staffId // Có thể thêm nếu cần lưu người tạo payment
    });

    await newPayment.save();

    // --- Cập nhật trạng thái thanh toán của Order ---
    const paymentsForOrder = await Payment.find({ order: orderId, status: 'COMPLETED' });
    const totalPaid = paymentsForOrder.reduce((sum, payment) => sum + payment.amount, 0);

    if (totalPaid >= order.total) {
      order.paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      order.paymentStatus = 'PARTIAL_PAID';
    } else {
      order.paymentStatus = 'PENDING';
    }
    
    // Nếu thanh toán đủ và là COD, có thể chuyển trạng thái đơn hàng sang chờ giao
    // if(order.paymentStatus === 'PAID' && order.paymentMethod === 'COD') {
    //   order.orderStatus = 'CHO_GIAO_HANG'; // Logic này có thể cần xem xét lại tùy quy trình
    // }

    await order.save();


    return res.status(201).json({
      success: true,
      message: 'Tạo thanh toán thành công',
      data: newPayment
    });

  } catch (error) {
    console.error('Lỗi khi tạo thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thanh toán',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách thanh toán (hỗ trợ lọc và phân trang)
 * @route GET /api/payments
 * @access Private/Admin
 */
export const getPayments = async (req, res) => {
  try {
    const { orderId, status, method, page = 1, limit = 10, fromDate, toDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (orderId) {
       if (!mongoose.Types.ObjectId.isValid(orderId)) {
         return res.status(400).json({ success: false, message: 'OrderId không hợp lệ' });
       }
       filter.order = orderId;
    }
    if (status) filter.status = status;
    if (method) filter.method = method;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }


    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .populate({
         path: 'order',
         select: 'code customer total', // Chọn các field cần thiết từ order
         populate: { path: 'customer', select: 'fullName code' } // Populate khách hàng từ order
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách thanh toán thành công',
      data: {
        payments,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách thanh toán',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết thanh toán
 * @route GET /api/payments/:id
 * @access Private/Admin
 */
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID thanh toán không hợp lệ' });
    }

    const payment = await Payment.findById(id)
       .populate({
         path: 'order',
         select: 'code customer total paymentStatus orderStatus',
         populate: { path: 'customer', select: 'fullName code email' }
       });


    if (!payment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin thanh toán thành công',
      data: payment
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin thanh toán',
      error: error.message
    });
  }
};

/**
 * Cập nhật trạng thái thanh toán (ví dụ: xác nhận chuyển khoản, hoàn tiền)
 * @route PUT /api/payments/:id
 * @access Private/Admin
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body; // Chỉ cho phép cập nhật status và note

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID thanh toán không hợp lệ' });
    }

    if (!status || !['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'].includes(status)) {
       return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }


    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });
    }

    const oldStatus = payment.status;
    payment.status = status;
    if (note !== undefined) payment.note = note;

    await payment.save();

    // --- Cập nhật lại trạng thái thanh toán của Order nếu status thay đổi ---
    if (oldStatus !== status && (oldStatus === 'COMPLETED' || status === 'COMPLETED')) {
       const order = await Order.findById(payment.order);
       if(order) {
           const paymentsForOrder = await Payment.find({ order: payment.order, status: 'COMPLETED' });
           const totalPaid = paymentsForOrder.reduce((sum, p) => sum + p.amount, 0);

           if (totalPaid >= order.total) {
             order.paymentStatus = 'PAID';
           } else if (totalPaid > 0) {
             order.paymentStatus = 'PARTIAL_PAID';
           } else {
             order.paymentStatus = 'PENDING';
           }
           await order.save();
       }
    }

    return res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái thanh toán thành ${status} thành công`,
      data: payment
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái thanh toán',
      error: error.message
    });
  }
};


/**
 * Lấy danh sách thanh toán theo Order ID
 * @route GET /api/orders/:orderId/payments
 * @access Private (Customer cho order của mình, Staff/Admin cho mọi order)
 */
export const getPaymentsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const requestingUser = req.account; // Lấy từ middleware authenticate

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'OrderId không hợp lệ' });
    }

    const order = await Order.findById(orderId);
     if (!order) {
       return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
     }

    // --- Authorization ---
    // Cho phép admin/staff xem mọi payment
    // Cho phép customer xem payment của đơn hàng của chính họ
    if (requestingUser.role !== 'ADMIN' && requestingUser.role !== 'STAFF' && order.customer.toString() !== requestingUser._id.toString()) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xem thanh toán của đơn hàng này' });
    }

    const payments = await Payment.find({ order: orderId })
        .sort({ createdAt: -1 });


    return res.status(200).json({
      success: true,
      message: `Lấy danh sách thanh toán cho đơn hàng ${order.code} thành công`,
      data: payments
    });
  } catch (error) {
    console.error('Lỗi khi lấy thanh toán theo orderId:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thanh toán',
      error: error.message
    });
  }
};

// Lưu ý: Việc xóa Payment thường không được khuyến khích vì lý do tài chính và kiểm toán.
// Cân nhắc việc chỉ cập nhật status thành 'CANCELLED' hoặc 'FAILED' thay vì xóa cứng.
// Nếu vẫn muốn có chức năng xóa:
/**
 * Xóa thanh toán (Thận trọng khi sử dụng)
 * @route DELETE /api/payments/:id
 * @access Private/Admin
 */
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID thanh toán không hợp lệ' });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thanh toán' });
    }
    
    const orderId = payment.order;

    // Xóa payment
    await Payment.findByIdAndDelete(id);

    // --- Cập nhật lại trạng thái thanh toán của Order ---
     const order = await Order.findById(orderId);
     if(order) {
         const paymentsForOrder = await Payment.find({ order: orderId, status: 'COMPLETED' });
         const totalPaid = paymentsForOrder.reduce((sum, p) => sum + p.amount, 0);

         if (totalPaid >= order.total) {
           order.paymentStatus = 'PAID';
         } else if (totalPaid > 0) {
           order.paymentStatus = 'PARTIAL_PAID';
         } else {
           order.paymentStatus = 'PENDING';
         }
         await order.save();
     }

    return res.status(200).json({
      success: true,
      message: 'Xóa thanh toán thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa thanh toán:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa thanh toán',
      error: error.message
    });
  }
}; 