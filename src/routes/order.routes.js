import express from 'express';
import * as orderController from '../controllers/order.controller.js';
import * as returnController from '../controllers/return.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng
 *     tags: [Orders]
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
 *         description: Danh sách đơn hàng
 *       401:
 *         description: Không được phép
 */
router.get('/', protect, orderController.getOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Lấy thông tin đơn hàng theo ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng
 *     responses:
 *       200:
 *         description: Thông tin chi tiết đơn hàng
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       401:
 *         description: Không được phép
 */
router.get('/:id', protect, orderController.getOrderById);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, COMPLETED, CANCELLED]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trạng thái đơn hàng được cập nhật thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       401:
 *         description: Không được phép
 */
router.put('/:id/status', protect, admin, orderController.updateOrderStatus);

/**
 * @swagger
 * /orders/{id}/shipping:
 *   put:
 *     summary: Cập nhật thông tin vận chuyển cho đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thông tin vận chuyển được cập nhật thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       401:
 *         description: Không được phép
 */
router.put('/:id/shipping', protect, admin, orderController.updateShippingInfo);

/**
 * @swagger
 * /orders/{id}/items:
 *   put:
 *     summary: Cập nhật sản phẩm trong đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     variant:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm trong đơn hàng được cập nhật thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       401:
 *         description: Không được phép
 */
router.put('/:id/items', protect, admin, orderController.updateOrderItems);

/**
 * @swagger
 * /orders/{id}/returns:
 *   post:
 *     summary: Tạo yêu cầu trả hàng cho đơn hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Yêu cầu trả hàng được tạo thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       401:
 *         description: Không được phép
 */
router.post('/:id/returns', protect, returnController.createReturn);

/**
 * @swagger
 * /orders/returns:
 *   get:
 *     summary: Lấy danh sách yêu cầu trả hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu trả hàng
 *       401:
 *         description: Không được phép
 */
router.get('/returns', protect, returnController.getReturns);

/**
 * @swagger
 * /orders/returns/{id}:
 *   get:
 *     summary: Lấy thông tin yêu cầu trả hàng theo ID
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID yêu cầu trả hàng
 *     responses:
 *       200:
 *         description: Thông tin chi tiết yêu cầu trả hàng
 *       404:
 *         description: Không tìm thấy yêu cầu trả hàng
 *       401:
 *         description: Không được phép
 */
router.get('/returns/:id', protect, returnController.getReturnById);

/**
 * @swagger
 * /orders/returns/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái yêu cầu trả hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID yêu cầu trả hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Trạng thái yêu cầu trả hàng được cập nhật thành công
 *       404:
 *         description: Không tìm thấy yêu cầu trả hàng
 *       401:
 *         description: Không được phép
 */
router.put('/returns/:id/status', protect, admin, returnController.updateReturnStatus);

/**
 * @swagger
 * /orders/returns/scan-qr:
 *   post:
 *     summary: Quét mã QR cho yêu cầu trả hàng
 *     tags: [Returns]
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
 *     responses:
 *       200:
 *         description: Thông tin yêu cầu trả hàng từ mã QR
 *       404:
 *         description: Không tìm thấy thông tin yêu cầu trả hàng
 *       401:
 *         description: Không được phép
 */
router.post('/returns/scan-qr', protect, returnController.scanOrderQR);

export default router; 