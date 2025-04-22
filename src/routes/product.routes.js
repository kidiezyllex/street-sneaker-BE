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
import { protect, admin, staff } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes công khai
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/newest', getNewestProducts);
router.get('/best-selling', getBestSellingProducts);
router.get('/:id', getProductById);

// Thuộc tính sản phẩm (công khai)
router.get('/brands', getAllBrands);
router.get('/categories', getAllCategories);
router.get('/colors', getAllColors);
router.get('/materials', getAllMaterials);
router.get('/sizes', getAllSizes);
router.get('/soles', getAllSoles);

// Routes quản lý sản phẩm
router.post('/', protect, staff, createProduct);
router.put('/:id', protect, staff, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

// Quản lý biến thể sản phẩm
router.post('/:id/variants', protect, staff, addProductVariant);
router.put('/:id/variants/:variantId', protect, staff, updateProductVariant);
router.delete('/:id/variants/:variantId', protect, staff, deleteProductVariant);

// Quản lý hình ảnh sản phẩm
router.post('/:id/variants/:variantId/images', protect, staff, addProductImage);
router.put('/:id/variants/:variantId/images/:imageId', protect, staff, updateProductImage);
router.delete('/:id/variants/:variantId/images/:imageId', protect, staff, deleteProductImage);

// Quản lý khuyến mãi sản phẩm
router.post('/:id/variants/:variantId/promotions', protect, staff, addProductPromotion);
router.delete('/:id/variants/:variantId/promotions/:promotionId', protect, staff, deleteProductPromotion);

// Quản lý thuộc tính sản phẩm
router.post('/brands', protect, staff, createBrand);
router.put('/brands/:id', protect, staff, updateBrand);
router.post('/categories', protect, staff, createCategory);
router.put('/categories/:id', protect, staff, updateCategory);
router.post('/colors', protect, staff, createColor);
router.put('/colors/:id', protect, staff, updateColor);
router.post('/materials', protect, staff, createMaterial);
router.put('/materials/:id', protect, staff, updateMaterial);
router.post('/sizes', protect, staff, createSize);
router.put('/sizes/:id', protect, staff, updateSize);
router.post('/soles', protect, staff, createSole);
router.put('/soles/:id', protect, staff, updateSole);

// Thống kê sản phẩm
router.get('/low-stock', protect, staff, getLowStockProducts);

export default router; 