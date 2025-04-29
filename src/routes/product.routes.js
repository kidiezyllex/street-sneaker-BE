import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  updateProductStock,
  updateProductImages,
  searchProducts
} from '../controllers/product.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/products:
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
 *               - brand
 *               - category
 *               - material
 *               - description
 *               - weight
 *               - variants
 *             properties:
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               category:
 *                 type: string
 *               material:
 *                 type: string
 *               description:
 *                 type: string
 *               weight:
 *                 type: number
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     colorId:
 *                       type: string
 *                     sizeId:
 *                       type: string
 *                     price:
 *                       type: number
 *                     stock:
 *                       type: number
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi máy chủ
 */
router.post('/', authenticate, authorizeAdmin, createProduct);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lấy danh sách sản phẩm thành công
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/', getProducts);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Tìm kiếm sản phẩm theo từ khóa
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Tìm kiếm sản phẩm thành công
 *       400:
 *         description: Thiếu từ khóa tìm kiếm
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/search', searchProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lấy thông tin sản phẩm thành công
 *       400:
 *         description: ID không hợp lệ
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               brand:
 *                 type: string
 *               category:
 *                 type: string
 *               material:
 *                 type: string
 *               description:
 *                 type: string
 *               weight:
 *                 type: number
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     colorId:
 *                       type: string
 *                     sizeId:
 *                       type: string
 *                     price:
 *                       type: number
 *                     stock:
 *                       type: number
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *     responses:
 *       200:
 *         description: Cập nhật sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi máy chủ
 */
router.put('/:id', authenticate, authorizeAdmin, updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Xóa sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa sản phẩm thành công
 *       400:
 *         description: ID không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi máy chủ
 */
router.delete('/:id', authenticate, authorizeAdmin, deleteProduct);

/**
 * @swagger
 * /api/products/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [HOAT_DONG, KHONG_HOAT_DONG]
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái sản phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/:id/status', authenticate, authorizeAdmin, updateProductStatus);

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Cập nhật tồn kho của các biến thể sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - variantUpdates
 *             properties:
 *               variantUpdates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - variantId
 *                     - stock
 *                   properties:
 *                     variantId:
 *                       type: string
 *                     stock:
 *                       type: number
 *                       minimum: 0
 *     responses:
 *       200:
 *         description: Cập nhật tồn kho thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc biến thể
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/:id/stock', authenticate, authorizeAdmin, updateProductStock);

/**
 * @swagger
 * /api/products/{id}/images:
 *   patch:
 *     summary: Cập nhật hình ảnh của biến thể sản phẩm
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - variantId
 *               - images
 *             properties:
 *               variantId:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật hình ảnh thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc biến thể
 *       500:
 *         description: Lỗi máy chủ
 */
router.patch('/:id/images', authenticate, authorizeAdmin, updateProductImages);

export default router; 