import express from 'express';
import {
  getAllVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  addCustomerToVoucher,
  removeCustomerFromVoucher,
  checkVoucher,
  getCustomerVouchers,
  getActiveVouchers
} from '../controllers/voucher.controller.js';
import { protect, admin, staff } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /vouchers:
 *   get:
 *     summary: Lấy danh sách tất cả voucher
 *     tags: [Vouchers]
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
 *         description: Số voucher trên mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách voucher
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách voucher thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     vouchers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Voucher'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Không được phép
 */
router.get('/', protect, staff, getAllVouchers);

/**
 * @swagger
 * /vouchers/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID voucher
 *     responses:
 *       200:
 *         description: Thông tin voucher
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin voucher thành công
 *                 data:
 *                   $ref: '#/components/schemas/Voucher'
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy voucher
 */
router.get('/:id', protect, staff, getVoucherById);

/**
 * @swagger
 * /vouchers:
 *   post:
 *     summary: Tạo voucher mới
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discount
 *               - startDate
 *               - endDate
 *               - quantity
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã voucher
 *               description:
 *                 type: string
 *                 description: Mô tả voucher
 *               discount:
 *                 type: number
 *                 description: Phần trăm giảm giá
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày bắt đầu
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày kết thúc
 *               quantity:
 *                 type: integer
 *                 description: Số lượng voucher
 *               minPurchase:
 *                 type: number
 *                 description: Giá trị đơn hàng tối thiểu
 *               maxDiscount:
 *                 type: number
 *                 description: Giá trị giảm tối đa
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Trạng thái hoạt động
 *     responses:
 *       201:
 *         description: Tạo voucher thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 */
router.post('/', protect, admin, createVoucher);

/**
 * @swagger
 * /vouchers/{id}:
 *   put:
 *     summary: Cập nhật voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID voucher
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               discount:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               quantity:
 *                 type: integer
 *               minPurchase:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy voucher
 */
router.put('/:id', protect, admin, updateVoucher);

/**
 * @swagger
 * /vouchers/{id}:
 *   delete:
 *     summary: Xóa voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID voucher
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy voucher
 */
router.delete('/:id', protect, admin, deleteVoucher);

/**
 * @swagger
 * /vouchers/active:
 *   get:
 *     summary: Lấy danh sách voucher đang hoạt động
 *     tags: [Vouchers]
 *     responses:
 *       200:
 *         description: Danh sách voucher đang hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách voucher thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Voucher'
 */
router.get('/active', getActiveVouchers);

/**
 * @swagger
 * /vouchers/check:
 *   post:
 *     summary: Kiểm tra và áp dụng voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - totalAmount
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã voucher
 *               totalAmount:
 *                 type: number
 *                 description: Tổng giá trị đơn hàng
 *     responses:
 *       200:
 *         description: Kiểm tra voucher thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Kiểm tra voucher thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     discount:
 *                       type: number
 *                       description: Giá trị giảm
 *                     finalAmount:
 *                       type: number
 *                       description: Giá trị cuối cùng
 *       400:
 *         description: Voucher không hợp lệ hoặc đã hết hạn
 *       401:
 *         description: Không được phép
 */
router.post('/check', protect, checkVoucher);

// Routes quản lý khách hàng và voucher
router.post('/:id/customers', protect, staff, addCustomerToVoucher);
router.delete('/:id/customers/:customerId', protect, staff, removeCustomerFromVoucher);

export default router; 