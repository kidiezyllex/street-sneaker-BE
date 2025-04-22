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

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Thay đổi mật khẩu người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thay đổi mật khẩu thành công
 *       401:
 *         description: Mật khẩu hiện tại không chính xác
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/change-password', protect, changePassword);

/**
 * @swagger
 * /auth/update-profile:
 *   put:
 *     summary: Cập nhật thông tin hồ sơ người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               birthday:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *       404:
 *         description: Không tìm thấy tài khoản
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/update-profile', protect, updateProfile);

/**
 * @swagger
 * /auth/address:
 *   post:
 *     summary: Thêm địa chỉ mới cho người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phoneNumber
 *               - provinceId
 *               - districtId
 *               - wardId
 *               - specificAddress
 *             properties:
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               provinceId:
 *                 type: string
 *               districtId:
 *                 type: string
 *               wardId:
 *                 type: string
 *               specificAddress:
 *                 type: string
 *               type:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Thêm địa chỉ thành công
 *       404:
 *         description: Không tìm thấy tài khoản
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/address', protect, addAddress);

/**
 * @swagger
 * /auth/address/{addressId}:
 *   put:
 *     summary: Cập nhật địa chỉ của người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               provinceId:
 *                 type: string
 *               districtId:
 *                 type: string
 *               wardId:
 *                 type: string
 *               specificAddress:
 *                 type: string
 *               type:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật địa chỉ thành công
 *       404:
 *         description: Không tìm thấy tài khoản hoặc địa chỉ
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/address/:addressId', protect, updateAddress);

/**
 * @swagger
 * /auth/address/{addressId}:
 *   delete:
 *     summary: Xóa địa chỉ của người dùng
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa địa chỉ thành công
 *       404:
 *         description: Không tìm thấy tài khoản hoặc địa chỉ
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/address/:addressId', protect, deleteAddress);

/**
 * @swagger
 * /auth/address/{addressId}/default:
 *   put:
 *     summary: Đặt địa chỉ làm mặc định
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Đặt địa chỉ mặc định thành công
 *       404:
 *         description: Không tìm thấy tài khoản hoặc địa chỉ
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/address/:addressId/default', protect, setDefaultAddress);

export default router; 