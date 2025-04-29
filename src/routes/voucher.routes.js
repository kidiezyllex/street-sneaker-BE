import express from 'express';
import {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
  incrementVoucherUsage,
  notifyVoucher
} from '../controllers/voucher.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/vouchers:
 *   post:
 *     summary: Tạo phiếu giảm giá mới
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
 *               - name
 *               - type
 *               - value
 *               - quantity
 *               - startDate
 *               - endDate
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã voucher (duy nhất)
 *               name:
 *                 type: string
 *                 description: Tên chương trình
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED_AMOUNT]
 *                 description: Loại giảm giá (% hoặc số tiền cố định)
 *               value:
 *                 type: number
 *                 description: Giá trị giảm (% hoặc số tiền)
 *               quantity:
 *                 type: number
 *                 description: Số lượng voucher
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian bắt đầu
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian kết thúc
 *               minOrderValue:
 *                 type: number
 *                 description: Giá trị đơn hàng tối thiểu
 *                 default: 0
 *               maxDiscount:
 *                 type: number
 *                 description: Số tiền giảm tối đa (cho loại %)
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *                 default: HOAT_DONG
 *     responses:
 *       201:
 *         description: Tạo voucher thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', authenticate, authorizeAdmin, createVoucher);

/**
 * @swagger
 * /api/vouchers:
 *   get:
 *     summary: Lấy danh sách phiếu giảm giá
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Lọc theo mã voucher
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Lọc theo tên voucher
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *         description: Lọc theo trạng thái
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
 *         description: Số lượng mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách voucher thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/', authenticate, authorizeAdmin, getVouchers);

/**
 * @swagger
 * /api/vouchers/{id}:
 *   get:
 *     summary: Lấy chi tiết phiếu giảm giá
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiếu giảm giá
 *     responses:
 *       200:
 *         description: Lấy thông tin voucher thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy voucher
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:id', authenticate, authorizeAdmin, getVoucherById);

/**
 * @swagger
 * /api/vouchers/{id}:
 *   put:
 *     summary: Cập nhật phiếu giảm giá
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiếu giảm giá
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên chương trình
 *               quantity:
 *                 type: number
 *                 description: Số lượng voucher
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian bắt đầu
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian kết thúc
 *               minOrderValue:
 *                 type: number
 *                 description: Giá trị đơn hàng tối thiểu
 *               maxDiscount:
 *                 type: number
 *                 description: Số tiền giảm tối đa (cho loại %)
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *     responses:
 *       200:
 *         description: Cập nhật voucher thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy voucher
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id', authenticate, authorizeAdmin, updateVoucher);

/**
 * @swagger
 * /api/vouchers/{id}:
 *   delete:
 *     summary: Xóa phiếu giảm giá
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiếu giảm giá
 *     responses:
 *       200:
 *         description: Xóa voucher thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy voucher
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteVoucher);

/**
 * @swagger
 * /api/vouchers/validate:
 *   post:
 *     summary: Kiểm tra mã voucher hợp lệ
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
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã voucher cần kiểm tra
 *               orderValue:
 *                 type: number
 *                 description: Giá trị đơn hàng để tính giảm giá
 *     responses:
 *       200:
 *         description: Voucher hợp lệ
 *       400:
 *         description: Voucher không hợp lệ hoặc không đủ điều kiện
 *       404:
 *         description: Không tìm thấy voucher
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/validate', authenticate, validateVoucher);

/**
 * @swagger
 * /api/vouchers/{id}/increment-usage:
 *   put:
 *     summary: Tăng số lượt sử dụng voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiếu giảm giá
 *     responses:
 *       200:
 *         description: Cập nhật lượt sử dụng thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy voucher
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id/increment-usage', authenticate, authorizeAdmin, incrementVoucherUsage);

/**
 * @swagger
 * /api/vouchers/{id}/notify:
 *   post:
 *     summary: Gửi thông báo về voucher đến tất cả khách hàng
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID phiếu giảm giá
 *     responses:
 *       200:
 *         description: Gửi thông báo thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy voucher
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/:id/notify', authenticate, authorizeAdmin, notifyVoucher);

export default router; 