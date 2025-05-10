import express from 'express';
import {
  getStatistics,
  getStatisticById,
  createStatistic,
  updateStatistic,
  deleteStatistic,
  getRevenueReport,
  getTopProducts,
  generateDailyStatistic
} from '../controllers/statistic.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /statistics:
 *   get:
 *     summary: Lấy danh sách thống kê
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
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
 *         description: Lấy danh sách thống kê thành công
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/', authenticate, authorizeAdmin, getStatistics);

/**
 * @swagger
 * /statistics/{id}:
 *   get:
 *     summary: Lấy chi tiết thống kê
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thông tin thống kê thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy thống kê
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:id', authenticate, authorizeAdmin, getStatisticById);

/**
 * @swagger
 * /statistics:
 *   post:
 *     summary: Tạo thống kê mới
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - type
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               type:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *               totalOrders:
 *                 type: number
 *               totalRevenue:
 *                 type: number
 *               totalProfit:
 *                 type: number
 *               productsSold:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     revenue:
 *                       type: number
 *               vouchersUsed:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     voucher:
 *                       type: string
 *                     usageCount:
 *                       type: number
 *                     totalDiscount:
 *                       type: number
 *               customerCount:
 *                 type: object
 *                 properties:
 *                   new:
 *                     type: number
 *                   total:
 *                     type: number
 *     responses:
 *       201:
 *         description: Tạo thống kê thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', authenticate, authorizeAdmin, createStatistic);

/**
 * @swagger
 * /statistics/{id}:
 *   put:
 *     summary: Cập nhật thống kê
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalOrders:
 *                 type: number
 *               totalRevenue:
 *                 type: number
 *               totalProfit:
 *                 type: number
 *               productsSold:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     revenue:
 *                       type: number
 *               vouchersUsed:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     voucher:
 *                       type: string
 *                     usageCount:
 *                       type: number
 *                     totalDiscount:
 *                       type: number
 *               customerCount:
 *                 type: object
 *                 properties:
 *                   new:
 *                     type: number
 *                   total:
 *                     type: number
 *     responses:
 *       200:
 *         description: Cập nhật thống kê thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy thống kê
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id', authenticate, authorizeAdmin, updateStatistic);

/**
 * @swagger
 * /statistics/{id}:
 *   delete:
 *     summary: Xóa thống kê
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thống kê thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy thống kê
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteStatistic);

/**
 * @swagger
 * /statistics/revenue:
 *   get:
 *     summary: Lấy báo cáo doanh thu
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *           default: DAILY
 *     responses:
 *       200:
 *         description: Lấy báo cáo doanh thu thành công
 *       400:
 *         description: Thiếu tham số bắt buộc
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/revenue', authenticate, authorizeAdmin, getRevenueReport);

/**
 * @swagger
 * /statistics/top-products:
 *   get:
 *     summary: Lấy báo cáo sản phẩm bán chạy
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm bán chạy thành công
 *       400:
 *         description: Thiếu tham số bắt buộc
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/top-products', authenticate, authorizeAdmin, getTopProducts);

/**
 * @swagger
 * /statistics/generate-daily:
 *   post:
 *     summary: Tạo thống kê theo ngày
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Tạo thống kê ngày thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc đã tồn tại thống kê cho ngày này
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/generate-daily', authenticate, authorizeAdmin, generateDailyStatistic);

export default router; 