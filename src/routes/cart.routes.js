import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cart.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Tất cả routes giỏ hàng đều yêu cầu xác thực
router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.put('/:itemId', protect, updateCartItem);
router.delete('/:itemId', protect, removeFromCart);
router.delete('/', protect, clearCart);

export default router; 