import express from 'express';
import {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getActivePromotions,
  createVoucher,
  getVoucherById,
  updateVoucher,
  createProductPromotion,
  getProductPromotions,
  updateProductPromotion,
  searchVouchers,
  searchProductPromotions,
  deleteProductPromotion
} from '../controllers/promotion.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /promotions:
 *   get:
 *     summary: Lấy danh sách tất cả khuyến mãi
 *     tags: [Promotions]
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
 *         description: Số khuyến mãi trên mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách khuyến mãi
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
 *                   example: Lấy danh sách khuyến mãi thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     promotions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Promotion'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Không được phép
 */
router.get('/', protect, admin, getAllPromotions);

/**
 * @swagger
 * /promotions/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết khuyến mãi
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID khuyến mãi
 *     responses:
 *       200:
 *         description: Thông tin khuyến mãi
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
 *                   example: Lấy thông tin khuyến mãi thành công
 *                 data:
 *                   $ref: '#/components/schemas/Promotion'
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy khuyến mãi
 */
router.get('/:id', protect, admin, getPromotionById);

/**
 * @swagger
 * /promotions:
 *   post:
 *     summary: Tạo khuyến mãi mới
 *     tags: [Promotions]
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
 *               - description
 *               - discount
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên khuyến mãi
 *               description:
 *                 type: string
 *                 description: Mô tả khuyến mãi
 *               discount:
 *                 type: number
 *                 description: Phần trăm giảm giá
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày bắt đầu
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Ngày kết thúc
 *               minPurchase:
 *                 type: number
 *                 description: Giá trị đơn hàng tối thiểu
 *               maxDiscount:
 *                 type: number
 *                 description: Giá trị giảm tối đa
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Trạng thái hoạt động
 *     responses:
 *       201:
 *         description: Tạo khuyến mãi thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 */
router.post('/', protect, admin, createPromotion);

/**
 * @swagger
 * /promotions/{id}:
 *   put:
 *     summary: Cập nhật khuyến mãi
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID khuyến mãi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               discount:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               minPurchase:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy khuyến mãi
 */
router.put('/:id', protect, admin, updatePromotion);

/**
 * @swagger
 * /promotions/{id}:
 *   delete:
 *     summary: Xóa khuyến mãi
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID khuyến mãi
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy khuyến mãi
 */
router.delete('/:id', protect, admin, deletePromotion);

/**
 * @swagger
 * /promotions/active:
 *   get:
 *     summary: Lấy danh sách khuyến mãi đang hoạt động
 *     tags: [Promotions]
 *     responses:
 *       200:
 *         description: Danh sách khuyến mãi đang hoạt động
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
 *                   example: Lấy danh sách khuyến mãi thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Promotion'
 */
router.get('/active', getActivePromotions);

// Quản lý mã giảm giá
router.post('/vouchers', protect, admin, createVoucher);
router.get('/vouchers/:id', protect, getVoucherById);
router.put('/vouchers/:id', protect, admin, updateVoucher);

// Quản lý khuyến mãi sản phẩm
router.post('/product-promotions', protect, admin, createProductPromotion);
router.get('/product-promotions', protect, getProductPromotions);
router.put('/product-promotions/:id', protect, admin, updateProductPromotion);
router.delete('/product-promotions/:id', protect, admin, deleteProductPromotion);

// Lọc và tìm kiếm
router.get('/vouchers/search', searchVouchers);
router.get('/product-promotions/search', searchProductPromotions);

export default router; 