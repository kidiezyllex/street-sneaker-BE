import express from 'express';
import clientController from '../controllers/client.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /client/home:
 *   get:
 *     summary: Lấy dữ liệu trang chủ (sản phẩm mới, sản phẩm phổ biến)
 *     tags: [Client]
 *     responses:
 *       200:
 *         description: Dữ liệu trang chủ
 */
router.get('/home', clientController.getHomeData);

/**
 * @swagger
 * /client/products/new:
 *   get:
 *     summary: Lấy danh sách sản phẩm mới
 *     tags: [Client]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng sản phẩm trên mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm mới
 */
router.get('/products/new', clientController.getNewProducts);

/**
 * @swagger
 * /client/products/popular:
 *   get:
 *     summary: Lấy danh sách sản phẩm phổ biến
 *     tags: [Client]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng sản phẩm trên mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm phổ biến
 */
router.get('/products/popular', clientController.getPopularProducts);

/**
 * @swagger
 * /client/products:
 *   get:
 *     summary: Lấy danh sách sản phẩm
 *     tags: [Client]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
 */
router.get('/products', clientController.getProducts);

/**
 * @swagger
 * /client/products/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm
 *     tags: [Client]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Chi tiết sản phẩm
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get('/products/:id', clientController.getProductDetails);

/**
 * @swagger
 * /client/products/search:
 *   get:
 *     summary: Tìm kiếm sản phẩm
 *     tags: [Client]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm sản phẩm
 */
router.get('/products/search', clientController.searchProducts);

/**
 * @swagger
 * /client/products/filter:
 *   get:
 *     summary: Lọc sản phẩm
 *     tags: [Client]
 *     parameters:
 *       - in: query
 *         name: category
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
 *         name: colors
 *         schema:
 *           type: string
 *       - in: query
 *         name: sizes
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm đã lọc
 */
router.get('/products/filter', clientController.filterProducts);

// Giỏ hàng
/**
 * @swagger
 * /client/cart/items:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Client Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               variantId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Thêm vào giỏ hàng thành công
 */
router.post('/cart/items', protect, clientController.addToCart);

/**
 * @swagger
 * /client/cart:
 *   get:
 *     summary: Lấy giỏ hàng của người dùng
 *     tags: [Client Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin giỏ hàng
 */
router.get('/cart', protect, clientController.getCart);

/**
 * @swagger
 * /client/cart/items/{id}:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ hàng
 *     tags: [Client Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/cart/items/:id', protect, clientController.updateCartItem);

/**
 * @swagger
 * /client/cart/items/{id}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     tags: [Client Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID sản phẩm trong giỏ hàng
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/cart/items/:id', protect, clientController.removeCartItem);

// Thanh toán
/**
 * @swagger
 * /client/checkout:
 *   post:
 *     summary: Thanh toán đơn hàng
 *     tags: [Client Checkout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addressId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đặt hàng thành công
 */
router.post('/checkout', protect, clientController.checkout);

/**
 * @swagger
 * /client/payment-methods:
 *   get:
 *     summary: Lấy danh sách phương thức thanh toán
 *     tags: [Client Checkout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách phương thức thanh toán
 */
router.get('/payment-methods', protect, clientController.getPaymentMethods);

// Đơn hàng
/**
 * @swagger
 * /client/orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng của khách hàng
 *     tags: [Client Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 */
router.get('/orders', protect, clientController.getOrders);

/**
 * @swagger
 * /client/orders/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng của khách hàng
 *     tags: [Client Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID đơn hàng
 *     responses:
 *       200:
 *         description: Chi tiết đơn hàng
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.get('/orders/:id', protect, clientController.getOrderDetails);

// Hồ sơ khách hàng
/**
 * @swagger
 * /client/profile:
 *   get:
 *     summary: Lấy thông tin hồ sơ khách hàng
 *     tags: [Client Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin hồ sơ khách hàng
 */
router.get('/profile', protect, clientController.getProfile);

/**
 * @swagger
 * /client/profile:
 *   put:
 *     summary: Cập nhật hồ sơ khách hàng
 *     tags: [Client Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/profile', protect, clientController.updateProfile);

// Địa chỉ giao hàng
/**
 * @swagger
 * /client/addresses:
 *   get:
 *     summary: Lấy danh sách địa chỉ giao hàng
 *     tags: [Client Address]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách địa chỉ
 */
router.get('/addresses', protect, clientController.getAddresses);

/**
 * @swagger
 * /client/addresses:
 *   post:
 *     summary: Thêm địa chỉ giao hàng mới
 *     tags: [Client Address]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Thêm địa chỉ thành công
 */
router.post('/addresses', protect, clientController.addAddress);

/**
 * @swagger
 * /client/addresses/{id}:
 *   put:
 *     summary: Cập nhật địa chỉ giao hàng
 *     tags: [Client Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *     responses:
 *       200:
 *         description: Cập nhật địa chỉ thành công
 */
router.put('/addresses/:id', protect, clientController.updateAddress);

/**
 * @swagger
 * /client/addresses/{id}:
 *   delete:
 *     summary: Xóa địa chỉ giao hàng
 *     tags: [Client Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID địa chỉ
 *     responses:
 *       200:
 *         description: Xóa địa chỉ thành công
 */
router.delete('/addresses/:id', protect, clientController.deleteAddress);

export default router;