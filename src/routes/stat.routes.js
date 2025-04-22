import express from 'express';
import * as statController from '../controllers/stat.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

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
router.get('/overview', protect, admin, statController.getOverviewStats);

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
router.get('/revenue', protect, admin, statController.getRevenueStats);
router.get('/revenue/daily', protect, admin, statController.getRevenueStats);
router.get('/revenue/monthly', protect, admin, statController.getRevenueStats);
router.get('/revenue/yearly', protect, admin, statController.getRevenueStats);

/**
 * @swagger
 * /stats/orders:
 *   get:
 *     summary: Lấy thống kê đơn hàng
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
 *         description: Thống kê đơn hàng
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
 *                   example: Lấy thống kê đơn hàng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                       description: Tổng số đơn hàng
 *                     ordersByStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           orderCount:
 *                             type: integer
 *                     ordersByPaymentMethod:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           paymentMethod:
 *                             type: string
 *                           orderCount:
 *                             type: integer
 *       401:
 *         description: Không được phép
 */
router.get('/orders', protect, admin, statController.getOrderStat);
router.get('/orders/status', protect, admin, statController.getOrderStat);
router.get('/orders/payment-methods', protect, admin, statController.getOrderStat);

/**
 * @swagger
 * /stats/products:
 *   get:
 *     summary: Lấy thống kê sản phẩm
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
 *         description: Thống kê sản phẩm
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
 *                   example: Lấy thống kê sản phẩm thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: integer
 *                       description: Tổng số sản phẩm
 *                     productsByCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           productCount:
 *                             type: integer
 *                     productsBySeller:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           seller:
 *                             type: string
 *                           productCount:
 *                             type: integer
 *                     productsByLowStock:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product:
 *                             $ref: '#/components/schemas/Product'
 *                           quantity:
 *                             type: integer
 *       401:
 *         description: Không được phép
 */
router.get('/products', protect, admin, statController.getInventoryStat);
router.get('/products/best-sellers', protect, admin, statController.getTopSellingProducts);
router.get('/products/low-stock', protect, admin, statController.getInventoryStat);

/**
 * @swagger
 * /stats/customers:
 *   get:
 *     summary: Lấy thống kê khách hàng
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
 *         description: Thống kê khách hàng
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
 *                   example: Lấy thống kê khách hàng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCustomers:
 *                       type: integer
 *                       description: Tổng số khách hàng
 *                     customersByTop:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           customer:
 *                             $ref: '#/components/schemas/Customer'
 *                           totalSpent:
 *                             type: number
 *                           orderCount:
 *                             type: integer
 *       401:
 *         description: Không được phép
 */
router.get('/customers', protect, admin, statController.getCustomerStat);
router.get('/customers/top', protect, admin, statController.getPotentialCustomers);

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
router.get('/growth', protect, admin, statController.getGrowthStats);

export default router; 