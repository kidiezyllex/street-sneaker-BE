import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';
import mongoose from 'mongoose';
import { createPayment as createVNPayURL, verifyPayment } from '../utils/vnpay-fixed.js';
import querystring from 'querystring';
import moment from 'moment';

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

/**
 * Tạo URL thanh toán VNPay
 * @route POST /api/payments/create-vnpay-url
 * @access Private
 */
export const createVNPayPaymentUrl = async (req, res) => {
  try {
    const { orderId, amount, orderInfo, orderCode } = req.body;
    let clientIp = req.ip || req.headers['x-forwarded-for'];
    if (clientIp) {
        const ips = clientIp.split(',');
        clientIp = ips[0].trim();
    }

    if (!clientIp || clientIp === '::1') {
      clientIp = '127.0.0.1';
    } else if (clientIp.substr(0, 7) === '::ffff:') {
      clientIp = clientIp.substr(7);
    }

    if (!orderId || !amount || !orderInfo || !orderCode) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin thanh toán: orderId, amount, orderInfo, orderCode phải được cung cấp'
      });
    }

    // Sử dụng hàm mới từ vnpay-fixed.js với tên đã đổi
    const paymentUrl = createVNPayURL(orderId, amount, orderInfo, clientIp, orderCode);
    
    return res.status(200).json({
      success: true,
      data: { paymentUrl }
    });
  } catch (error) {
    console.error('Lỗi khi tạo URL thanh toán VNPay:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo URL thanh toán',
      error: error.message
    });
  }
};

/**
 * Xử lý callback từ VNPay
 * @route GET /api/payments/vnpay-return
 * @access Public
 */
export const handleVNPayReturn = async (req, res) => {
  try {
    const vnpParams = req.query;
    
    // Sử dụng hàm mới từ vnpay-fixed.js
    const isValidSignature = verifyPayment(vnpParams);
    if (!isValidSignature) {
      // VNPay's own error page will show if their signature check fails.
      // If our internal check fails, we can redirect to our own error message.
      console.error('VNPay Return: Invalid signature based on our internal verification.');
      // It's better to redirect to a user-friendly page than return JSON here,
      // as this endpoint is hit by browser redirect from VNPay.
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-result?success=false&message=InvalidSignature`);
    }

    const txnRef = vnpParams['vnp_TxnRef']; // This is the orderCode
    const orderCode = txnRef;
    
    const transactionNo = vnpParams['vnp_TransactionNo']; // VNPay's transaction number
    const amount = parseInt(vnpParams['vnp_Amount']) / 100; // Convert from smallest currency unit
    const responseCode = vnpParams['vnp_ResponseCode']; // VNPay's response code ('00' for success)

    // Find the order using the orderCode from vnp_TxnRef
    const order = await Order.findOne({ code: orderCode });

    if (!order) {
      console.error(`VNPay Return: Order not found with code: ${orderCode}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-result?success=false&message=OrderNotFound&orderCode=${orderCode}`);
    }
    const orderIdForPaymentRecord = order._id; // Use the actual MongoDB _id for the payment record

    // Tạo payment record
    const payment = new Payment({
      order: orderIdForPaymentRecord, // Use the actual ObjectId
      amount,
      method: 'VNPAY',
      status: responseCode === '00' ? 'COMPLETED' : 'FAILED',
      vnpayInfo: {
        vnp_TransactionNo: transactionNo,
        vnp_PayDate: vnpParams['vnp_PayDate'] ? moment(vnpParams['vnp_PayDate'], 'YYYYMMDDHHmmss').toDate() : new Date(),
        vnp_BankCode: vnpParams['vnp_BankCode'],
        vnp_CardType: vnpParams['vnp_CardType'],
        vnp_OrderInfo: vnpParams['vnp_OrderInfo'], // Store the order info returned by VNPay
        vnp_ResponseCode: responseCode
      }
    });

    await payment.save();

    // Cập nhật trạng thái đơn hàng if payment was successful
    if (responseCode === '00') {
      // order object is already fetched
      const totalPaidViaVnpay = amount; // Assuming this is the full payment for this transaction
      
      // You might want to fetch all 'COMPLETED' VNPAY payments for this order
      // if partial payments or multiple VNPAY attempts are possible.
      // For now, we assume this 'amount' contributes to the order's total.

      if (totalPaidViaVnpay >= order.total) {
        order.paymentStatus = 'PAID';
        // Only change orderStatus if it makes sense in your workflow (e.g., from PENDING_PAYMENT)
        if (order.orderStatus === 'PENDING_PAYMENT' || order.orderStatus === 'pending') { // Adjust based on your actual statuses
             order.orderStatus = 'CHO_GIAO_HANG'; // Or 'PROCESSING', etc.
        }
      } else if (totalPaidViaVnpay > 0) {
        // This logic might need adjustment if only full payment marks order as 'PAID'
        order.paymentStatus = 'PARTIAL_PAID';
      }
      // Ensure paymentMethod reflects VNPAY if not already set (though it should be)
      order.paymentMethod = 'BANK_TRANSFER'; // Or your specific enum for VNPAY
      await order.save();
    } else {
        // Payment failed, update order status if necessary (e.g., back to PENDING_PAYMENT or FAILED_PAYMENT)
        order.paymentStatus = 'FAILED'; // Or keep as PENDING / PENDING_PAYMENT
        // Optionally update order.orderStatus if payment failure means order cancellation or needs attention
        await order.save();
    }

    // Redirect về trang kết quả thanh toán
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-result?` + 
      querystring.stringify({
        orderCode: order.code, // Send orderCode back to frontend
        success: responseCode === '00',
        message: responseCode === '00' ? 'Thanh toán thành công' : 'Thanh toán thất bại',
        vnp_TransactionNo: transactionNo, // Optionally pass VNPay transaction number
        amount: amount
      });

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Lỗi khi xử lý callback VNPay:', error);
    // Generic error redirect
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-result?success=false&message=InternalError`);
  }
};

/**
 * Tạo thanh toán COD
 * @route POST /api/payments/cod
 * @access Private
 */
export const createCODPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin thanh toán'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Tạo payment record cho COD
    const payment = new Payment({
      order: orderId,
      amount,
      method: 'COD',
      status: 'PENDING',
      note: 'Thanh toán khi nhận hàng'
    });

    await payment.save();

    // Cập nhật trạng thái đơn hàng
    order.paymentMethod = 'COD';
    order.paymentStatus = 'PENDING';
    order.orderStatus = 'CHO_GIAO_HANG';
    await order.save();

    return res.status(201).json({
      success: true,
      message: 'Đã tạo thanh toán COD',
      data: payment
    });
  } catch (error) {
    console.error('Lỗi khi tạo thanh toán COD:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thanh toán COD',
      error: error.message
    });
  }
}; 