import express from 'express';
import {
  createReturn,
  getReturns,
  getReturnById,
  updateReturnStatus,
  scanOrderQR
} from '../controllers/return.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /returns:
 *   get:
 *     summary: Lấy danh sách đơn trả hàng
 *     tags: [Returns]
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
 *         description: Số đơn trả hàng trên mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: Lọc theo trạng thái đơn trả hàng
 *     responses:
 *       200:
 *         description: Danh sách đơn trả hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 returns:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Return'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       400:
 *         description: Lỗi truy vấn
 *       401:
 *         description: Không có quyền truy cập
 */
router.get('/', protect, admin, getReturns);

/**
 * @swagger
 * /returns/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết đơn trả hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn trả hàng
 *     responses:
 *       200:
 *         description: Thông tin chi tiết đơn trả hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Return'
 *       400:
 *         description: Lỗi truy vấn
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn trả hàng
 */
router.get('/:id', protect, admin, getReturnById);

/**
 * @swagger
 * /returns/orders/{id}:
 *   post:
 *     summary: Tạo đơn trả hàng mới
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
 *             required:
 *               - items
 *               - reason
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
 *                       description: Số lượng trả
 *               reason:
 *                 type: string
 *                 description: Lý do trả hàng
 *     responses:
 *       201:
 *         description: Tạo đơn trả hàng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc đã quá thời hạn trả hàng
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.post('/orders/:id', protect, createReturn);

/**
 * @swagger
 * /returns/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái đơn trả hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn trả hàng
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
 *                 enum: [PENDING, APPROVED, REJECTED]
 *                 description: Trạng thái mới của đơn trả hàng
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái đơn trả hàng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn trả hàng
 */
router.put('/:id/status', protect, admin, updateReturnStatus);

/**
 * @swagger
 * /returns/scan:
 *   post:
 *     summary: Quét mã QR đơn hàng để trả hàng
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrCode
 *             properties:
 *               qrCode:
 *                 type: string
 *                 description: Mã QR của đơn hàng
 *     responses:
 *       200:
 *         description: Thông tin đơn hàng từ mã QR
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Mã QR không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.post('/scan', protect, scanOrderQR);

export default router;
