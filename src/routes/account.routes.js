import express from 'express';
import {
  createStaffAccount,
  getStaffAccounts,
  getStaffAccountById,
  updateStaffAccount,
  deleteStaffAccount,
  scanStaffId,
  getCustomerAccounts,
  getCustomerAccountById,
  updateCustomerAccount,
  addAddress,
  updateAddress,
  deleteAddress,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/account.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /account/staff:
 *   post:
 *     summary: Tạo tài khoản nhân viên
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # Thêm các trường cần thiết cho nhân viên
 *     responses:
 *       201:
 *         description: Tạo tài khoản nhân viên thành công
 *       400:
 *         description: Lỗi dữ liệu đầu vào
 *       401:
 *         description: Không được phép
 */
router.post('/staff', protect, admin, createStaffAccount);

/**
 * @swagger
 * /account/staff:
 *   get:
 *     summary: Lấy danh sách tài khoản nhân viên
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng trên mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách tài khoản nhân viên
 *       401:
 *         description: Không được phép
 */
router.get('/staff', protect, admin, getStaffAccounts);

/**
 * @swagger
 * /account/staff/{id}:
 *   get:
 *     summary: Lấy thông tin tài khoản nhân viên theo ID
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tài khoản nhân viên
 *     responses:
 *       200:
 *         description: Thông tin tài khoản nhân viên
 *       404:
 *         description: Không tìm thấy tài khoản
 *       401:
 *         description: Không được phép
 */
router.get('/staff/:id', protect, admin, getStaffAccountById);

/**
 * @swagger
 * /account/staff/{id}:
 *   put:
 *     summary: Cập nhật tài khoản nhân viên
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tài khoản nhân viên
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # Thêm các trường cần cập nhật
 *     responses:
 *       200:
 *         description: Cập nhật tài khoản nhân viên thành công
 *       404:
 *         description: Không tìm thấy tài khoản
 *       401:
 *         description: Không được phép
 */
router.put('/staff/:id', protect, admin, updateStaffAccount);

/**
 * @swagger
 * /account/staff/{id}:
 *   delete:
 *     summary: Xóa tài khoản nhân viên
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tài khoản nhân viên
 *     responses:
 *       200:
 *         description: Xóa tài khoản nhân viên thành công
 *       404:
 *         description: Không tìm thấy tài khoản
 *       401:
 *         description: Không được phép
 */
router.delete('/staff/:id', protect, admin, deleteStaffAccount);

/**
 * @swagger
 * /account/staff/scan-id:
 *   post:
 *     summary: Quét CCCD/CMND nhân viên
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Thông tin nhân viên từ CCCD/CMND
 *       400:
 *         description: Lỗi dữ liệu đầu vào
 *       401:
 *         description: Không được phép
 */
router.post('/staff/scan-id', protect, admin, scanStaffId);

/**
 * @swagger
 * /account/customers:
 *   get:
 *     summary: Lấy danh sách tài khoản khách hàng
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng trên mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách tài khoản khách hàng
 *       401:
 *         description: Không được phép
 */
router.get('/customers', protect, getCustomerAccounts);

/**
 * @swagger
 * /account/customers/{id}:
 *   get:
 *     summary: Lấy thông tin tài khoản khách hàng theo ID
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tài khoản khách hàng
 *     responses:
 *       200:
 *         description: Thông tin tài khoản khách hàng
 *       404:
 *         description: Không tìm thấy tài khoản
 *       401:
 *         description: Không được phép
 */
router.get('/customers/:id', protect, getCustomerAccountById);

/**
 * @swagger
 * /account/customers/{id}:
 *   put:
 *     summary: Cập nhật tài khoản khách hàng
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tài khoản khách hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # Thêm các trường cần cập nhật
 *     responses:
 *       200:
 *         description: Cập nhật tài khoản khách hàng thành công
 *       404:
 *         description: Không tìm thấy tài khoản
 *       401:
 *         description: Không được phép
 */
router.put('/customers/:id', protect, updateCustomerAccount);

/**
 * @swagger
 * /account/customers/{id}/addresses:
 *   post:
 *     summary: Thêm địa chỉ cho khách hàng
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tài khoản khách hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # Thêm các trường địa chỉ
 *     responses:
 *       200:
 *         description: Thêm địa chỉ thành công
 *       404:
 *         description: Không tìm thấy tài khoản
 *       401:
 *         description: Không được phép
 */
router.post('/customers/:id/addresses', protect, addAddress);

/**
 * @swagger
 * /account/customers/{id}/addresses/{addressId}:
 *   put:
 *     summary: Cập nhật địa chỉ khách hàng
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tài khoản khách hàng
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID địa chỉ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # Thêm các trường địa chỉ
 *     responses:
 *       200:
 *         description: Cập nhật địa chỉ thành công
 *       404:
 *         description: Không tìm thấy tài khoản hoặc địa chỉ
 *       401:
 *         description: Không được phép
 */
router.put('/customers/:id/addresses/:addressId', protect, updateAddress);

/**
 * @swagger
 * /account/customers/{id}/addresses/{addressId}:
 *   delete:
 *     summary: Xóa địa chỉ khách hàng
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID tài khoản khách hàng
 *       - in: path
 *         name: addressId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID địa chỉ
 *     responses:
 *       200:
 *         description: Xóa địa chỉ thành công
 *       404:
 *         description: Không tìm thấy tài khoản hoặc địa chỉ
 *       401:
 *         description: Không được phép
 */
router.delete('/customers/:id/addresses/:addressId', protect, deleteAddress);

/**
 * @swagger
 * /account/profile:
 *   get:
 *     summary: Lấy hồ sơ cá nhân
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy hồ sơ thành công
 *       401:
 *         description: Không được phép
 */
router.get('/profile', protect, getProfile);

/**
 * @swagger
 * /account/profile:
 *   put:
 *     summary: Cập nhật hồ sơ cá nhân
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             # Thêm các trường cần cập nhật
 *     responses:
 *       200:
 *         description: Cập nhật hồ sơ thành công
 *       401:
 *         description: Không được phép
 */
router.put('/profile', protect, updateProfile);

/**
 * @swagger
 * /account/profile/password:
 *   put:
 *     summary: Đổi mật khẩu
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Lỗi dữ liệu đầu vào
 *       401:
 *         description: Không được phép
 */
router.put('/profile/password', protect, changePassword);

export default router; 