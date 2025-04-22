import express from 'express';
import {
  getAllVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  addCustomerToVoucher,
  removeCustomerFromVoucher,
  checkVoucher,
  getCustomerVouchers
} from '../controllers/voucher.controller.js';
import { protect, admin, staff } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes công khai (yêu cầu đăng nhập)
router.get('/customer', protect, getCustomerVouchers);
router.post('/check', protect, checkVoucher);

// Routes quản lý voucher
router.get('/', protect, staff, getAllVouchers);
router.get('/:id', protect, staff, getVoucherById);
router.post('/', protect, admin, createVoucher);
router.put('/:id', protect, admin, updateVoucher);
router.delete('/:id', protect, admin, deleteVoucher);

// Routes quản lý khách hàng và voucher
router.post('/:id/customers', protect, staff, addCustomerToVoucher);
router.delete('/:id/customers/:customerId', protect, staff, removeCustomerFromVoucher);

export default router; 