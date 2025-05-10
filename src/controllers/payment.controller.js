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

/**
 * @swagger
 * /vnpay/create-qr:
 *   post:
 *     summary: Tạo mã QR thanh toán qua VNPay
 *     tags: [VNPay]
 *     description: Tạo URL thanh toán VNPay và trả về để redirect hoặc hiển thị QR code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - orderId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Số tiền thanh toán (VND)
 *               orderId:
 *                 type: string
 *                 description: ID của đơn hàng cần thanh toán
 *               returnUrl:
 *                 type: string
 *                 description: URL redirect sau khi thanh toán xong
 *     responses:
 *       201:
 *         description: Tạo URL thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Tạo mã QR thanh toán thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentUrl:
 *                       type: string
 *                       example: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */
export const createQrVNPay = async (req, res) => {
  try {
    const { amount, orderId, returnUrl } = req.body;

    // Validate input
    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin thanh toán: amount và orderId là bắt buộc',
        data: null
      });
    }

    // Validate orderId 
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ',
        data: null
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng',
        data: null
      });
    }

    // Get client IP address
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

    // Import VNPay library
    const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = await import('vnpay');

    // Create VNPay instance
    const vnpay = new VNPay({
      tmnCode: "LXS5R4EG",
      secureSecret: 'E9ZVT6V5D1XF2APNOJP7UBWU91VHGWG7',
      vnpayHost: 'https://sandbox.vnpayment.vn',
      testMode: true,
      hashAlgorithm: 'SHA512',
      LoggerFn: ignoreLogger
    });

    // Set up expiration date (15 minutes from now)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 15 * 60 * 1000);

    // Build payment URL
    const paymentUrl = await vnpay.buildPaymentUrl({
      vnp_Amount: parseInt(amount),
      vnp_IpAddr: clientIp,
      vnp_TxnRef: order.code,
      vnp_OrderInfo: `Thanh toan don hang ${order.code}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl || `${req.protocol}://${req.get('host')}/api/vnpay/check-payment-vnpay`,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(now),
      vnp_ExpireDate: dateFormat(tomorrow)
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo mã QR thanh toán thành công',
      data: {
        paymentUrl
      }
    });
  } catch (error) {
    console.error('Lỗi khi tạo mã QR VNPay:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo mã QR thanh toán',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /vnpay/check-payment-vnpay:
 *   get:
 *     summary: Xử lý kết quả thanh toán từ VNPay
 *     tags: [VNPay]
 *     description: Nhận và xử lý callback từ VNPay sau khi thanh toán xong, cập nhật trạng thái đơn hàng
 *     parameters:
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *         description: Số tiền thanh toán từ VNPay
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: Mã đơn hàng
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         description: Mã phản hồi từ VNPay ('00' là thành công)
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *         description: Mã giao dịch từ VNPay
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Chữ ký xác thực từ VNPay
 *     responses:
 *       200:
 *         description: Xử lý callback thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Thanh toán thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     txnRef:
 *                       type: string
 *                       example: DH2306000001
 *                     transactionNo:
 *                       type: string
 *                       example: 13876502
 *                     amount:
 *                       type: number
 *                       example: 500000
 *                     payDate:
 *                       type: string
 *                       example: 2023-06-01T14:30:00.000Z
 *       400:
 *         description: Chữ ký không hợp lệ hoặc thanh toán bị từ chối
 *       500:
 *         description: Lỗi server
 */
export const checkPaymentVNPay = async (req, res) => {
  try {
    const vnpParams = req.query;
    
    // Import VNPay library
    const { VNPay, ignoreLogger } = await import('vnpay');

    // Create VNPay instance
    const vnpay = new VNPay({
      tmnCode: "LXS5R4EG",
      secureSecret: 'E9ZVT6V5D1XF2APNOJP7UBWU91VHGWG7',
      vnpayHost: 'https://sandbox.vnpayment.vn',
      testMode: true
    });
    
    // Verify VNPay signature
    const isValidSignature = vnpay.verifyReturnUrl(vnpParams);
    
    if (!isValidSignature) {
      console.error('VNPay Return: Invalid signature based on internal verification.');
      return res.status(400).json({
        success: false,
        message: 'Chữ ký không hợp lệ, giao dịch có thể đã bị thay đổi',
        data: null
      });
    }

    // Extract information from VNPay response
    const txnRef = vnpParams['vnp_TxnRef']; // Order reference
    const transactionNo = vnpParams['vnp_TransactionNo']; // VNPay transaction number
    const amount = parseInt(vnpParams['vnp_Amount']) / 100; // Convert from smallest currency unit
    const responseCode = vnpParams['vnp_ResponseCode']; // VNPay response code ('00' for success)
    const bankCode = vnpParams['vnp_BankCode'];
    const payDate = vnpParams['vnp_PayDate'] ? moment(vnpParams['vnp_PayDate'], 'YYYYMMDDHHmmss').toDate() : new Date();

    // Check for valid response code from VNPay
    const isPaymentSuccess = responseCode === '00';

    // Find the order by code
    const order = await Order.findOne({ code: txnRef });
    if (order) {
      // Create payment record
      const payment = new Payment({
        order: order._id,
        amount,
        method: 'VNPAY',
        status: isPaymentSuccess ? 'COMPLETED' : 'FAILED',
        note: isPaymentSuccess ? `Thanh toán VNPay thành công, mã giao dịch: ${transactionNo}` : `Thanh toán VNPay thất bại, mã phản hồi: ${responseCode}`,
        vnpayInfo: {
          transactionNo,
          payDate,
          bankCode,
          responseCode
        }
      });
      await payment.save();

      // Update order if payment successful
      if (isPaymentSuccess) {
        order.paymentStatus = 'PAID';
        order.paymentMethod = 'VNPAY';
        
        // Update order status to shipping if currently pending
        if (order.orderStatus === 'CHO_XAC_NHAN') {
          order.orderStatus = 'CHO_GIAO_HANG';
        }
        
        await order.save();
      }
    } else {
      console.warn(`Order not found with code: ${txnRef}`);
    }

    // Return payment result to client
    return res.status(200).json({
      success: isPaymentSuccess,
      message: isPaymentSuccess ? 'Thanh toán thành công' : 'Thanh toán thất bại',
      data: {
        txnRef,
        transactionNo,
        amount,
        responseCode,
        bankCode,
        payDate: payDate.toISOString(),
        orderId: order ? order._id : null
      }
    });
  } catch (error) {
    console.error('Lỗi khi xử lý callback VNPay:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý callback thanh toán',
      error: error.message
    });
  }
}; 