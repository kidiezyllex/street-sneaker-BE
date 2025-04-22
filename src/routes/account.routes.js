import express from 'express';
import {
  getAllAccounts,
  getAccountById,
  createStaffAccount,
  updateAccount,
  updateAccountStatus,
  deleteAccount
} from '../controllers/account.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes quản lý tài khoản (chỉ admin)
router.get('/', protect, admin, getAllAccounts);
router.get('/:id', protect, admin, getAccountById);
router.post('/staff', protect, admin, createStaffAccount);
router.put('/:id', protect, admin, updateAccount);
router.put('/:id/status', protect, admin, updateAccountStatus);
router.delete('/:id', protect, admin, deleteAccount);

export default router; 