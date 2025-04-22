import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  processPayment,
  completeOrder,
  scanQRCode,
  printReceipt
} from '../controllers/pos.controller.js';
import { protect, staff } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /pos/orders:
 *   post:
 *     summary: Tạo đơn hàng POS mới
 *     tags: [POS Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # Cần thêm các thuộc tính của đơn hàng vào đây dựa trên validation
 *             # Ví dụ:
 *             # properties:
 *             #   customer: 
 *             #     type: string
 *             #   items:
 *             #     type: array
 *             #     items:
 *             #       type: object
 *             #       properties:
 *             #         productId:
 *             #           type: string
 *             #         variantId:
 *             #           type: string
 *             #         quantity:
 *             #           type: integer
 *     responses:
 *       201:
 *         description: Đơn hàng được tạo thành công
 *       400:
 *         description: Lỗi request hoặc vượt quá giới hạn đơn hàng đang xử lý
 *       401:
 *         description: Không được phép
 */
router.post('/orders', protect, staff, createOrder);

/**
 * @swagger
 * /pos/orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng POS
 *     tags: [POS Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng đơn hàng trên mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, CANCELLED]
 *         description: Lọc theo trạng thái đơn hàng
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng POS
 *       401:
 *         description: Không được phép
 */
router.get('/orders', protect, staff, getOrders);

/**
 * @swagger
 * /pos/orders/{id}:
 *   get:
 *     summary: Lấy thông tin đơn hàng POS theo ID
 *     tags: [POS Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng POS
 *     responses:
 *       200:
 *         description: Thông tin chi tiết đơn hàng POS
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       401:
 *         description: Không được phép
 */
router.get('/orders/:id', protect, staff, getOrderById);

/**
 * @swagger
 * /pos/orders/{id}:
 *   put:
 *     summary: Cập nhật đơn hàng POS theo ID
 *     tags: [POS Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng POS
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # Cần thêm các thuộc tính có thể cập nhật vào đây dựa trên validation
 *             # Ví dụ:
 *             # properties:
 *             #   customer:
 *             #     type: string
 *             #   status:
 *             #     type: string
 *             #     enum: [PENDING, PROCESSING, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Đơn hàng POS được cập nhật thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       401:
 *         description: Không được phép
 */
router.put('/orders/:id', protect, staff, updateOrder);

/**
 * @swagger
 * /pos/orders/{id}:
 *   delete:
 *     summary: Xóa đơn hàng POS theo ID
 *     tags: [POS Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng POS
 *     responses:
 *       200:
 *         description: Đơn hàng POS được xóa thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       401:
 *         description: Không được phép
 */
router.delete('/orders/:id', protect, staff, deleteOrder);

/**
 * @swagger
 * /pos/orders/{id}/items:
 *   post:
 *     summary: Thêm sản phẩm vào đơn hàng POS
 *     tags: [POS Order Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng POS
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               variantId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Sản phẩm được thêm vào đơn hàng thành công
 *       400:
 *         description: Lỗi request hoặc số lượng sản phẩm không đủ tồn kho
 *       404:
 *         description: Không tìm thấy đơn hàng hoặc sản phẩm
 *       401:
 *         description: Không được phép
 */
router.post('/orders/:id/items', protect, staff, addOrderItem);

/**
 * @swagger
 * /pos/orders/{id}/items/{itemId}:
 *   put:
 *     summary: Cập nhật sản phẩm trong đơn hàng POS
 *     tags: [POS Order Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng POS
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm trong đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               variantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sản phẩm trong đơn hàng được cập nhật thành công
 *       400:
 *         description: Lỗi request hoặc số lượng sản phẩm không đủ tồn kho
 *       404:
 *         description: Không tìm thấy đơn hàng hoặc sản phẩm trong đơn hàng
 *       401:
 *         description: Không được phép
 */
router.put('/orders/:id/items/:itemId', protect, staff, updateOrderItem);

/**
 * @swagger
 * /pos/orders/{id}/items/{itemId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi đơn hàng POS
 *     tags: [POS Order Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng POS
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm trong đơn hàng
 *     responses:
 *       200:
 *         description: Sản phẩm được xóa khỏi đơn hàng thành công
 *       404:
 *         description: Không tìm thấy đơn hàng hoặc sản phẩm trong đơn hàng
 *       401:
 *         description: Không được phép
 */
router.delete('/orders/:id/items/:itemId', protect, staff, removeOrderItem);

/**
 * @swagger
 * /pos/orders/{id}/payments:
 *   post:
 *     summary: Xử lý thanh toán cho đơn hàng POS
 *     tags: [POS Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng POS
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Số tiền thanh toán
 *                 minimum: 0
 *               method:
 *                 type: string
 *                 enum: [Cash, Card, Transfer]
 *                 description: Phương thức thanh toán
 *     responses:
 *       200:
 *         description: Thanh toán được xử lý thành công
 *       400:
 *         description: Lỗi request hoặc số tiền thanh toán vượt quá số tiền cần thanh toán
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       401:
 *         description: Không được phép
 */
router.post('/orders/:id/payments', protect, staff, processPayment);

/**
 * @swagger
 * /pos/orders/{id}/complete:
 *   post:
 *     summary: Hoàn thành đơn hàng POS
 *     tags: [POS Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng POS
 *     responses:
 *       200:
 *         description: Đơn hàng POS được hoàn thành thành công
 *       400:
 *         description: Đơn hàng chưa được thanh toán đủ
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       401:
 *         description: Không được phép
 */
router.post('/orders/:id/complete', protect, staff, completeOrder);

/**
 * @swagger
 * /pos/scan-qr:
 *   post:
 *     summary: Quét mã QR sản phẩm
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrCode:
 *                 type: string
 *                 description: Dữ liệu từ mã QR
 *     responses:
 *       200:
 *         description: Thông tin sản phẩm từ mã QR
 *       404:
 *         description: Không tìm thấy thông tin sản phẩm
 *       401:
 *         description: Không được phép
 */
router.post('/scan-qr', protect, staff, scanQRCode);

/**
 * @swagger
 * /pos/orders/{id}/print:
 *   get:
 *     summary: In hóa đơn cho đơn hàng POS
 *     tags: [POS Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng POS
 *     responses:
 *       200:
 *         description: Dữ liệu hóa đơn
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       401:
 *         description: Không được phép
 */
router.get('/orders/:id/print', protect, staff, printReceipt);

export default router;