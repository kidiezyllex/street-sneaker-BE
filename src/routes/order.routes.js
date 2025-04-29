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

// Routes cho quản lý đơn hàng
router.get('/', protect, admin, getOrders);
router.get('/:id', protect, admin, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/shipping', protect, admin, updateShippingInfo);
router.put('/:id/items', protect, admin, updateOrderItems);

export default router;