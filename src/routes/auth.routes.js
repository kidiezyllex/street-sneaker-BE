import express from 'express';
import {
  login,
  register,
  getCurrentAccount,
  changePassword,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../controllers/auth.controller.js';
import { protect, authenticate, restrictTo } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
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
 *                   example: Đăng nhập thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     password:
 *                       type: string
 *                     role:
 *                       type: string
 *                     token:
 *                       type: string
 *                 errors:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Thông tin đăng nhập không hợp lệ
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     description: Đăng ký người dùng mới. employeeId sẽ được tạo tự động.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Tên đăng nhập duy nhất
 *               fullName:
 *                 type: string
 *                 description: Họ tên đầy đủ
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Địa chỉ email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mật khẩu
 *               role:
 *                 type: string
 *                 enum: [employee, admin]
 *                 default: employee
 *                 description: Vai trò người dùng
 *     responses:
 *       201:
 *         description: Đăng ký thành công
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
 *                   example: Đăng ký thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     password:
 *                       type: string
 *                     role:
 *                       type: string
 *                     token:
 *                       type: string
 *                 errors:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc người dùng đã tồn tại
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Lấy thông tin người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
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
 *                   example: Lấy thông tin người dùng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     department:
 *                       type: string
 *                     position:
 *                       type: string
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *                     bio:
 *                       type: string
 *                     joinDate:
 *                       type: string
 *                       format: date-time
 *                     employeeId:
 *                       type: string
 *                 errors:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Không được phép truy cập
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.get('/profile', protect, getCurrentAccount);

// Routes yêu cầu xác thực
router.put('/change-password', protect, changePassword);
router.put('/update-profile', protect, updateProfile);

// Routes quản lý địa chỉ
router.post('/address', protect, addAddress);
router.put('/address/:addressId', protect, updateAddress);
router.delete('/address/:addressId', protect, deleteAddress);
router.put('/address/:addressId/default', protect, setDefaultAddress);

export default router; 