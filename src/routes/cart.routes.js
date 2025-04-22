import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cart.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Lấy giỏ hàng của người dùng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy giỏ hàng thành công
 *       401:
 *         description: Không được phép
 */
router.get('/', protect, getCart);

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productDetailId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Thêm sản phẩm vào giỏ hàng thành công
 *       400:
 *         description: Lỗi dữ liệu đầu vào
 *       401:
 *         description: Không được phép
 */
router.post('/', protect, addToCart);

/**
 * @swagger
 * /cart/{itemId}:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm trong giỏ hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cập nhật giỏ hàng thành công
 *       400:
 *         description: Lỗi dữ liệu đầu vào
 *       404:
 *         description: Không tìm thấy sản phẩm trong giỏ hàng
 *       401:
 *         description: Không được phép
 */
router.put('/:itemId', protect, updateCartItem);

/**
 * @swagger
 * /cart/{itemId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm trong giỏ hàng
 *     responses:
 *       200:
 *         description: Xóa sản phẩm khỏi giỏ hàng thành công
 *       404:
 *         description: Không tìm thấy sản phẩm trong giỏ hàng
 *       401:
 *         description: Không được phép
 */
router.delete('/:itemId', protect, removeFromCart);

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa toàn bộ giỏ hàng thành công
 *       404:
 *         description: Không tìm thấy giỏ hàng
 *       401:
 *         description: Không được phép
 */
router.delete('/', protect, clearCart);

export default router; 