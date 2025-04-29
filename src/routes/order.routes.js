import express from 'express';
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateShippingInfo,
  updateOrderItems
} from '../controllers/order.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Lấy danh sách tất cả đơn hàng
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
 *         description: Số đơn hàng trên mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED]
 *         description: Lọc theo trạng thái đơn hàng
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc từ ngày
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc đến ngày
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ONLINE, OFFLINE]
 *         description: Lọc theo loại đơn hàng
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       401:
 *         description: Không có quyền truy cập
 */
router.get('/', protect, admin, getOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết đơn hàng
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.get('/:id', protect, admin, getOrderById);

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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED]
 *                 description: Trạng thái mới của đơn hàng
 *               note:
 *                 type: string
 *                 description: Ghi chú khi cập nhật trạng thái
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.put('/:id/status', protect, admin, updateOrderStatus);

/**
 * @swagger
 * /orders/{id}/shipping:
 *   put:
 *     summary: Cập nhật thông tin vận chuyển
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
 *                 description: Địa chỉ giao hàng
 *               city:
 *                 type: string
 *                 description: Thành phố
 *               district:
 *                 type: string
 *                 description: Quận/Huyện
 *               ward:
 *                 type: string
 *                 description: Phường/Xã
 *               phone:
 *                 type: string
 *                 description: Số điện thoại
 *               shippingMethod:
 *                 type: string
 *                 description: Phương thức vận chuyển
 *               trackingNumber:
 *                 type: string
 *                 description: Mã đơn hàng vận chuyển
 *     responses:
 *       200:
 *         description: Cập nhật thông tin vận chuyển thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.put('/:id/shipping', protect, admin, updateShippingInfo);

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
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product
 *                     - variant
 *                     - quantity
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: ID sản phẩm
 *                     variant:
 *                       type: string
 *                       description: ID biến thể sản phẩm
 *                     quantity:
 *                       type: number
 *                       description: Số lượng
 *     responses:
 *       200:
 *         description: Cập nhật sản phẩm trong đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc đơn hàng không thể cập nhật
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn hàng hoặc sản phẩm
 */
router.put('/:id/items', protect, admin, updateOrderItems);

export default router;