import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';
import mongoose from 'mongoose';
import querystring from 'querystring';

export const createPayment = async (req, res) => {
  try {
    const { order: orderId, amount, method, bankTransferInfo, note } = req.body;

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

    if (['HOAN_THANH', 'DA_HUY'].includes(order.orderStatus)) {
       return res.status(400).json({ success: false, message: `Không thể tạo thanh toán cho đơn hàng đã ${order.orderStatus}` });
    }

    const newPayment = new Payment({
      order: orderId,
      amount,
      method,
      bankTransferInfo: method === 'BANK_TRANSFER' ? bankTransferInfo : undefined,
      status: method === 'BANK_TRANSFER' ? 'PENDING' : 'COMPLETED',
      note,
    });

    await newPayment.save();

    const paymentsForOrder = await Payment.find({ order: orderId, status: 'COMPLETED' });
    const totalPaid = paymentsForOrder.reduce((sum, payment) => sum + payment.amount, 0);

    if (totalPaid >= order.total) {
      order.paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      order.paymentStatus = 'PARTIAL_PAID';
    } else {
      order.paymentStatus = 'PENDING';
    }
    
    await order.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo thanh toán thành công',
      data: newPayment
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thanh toán',
      error: error.message
    });
  }
};

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
         select: 'code customer total',
         populate: { path: 'customer', select: 'fullName code' }
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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách thanh toán',
      error: error.message
    });
  }
};

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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin thanh toán',
      error: error.message
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái thanh toán',
      error: error.message
    });
  }
};

export const getPaymentsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const requestingUser = req.account;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: 'OrderId không hợp lệ' });
    }

    const order = await Order.findById(orderId);
     if (!order) {
       return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
     }

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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thanh toán',
      error: error.message
    });
  }
};

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

    await Payment.findByIdAndDelete(id);

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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa thanh toán',
      error: error.message
    });
  }
};

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

    const payment = new Payment({
      order: orderId,
      amount,
      method: 'COD',
      status: 'PENDING',
      note: 'Thanh toán khi nhận hàng'
    });

    await payment.save();

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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thanh toán COD',
      error: error.message
    });
  }
};
