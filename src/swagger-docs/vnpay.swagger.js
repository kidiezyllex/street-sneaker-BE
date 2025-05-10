/**
 * @swagger
 * tags:
 *   name: VNPay
 *   description: Thanh toán qua VNPay
 */

/**
 * @swagger
 * /vnpay/create-qr:
 *   post:
 *     summary: Tạo mã QR thanh toán VNPay
 *     tags: [VNPay]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - orderInfo
 *               - txnRef
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Số tiền thanh toán (VND)
 *                 example: 50000
 *               orderInfo:
 *                 type: string
 *                 description: Thông tin đơn hàng
 *                 example: "Thanh toan don hang #123456"
 *               txnRef:
 *                 type: string
 *                 description: Mã tham chiếu giao dịch (unique)
 *                 example: "123456"
 *               returnUrl:
 *                 type: string
 *                 description: Đường dẫn callback sau khi thanh toán (tùy chọn)
 *                 example: "http://localhost:3008/vnpay/check-payment-vnpay"
 *               orderType:
 *                 type: string
 *                 description: Loại đơn hàng (tùy chọn)
 *                 enum: [topup, billpayment, feeshipping, other]
 *                 default: other
 *               locale:
 *                 type: string
 *                 description: Ngôn ngữ (tùy chọn)
 *                 enum: [vn, en]
 *                 default: vn
 *     responses:
 *       201:
 *         description: Tạo mã QR thanh toán thành công
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
 *                   example: "Tạo mã QR thanh toán thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentUrl:
 *                       type: string
 *                       description: URL thanh toán VNPay
 *                       example: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=5000000&vnp_Command=pay&..."
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi máy chủ
 */

/**
 * @swagger
 * /vnpay/check-payment-vnpay:
 *   get:
 *     summary: Kiểm tra kết quả thanh toán từ VNPay (callback URL)
 *     tags: [VNPay]
 *     parameters:
 *       - in: query
 *         name: vnp_Amount
 *         schema:
 *           type: string
 *         description: Số tiền thanh toán (đơn vị nhỏ nhất của tiền tệ)
 *       - in: query
 *         name: vnp_BankCode
 *         schema:
 *           type: string
 *         description: Mã ngân hàng thanh toán
 *       - in: query
 *         name: vnp_BankTranNo
 *         schema:
 *           type: string
 *         description: Mã giao dịch tại ngân hàng
 *       - in: query
 *         name: vnp_CardType
 *         schema:
 *           type: string
 *         description: Loại thẻ thanh toán
 *       - in: query
 *         name: vnp_OrderInfo
 *         schema:
 *           type: string
 *         description: Thông tin đơn hàng
 *       - in: query
 *         name: vnp_PayDate
 *         schema:
 *           type: string
 *         description: Thời gian thanh toán (yyyyMMddHHmmss)
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *         description: Mã phản hồi kết quả thanh toán (00 = thành công)
 *       - in: query
 *         name: vnp_TmnCode
 *         schema:
 *           type: string
 *         description: Mã website
 *       - in: query
 *         name: vnp_TransactionNo
 *         schema:
 *           type: string
 *         description: Mã giao dịch của VNPay
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *         description: Mã tham chiếu giao dịch
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *         description: Mã kiểm tra để đảm bảo dữ liệu không bị thay đổi
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
 *                   example: "Thanh toán thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     txnRef:
 *                       type: string
 *                       example: "123456"
 *                     transactionNo:
 *                       type: string
 *                       example: "13708866"
 *                     amount:
 *                       type: number
 *                       example: 50000
 *                     responseCode:
 *                       type: string
 *                       example: "00"
 *                     bankCode:
 *                       type: string
 *                       example: "NCB"
 *                     payDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-08-09T12:34:56.789Z"
 *       400:
 *         description: Chữ ký không hợp lệ
 *       500:
 *         description: Lỗi máy chủ
 */

export default {}; 