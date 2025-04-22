import express from 'express';
import {
  getOverviewStats,
  getRevenueStats,
  getBestSellingProducts,
  getLowStockProducts,
  getPotentialCustomers,
  getGrowthStats
} from '../controllers/stat.controller.js';
import { protect, staff } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /stats/overview:
 *   get:
 *     summary: Lấy thống kê tổng quan
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *     responses:
 *       200:
 *         description: Thống kê tổng quan
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
 *                   example: Lấy thống kê tổng quan thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       description: Tổng doanh thu
 *                     totalOrders:
 *                       type: integer
 *                       description: Tổng số đơn hàng
 *                     totalCustomers:
 *                       type: integer
 *                       description: Tổng số khách hàng
 *                     totalProducts:
 *                       type: integer
 *                       description: Tổng số sản phẩm
 *                     revenueByDay:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           revenue:
 *                             type: number
 *       401:
 *         description: Không được phép
 */
router.get('/overview', protect, staff, getOverviewStats);

/**
 * @swagger
 * /stats/revenue:
 *   get:
 *     summary: Lấy thống kê doanh thu
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: day
 *         description: Nhóm theo
 *     responses:
 *       200:
 *         description: Thống kê doanh thu
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
 *                   example: Lấy thống kê doanh thu thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       description: Tổng doanh thu
 *                     revenueByPeriod:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           revenue:
 *                             type: number
 *                     revenueByCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           revenue:
 *                             type: number
 *       401:
 *         description: Không được phép
 */
router.get('/revenue', protect, staff, getRevenueStats);

/**
 * @swagger
 * /stats/best-selling:
 *   get:
 *     summary: Lấy danh sách sản phẩm bán chạy nhất
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số sản phẩm cần lấy
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm bán chạy nhất
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
 *                   example: Lấy danh sách sản phẩm bán chạy nhất thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         $ref: '#/components/schemas/Product'
 *                       quantity:
 *                         type: integer
 *                       revenue:
 *                         type: number
 *       401:
 *         description: Không được phép
 */
router.get('/best-selling', protect, staff, getBestSellingProducts);

/**
 * @swagger
 * /stats/low-stock:
 *   get:
 *     summary: Lấy danh sách sản phẩm sắp hết hàng
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số sản phẩm cần lấy
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Ngưỡng số lượng tồn kho
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm sắp hết hàng
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
 *                   example: Lấy danh sách sản phẩm sắp hết hàng thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         $ref: '#/components/schemas/Product'
 *                       quantity:
 *                         type: integer
 *       401:
 *         description: Không được phép
 */
router.get('/low-stock', protect, staff, getLowStockProducts);

/**
 * @swagger
 * /stats/potential-customers:
 *   get:
 *     summary: Lấy danh sách khách hàng tiềm năng
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số khách hàng cần lấy
 *     responses:
 *       200:
 *         description: Danh sách khách hàng tiềm năng
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
 *                   example: Lấy danh sách khách hàng tiềm năng thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       customer:
 *                         $ref: '#/components/schemas/Customer'
 *                       totalSpent:
 *                         type: number
 *                       orderCount:
 *                         type: integer
 *       401:
 *         description: Không được phép
 */
router.get('/potential-customers', protect, staff, getPotentialCustomers);

/**
 * @swagger
 * /stats/growth:
 *   get:
 *     summary: Lấy thống kê tăng trưởng
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *       - in: query
 *         name: compareWith
 *         schema:
 *           type: string
 *           enum: [previous_period, same_period_last_year]
 *           default: previous_period
 *         description: So sánh với
 *     responses:
 *       200:
 *         description: Thống kê tăng trưởng
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
 *                   example: Lấy thống kê tăng trưởng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     revenueGrowth:
 *                       type: number
 *                       description: Tăng trưởng doanh thu (%)
 *                     orderGrowth:
 *                       type: number
 *                       description: Tăng trưởng số đơn hàng (%)
 *                     customerGrowth:
 *                       type: number
 *                       description: Tăng trưởng số khách hàng (%)
 *                     averageOrderValueGrowth:
 *                       type: number
 *                       description: Tăng trưởng giá trị đơn hàng trung bình (%)
 *       401:
 *         description: Không được phép
 */
router.get('/growth', protect, staff, getGrowthStats);

export default router; 