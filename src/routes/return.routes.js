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

// Routes cho quản lý trả hàng
router.post('/', protect, createReturn);
router.get('/', protect, admin, getReturns);
router.get('/:id', protect, admin, getReturnById);
router.put('/:id/status', protect, admin, updateReturnStatus);
router.post('/scan-qr', protect, admin, scanOrderQR);

export default router; 