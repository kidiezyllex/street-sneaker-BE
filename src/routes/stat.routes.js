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

// Tất cả routes thống kê đều yêu cầu quyền admin hoặc staff
router.get('/overview', protect, staff, getOverviewStats);
router.get('/revenue', protect, staff, getRevenueStats);
router.get('/best-selling', protect, staff, getBestSellingProducts);
router.get('/low-stock', protect, staff, getLowStockProducts);
router.get('/potential-customers', protect, staff, getPotentialCustomers);
router.get('/growth', protect, staff, getGrowthStats);

export default router; 