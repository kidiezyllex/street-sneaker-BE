import express from 'express';
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment,
  getPaymentsByOrderId
} from '../controllers/payment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin, authorizeStaffOrAdmin } from '../middlewares/role.middleware.js'; // Giả sử bạn có middleware này

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Quản lý thanh toán
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Tạo thanh toán mới cho đơn hàng
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order
 *               - amount
 *               - method
 *             properties:
 *               order:
 *                 type: string
 *                 description: ID của đơn hàng
 *               amount:
 *                 type: number
 *                 format: double
 *                 description: Số tiền thanh toán
 *               method:
 *                 type: string
 *                 enum: [CASH, BANK_TRANSFER]
 *                 description: Phương thức thanh toán
 *               bankTransferInfo:
 *                 type: object
 *                 properties:
 *                   bankName: string
 *                   accountNumber: string
 *                   transactionCode: string
 *                   transferDate: string
 *                   format: date-time
 *                 description: Thông tin chuyển khoản (nếu method là BANK_TRANSFER)
 *               note:
 *                 type: string
 *                 description: Ghi chú thêm
 *     responses:
 *       201:
 *         description: Tạo thanh toán thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không thể tạo thanh toán cho đơn hàng này
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (yêu cầu Staff hoặc Admin)
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', authenticate, authorizeStaffOrAdmin, createPayment);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Lấy danh sách thanh toán (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *         description: Lọc theo ID đơn hàng
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [CASH, BANK_TRANSFER]
 *         description: Lọc theo phương thức
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc từ ngày (YYYY-MM-DD)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc đến ngày (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       400:
 *         description: Tham số không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (yêu cầu Admin)
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/', authenticate, authorizeAdmin, getPayments);

/**
 * @swagger
 * /api/orders/{orderId}/payments:
 *   get:
 *     summary: Lấy danh sách thanh toán của một đơn hàng cụ thể
 *     tags: [Payments, Orders] # Có thể thêm tag Orders
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng cần lấy thanh toán
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       400:
 *         description: OrderId không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền xem thanh toán của đơn hàng này
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/orders/:orderId/payments', authenticate, getPaymentsByOrderId);


/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Lấy chi tiết một thanh toán (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thanh toán
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (yêu cầu Admin)
 *       404:
 *         description: Không tìm thấy thanh toán
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:id', authenticate, authorizeAdmin, getPaymentById);

/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     summary: Cập nhật trạng thái thanh toán (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thanh toán cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *                 description: Trạng thái mới
 *               note:
 *                 type: string
 *                 description: Ghi chú cập nhật (tùy chọn)
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Dữ liệu không hợp lệ (ID hoặc status)
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (yêu cầu Admin)
 *       404:
 *         description: Không tìm thấy thanh toán
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id', authenticate, authorizeAdmin, updatePaymentStatus);

/**
 * @swagger
 * /api/payments/{id}:
 *   delete:
 *     summary: Xóa một thanh toán (Admin - Thận trọng!)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thanh toán cần xóa
 *     responses:
 *       200:
 *         description: Xóa thanh toán thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền (yêu cầu Admin)
 *       404:
 *         description: Không tìm thấy thanh toán
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/:id', authenticate, authorizeAdmin, deletePayment);


export default router; 