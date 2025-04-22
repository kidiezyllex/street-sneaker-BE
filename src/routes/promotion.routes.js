import express from 'express';
import {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getActivePromotions
} from '../controllers/promotion.controller.js';
import { protect, admin, staff } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes công khai
router.get('/active', getActivePromotions);

// Routes quản lý khuyến mãi
router.get('/', protect, staff, getAllPromotions);
router.get('/:id', protect, staff, getPromotionById);
router.post('/', protect, staff, createPromotion);
router.put('/:id', protect, staff, updatePromotion);
router.delete('/:id', protect, admin, deletePromotion);

export default router; 