import express from 'express';
import {
  getAllBills,
  getBillById,
  createBill,
  updateBill,
  updateBillStatus,
  addTransaction,
  addBillDetail,
  updateBillDetail,
  deleteBillDetail,
  getCustomerBills,
  processBillReturn,
  searchBill
} from '../controllers/bill.controller.js';
import { protect, staff } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes công khai (yêu cầu đăng nhập)
router.get('/customer', protect, getCustomerBills);
router.get('/:id', protect, getBillById);

// Routes quản lý đơn hàng
router.get('/', protect, staff, getAllBills);
router.post('/', protect, staff, createBill);
router.put('/:id', protect, staff, updateBill);
router.put('/:id/status', protect, staff, updateBillStatus);
router.post('/:id/transactions', protect, staff, addTransaction);
router.post('/:id/details', protect, staff, addBillDetail);
router.put('/:id/details/:detailId', protect, staff, updateBillDetail);
router.delete('/:id/details/:detailId', protect, staff, deleteBillDetail);
router.post('/:id/return', protect, staff, processBillReturn);
router.get('/search', protect, staff, searchBill);

export default router; 