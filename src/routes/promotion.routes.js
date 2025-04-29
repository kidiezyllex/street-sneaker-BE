import express from 'express';
import {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getActivePromotions,
  getAllVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  addCustomerToVoucher,
  removeCustomerFromVoucher,
  createProductPromotion,
  getProductPromotions,
  searchProductPromotions,
  searchVouchers,
  deleteProductPromotion,
  updateProductPromotion
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
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Sắp xếp kết quả
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Lọc theo tên
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Lọc theo mã
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Lọc theo loại
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc từ ngày
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Lọc đến ngày
 *     responses:
 *       200:
 *         description: Danh sách khuyến mãi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
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
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       500:
 *         description: Lỗi server
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
 *         description: Thông tin chi tiết khuyến mãi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy thông tin khuyến mãi thành công
 *                 data:
 *                   $ref: '#/components/schemas/Promotion'
 *       404:
 *         description: Không tìm thấy khuyến mãi
 *       500:
 *         description: Lỗi server
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
 *               - type
 *               - value
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên khuyến mãi
 *               type:
 *                 type: string
 *                 enum: [PHAN_TRAM, TIEN_MAT]
 *                 description: Loại khuyến mãi
 *               value:
 *                 type: number
 *                 description: Giá trị khuyến mãi
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian bắt đầu
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian kết thúc
 *               description:
 *                 type: string
 *                 description: Mô tả khuyến mãi
 *     responses:
 *       201:
 *         description: Tạo khuyến mãi thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       500:
 *         description: Lỗi server
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
 *               type:
 *                 type: string
 *                 enum: [PHAN_TRAM, TIEN_MAT]
 *               value:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [DANG_HOAT_DONG, NGUNG_HOAT_DONG]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật khuyến mãi thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy khuyến mãi
 *       500:
 *         description: Lỗi server
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
 *         description: Xóa khuyến mãi thành công
 *       404:
 *         description: Không tìm thấy khuyến mãi
 *       500:
 *         description: Lỗi server
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
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách khuyến mãi đang hoạt động thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Promotion'
 *       500:
 *         description: Lỗi server
 */
router.get('/active', getActivePromotions);

/**
 * @swagger
 * /promotions/vouchers:
 *   get:
 *     summary: Lấy danh sách tất cả voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc mã voucher
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
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
 *         description: Số voucher trên mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách voucher
 *       500:
 *         description: Lỗi server
 */
router.get('/vouchers', protect, admin, getAllVouchers);

/**
 * @swagger
 * /promotions/vouchers/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID voucher
 *     responses:
 *       200:
 *         description: Thông tin chi tiết voucher
 *       404:
 *         description: Không tìm thấy voucher
 *       500:
 *         description: Lỗi server
 */
router.get('/vouchers/:id', protect, admin, getVoucherById);

/**
 * @swagger
 * /promotions/vouchers:
 *   post:
 *     summary: Tạo voucher mới
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountType
 *               - discountValue
 *               - startDate
 *               - endDate
 *             properties:
 *               code:
 *                 type: string
 *                 description: Mã voucher
 *               name:
 *                 type: string
 *                 description: Tên voucher
 *               description:
 *                 type: string
 *                 description: Mô tả voucher
 *               discountType:
 *                 type: string
 *                 enum: [PHAN_TRAM, TIEN_MAT]
 *                 description: Loại giảm giá
 *               discountValue:
 *                 type: number
 *                 description: Giá trị giảm giá
 *               minOrderValue:
 *                 type: number
 *                 description: Giá trị đơn hàng tối thiểu
 *               maxDiscountValue:
 *                 type: number
 *                 description: Giá trị giảm tối đa
 *               quantity:
 *                 type: number
 *                 description: Số lượng voucher
 *               usageLimit:
 *                 type: number
 *                 description: Giới hạn sử dụng cho mỗi người dùng
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian bắt đầu
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian kết thúc
 *     responses:
 *       201:
 *         description: Tạo voucher thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/vouchers', protect, admin, createVoucher);

/**
 * @swagger
 * /promotions/vouchers/{id}:
 *   put:
 *     summary: Cập nhật voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID voucher
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [PHAN_TRAM, TIEN_MAT]
 *               discountValue:
 *                 type: number
 *               minOrderValue:
 *                 type: number
 *               maxDiscountValue:
 *                 type: number
 *               quantity:
 *                 type: number
 *               usageLimit:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật voucher thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy voucher
 */
router.put('/vouchers/:id', protect, admin, updateVoucher);

/**
 * @swagger
 * /promotions/vouchers/{id}/customers:
 *   post:
 *     summary: Thêm khách hàng vào voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID voucher
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *             properties:
 *               accountId:
 *                 type: string
 *                 description: ID khách hàng
 *     responses:
 *       200:
 *         description: Thêm khách hàng vào voucher thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc khách hàng đã được thêm vào voucher này
 *       404:
 *         description: Không tìm thấy voucher
 *       500:
 *         description: Lỗi server
 */
router.post('/vouchers/:id/customers', protect, admin, addCustomerToVoucher);

/**
 * @swagger
 * /promotions/vouchers/{id}/customers/{customerId}:
 *   delete:
 *     summary: Xóa khách hàng khỏi voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID voucher
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID khách hàng trong voucher
 *     responses:
 *       200:
 *         description: Xóa khách hàng khỏi voucher thành công
 *       404:
 *         description: Không tìm thấy voucher hoặc khách hàng
 *       500:
 *         description: Lỗi server
 */
router.delete('/vouchers/:id/customers/:customerId', protect, admin, removeCustomerFromVoucher);

/**
 * @swagger
 * /promotions/vouchers/search:
 *   get:
 *     summary: Tìm kiếm voucher
 *     tags: [Vouchers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Loại voucher
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Trạng thái voucher
 *       - in: query
 *         name: minDiscount
 *         schema:
 *           type: number
 *         description: Giá trị giảm giá tối thiểu
 *       - in: query
 *         name: maxDiscount
 *         schema:
 *           type: number
 *         description: Giá trị giảm giá tối đa
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
 *         description: Số kết quả trên mỗi trang
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm
 *       400:
 *         description: Lỗi truy vấn
 */
router.get('/vouchers/search', protect, admin, searchVouchers);

/**
 * @swagger
 * /promotions/products:
 *   post:
 *     summary: Tạo khuyến mãi sản phẩm mới
 *     tags: [ProductPromotions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - discountType
 *               - discountValue
 *               - startDate
 *               - endDate
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID sản phẩm
 *               name:
 *                 type: string
 *                 description: Tên khuyến mãi
 *               description:
 *                 type: string
 *                 description: Mô tả khuyến mãi
 *               discountType:
 *                 type: string
 *                 enum: [PHAN_TRAM, TIEN_MAT]
 *                 description: Loại giảm giá
 *               discountValue:
 *                 type: number
 *                 description: Giá trị giảm giá
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian bắt đầu
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian kết thúc
 *     responses:
 *       201:
 *         description: Tạo khuyến mãi sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/products', protect, admin, createProductPromotion);

/**
 * @swagger
 * /promotions/products:
 *   get:
 *     summary: Lấy danh sách khuyến mãi sản phẩm
 *     tags: [ProductPromotions]
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
 *         description: Số kết quả trên mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách khuyến mãi sản phẩm
 *       400:
 *         description: Lỗi truy vấn
 */
router.get('/products', protect, admin, getProductPromotions);

/**
 * @swagger
 * /promotions/products/search:
 *   get:
 *     summary: Tìm kiếm khuyến mãi sản phẩm
 *     tags: [ProductPromotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái
 *       - in: query
 *         name: minDiscount
 *         schema:
 *           type: number
 *         description: Giá trị giảm giá tối thiểu
 *       - in: query
 *         name: maxDiscount
 *         schema:
 *           type: number
 *         description: Giá trị giảm giá tối đa
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
 *         description: Số kết quả trên mỗi trang
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm
 *       400:
 *         description: Lỗi truy vấn
 */
router.get('/products/search', protect, admin, searchProductPromotions);

/**
 * @swagger
 * /promotions/products/{id}:
 *   put:
 *     summary: Cập nhật khuyến mãi sản phẩm
 *     tags: [ProductPromotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID khuyến mãi sản phẩm
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
 *               discountType:
 *                 type: string
 *                 enum: [PHAN_TRAM, TIEN_MAT]
 *               discountValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật khuyến mãi sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy khuyến mãi sản phẩm
 */
router.put('/products/:id', protect, admin, updateProductPromotion);

/**
 * @swagger
 * /promotions/products/{id}:
 *   delete:
 *     summary: Xóa khuyến mãi sản phẩm
 *     tags: [ProductPromotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID khuyến mãi sản phẩm
 *     responses:
 *       200:
 *         description: Xóa khuyến mãi sản phẩm thành công
 *       404:
 *         description: Không tìm thấy khuyến mãi sản phẩm
 *       500:
 *         description: Lỗi server
 */
router.delete('/products/:id', protect, admin, deleteProductPromotion);

export default router;
