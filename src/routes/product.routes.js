import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
  addProductImage,
  updateProductImage,
  deleteProductImage,
  addProductPromotion,
  deleteProductPromotion,
  getAllBrands,
  createBrand,
  updateBrand,
  getAllCategories,
  createCategory,
  updateCategory,
  getAllColors,
  createColor,
  updateColor,
  getAllMaterials,
  createMaterial,
  updateMaterial,
  getAllSizes,
  createSize,
  updateSize,
  getAllSoles,
  createSole,
  updateSole,
  searchProducts,
  getNewestProducts,
  getBestSellingProducts,
  getLowStockProducts
} from '../controllers/product.controller.js';
import { protect, admin } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Lấy danh sách tất cả sản phẩm
 *     tags: [Products]
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
 *         description: Số sản phẩm trên mỗi trang
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest, oldest]
 *         description: Sắp xếp sản phẩm
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Lọc theo thương hiệu
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
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
 *                   example: Lấy danh sách sản phẩm thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
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
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Thông tin chi tiết sản phẩm
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
 *                   example: Lấy thông tin sản phẩm thành công
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Tạo sản phẩm mới
 *     tags: [Products]
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
 *               - price
 *               - category
 *               - brand
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên sản phẩm
 *               description:
 *                 type: string
 *                 description: Mô tả sản phẩm
 *               price:
 *                 type: number
 *                 description: Giá sản phẩm
 *               category:
 *                 type: string
 *                 description: ID danh mục
 *               brand:
 *                 type: string
 *                 description: ID thương hiệu
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     color:
 *                       type: string
 *                     size:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 */
router.post('/', protect, admin, createProduct);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Cập nhật thông tin sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm
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
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               brand:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.put('/:id', protect, admin, updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Xóa sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.delete('/:id', protect, admin, deleteProduct);

/**
 * @swagger
 * /products/{id}/variants:
 *   post:
 *     summary: Thêm biến thể sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - color
 *               - size
 *               - quantity
 *             properties:
 *               color:
 *                 type: string
 *                 description: ID màu sắc
 *               size:
 *                 type: string
 *                 description: ID kích thước
 *               quantity:
 *                 type: number
 *                 description: Số lượng
 *     responses:
 *       201:
 *         description: Thêm biến thể thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.post('/:id/variants', protect, admin, addProductVariant);

/**
 * @swagger
 * /products/{id}/variants/{variantId}:
 *   put:
 *     summary: Cập nhật biến thể sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm
 *       - in: path
 *         name: variantId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID biến thể
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               color:
 *                 type: string
 *               size:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc biến thể
 */
router.put('/:id/variants/:variantId', protect, admin, updateProductVariant);

/**
 * @swagger
 * /products/{id}/variants/{variantId}:
 *   delete:
 *     summary: Xóa biến thể sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm
 *       - in: path
 *         name: variantId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID biến thể
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc biến thể
 */
router.delete('/:id/variants/:variantId', protect, admin, deleteProductVariant);

/**
 * @swagger
 * /products/{id}/images:
 *   post:
 *     summary: Thêm ảnh sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm
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
 *                 description: File ảnh
 *     responses:
 *       201:
 *         description: Thêm ảnh thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.post('/:id/images', protect, admin, addProductImage);

/**
 * @swagger
 * /products/{id}/images/{imageId}:
 *   put:
 *     summary: Cập nhật ảnh sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm
 *       - in: path
 *         name: imageId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID ảnh
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
 *                 description: File ảnh mới
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc ảnh
 */
router.put('/:id/images/:imageId', protect, admin, updateProductImage);

/**
 * @swagger
 * /products/{id}/images/{imageId}:
 *   delete:
 *     summary: Xóa ảnh sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm
 *       - in: path
 *         name: imageId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID ảnh
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc ảnh
 */
router.delete('/:id/images/:imageId', protect, admin, deleteProductImage);

/**
 * @swagger
 * /products/{id}/promotions:
 *   post:
 *     summary: Thêm khuyến mãi cho sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - promotionId
 *             properties:
 *               promotionId:
 *                 type: string
 *                 description: ID khuyến mãi
 *     responses:
 *       201:
 *         description: Thêm khuyến mãi thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc khuyến mãi
 */
router.post('/:id/promotions', protect, admin, addProductPromotion);

/**
 * @swagger
 * /products/{id}/promotions/{promotionId}:
 *   delete:
 *     summary: Xóa khuyến mãi khỏi sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm
 *       - in: path
 *         name: promotionId
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
 *         description: Không tìm thấy sản phẩm hoặc khuyến mãi
 */
router.delete('/:id/promotions/:promotionId', protect, admin, deleteProductPromotion);

/**
 * @swagger
 * /products/brands:
 *   get:
 *     summary: Lấy danh sách thương hiệu
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Danh sách thương hiệu
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
 *                   example: Lấy danh sách thương hiệu thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Brand'
 */
router.get('/brands', getAllBrands);

/**
 * @swagger
 * /products/brands:
 *   post:
 *     summary: Tạo thương hiệu mới
 *     tags: [Products]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên thương hiệu
 *               description:
 *                 type: string
 *                 description: Mô tả thương hiệu
 *     responses:
 *       201:
 *         description: Tạo thương hiệu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 */
router.post('/brands', protect, admin, createBrand);

/**
 * @swagger
 * /products/brands/{id}:
 *   put:
 *     summary: Cập nhật thương hiệu
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID thương hiệu
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
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy thương hiệu
 */
router.put('/brands/:id', protect, admin, updateBrand);

/**
 * @swagger
 * /products/categories:
 *   get:
 *     summary: Lấy danh sách danh mục
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Danh sách danh mục
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
 *                   example: Lấy danh sách danh mục thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/categories', getAllCategories);

/**
 * @swagger
 * /products/categories:
 *   post:
 *     summary: Tạo danh mục mới
 *     tags: [Products]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên danh mục
 *               description:
 *                 type: string
 *                 description: Mô tả danh mục
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 */
router.post('/categories', protect, admin, createCategory);

/**
 * @swagger
 * /products/categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID danh mục
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
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy danh mục
 */
router.put('/categories/:id', protect, admin, updateCategory);

/**
 * @swagger
 * /products/colors:
 *   get:
 *     summary: Lấy danh sách màu sắc
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Danh sách màu sắc
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
 *                   example: Lấy danh sách màu sắc thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Color'
 */
router.get('/colors', getAllColors);

/**
 * @swagger
 * /products/colors:
 *   post:
 *     summary: Tạo màu sắc mới
 *     tags: [Products]
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
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên màu
 *               code:
 *                 type: string
 *                 description: Mã màu (hex)
 *     responses:
 *       201:
 *         description: Tạo màu sắc thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 */
router.post('/colors', protect, admin, createColor);

/**
 * @swagger
 * /products/colors/{id}:
 *   put:
 *     summary: Cập nhật màu sắc
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID màu sắc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy màu sắc
 */
router.put('/colors/:id', protect, admin, updateColor);

/**
 * @swagger
 * /products/materials:
 *   get:
 *     summary: Lấy danh sách chất liệu
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Danh sách chất liệu
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
 *                   example: Lấy danh sách chất liệu thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Material'
 */
router.get('/materials', getAllMaterials);

/**
 * @swagger
 * /products/materials:
 *   post:
 *     summary: Tạo chất liệu mới
 *     tags: [Products]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên chất liệu
 *               description:
 *                 type: string
 *                 description: Mô tả chất liệu
 *     responses:
 *       201:
 *         description: Tạo chất liệu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 */
router.post('/materials', protect, admin, createMaterial);

/**
 * @swagger
 * /products/materials/{id}:
 *   put:
 *     summary: Cập nhật chất liệu
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID chất liệu
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
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy chất liệu
 */
router.put('/materials/:id', protect, admin, updateMaterial);

/**
 * @swagger
 * /products/sizes:
 *   get:
 *     summary: Lấy danh sách kích thước
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Danh sách kích thước
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
 *                   example: Lấy danh sách kích thước thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Size'
 */
router.get('/sizes', getAllSizes);

/**
 * @swagger
 * /products/sizes:
 *   post:
 *     summary: Tạo kích thước mới
 *     tags: [Products]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên kích thước
 *               description:
 *                 type: string
 *                 description: Mô tả kích thước
 *     responses:
 *       201:
 *         description: Tạo kích thước thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 */
router.post('/sizes', protect, admin, createSize);

/**
 * @swagger
 * /products/sizes/{id}:
 *   put:
 *     summary: Cập nhật kích thước
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID kích thước
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
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy kích thước
 */
router.put('/sizes/:id', protect, admin, updateSize);

/**
 * @swagger
 * /products/soles:
 *   get:
 *     summary: Lấy danh sách đế giày
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Danh sách đế giày
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
 *                   example: Lấy danh sách đế giày thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sole'
 */
router.get('/soles', getAllSoles);

/**
 * @swagger
 * /products/soles:
 *   post:
 *     summary: Tạo đế giày mới
 *     tags: [Products]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên đế giày
 *               description:
 *                 type: string
 *                 description: Mô tả đế giày
 *     responses:
 *       201:
 *         description: Tạo đế giày thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 */
router.post('/soles', protect, admin, createSole);

/**
 * @swagger
 * /products/soles/{id}:
 *   put:
 *     summary: Cập nhật đế giày
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đế giày
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
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được phép
 *       404:
 *         description: Không tìm thấy đế giày
 */
router.put('/soles/:id', protect, admin, updateSole);

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Tìm kiếm sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Từ khóa tìm kiếm
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
 *         description: Số sản phẩm trên mỗi trang
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm
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
 *                   example: Tìm kiếm thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
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
 */
router.get('/search', searchProducts);

/**
 * @swagger
 * /products/newest:
 *   get:
 *     summary: Lấy danh sách sản phẩm mới nhất
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số sản phẩm cần lấy
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm mới nhất
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
 *                   example: Lấy danh sách sản phẩm mới nhất thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/newest', getNewestProducts);

/**
 * @swagger
 * /products/best-selling:
 *   get:
 *     summary: Lấy danh sách sản phẩm bán chạy nhất
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số sản phẩm cần lấy
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm bán chạy nhất
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
 *                   example: Lấy danh sách sản phẩm bán chạy nhất thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/best-selling', getBestSellingProducts);

/**
 * @swagger
 * /products/low-stock:
 *   get:
 *     summary: Lấy danh sách sản phẩm sắp hết hàng
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số sản phẩm cần lấy
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm sắp hết hàng
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
 *                   example: Lấy danh sách sản phẩm sắp hết hàng thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       401:
 *         description: Không được phép
 */
router.get('/low-stock', protect, getLowStockProducts);

export default router; 