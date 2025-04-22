import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';

/**
 * Lấy giỏ hàng của người dùng
 * @route GET /api/cart
 * @access Private
 */
export const getCart = async (req, res) => {
  try {
    // Tìm giỏ hàng của người dùng
    let cart = await Cart.findOne({ account: req.account.id })
      .populate({
        path: 'items.productDetail',
        select: 'price code brand sole material category size color images',
        populate: {
          path: 'brand sole material category size color',
          select: 'name code size'
        }
      });

    // Nếu không có giỏ hàng, tạo mới
    if (!cart) {
      cart = new Cart({
        account: req.account.id,
        items: []
      });
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy giỏ hàng thành công',
      data: cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy giỏ hàng',
      error: error.message
    });
  }
};

/**
 * Thêm sản phẩm vào giỏ hàng
 * @route POST /api/cart
 * @access Private
 */
export const addToCart = async (req, res) => {
  try {
    const { productDetailId, quantity = 1 } = req.body;

    if (!productDetailId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID sản phẩm'
      });
    }

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findOne({
      'variants._id': productDetailId,
      'variants.status': 'HOAT_DONG'
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    const variant = product.variants.find(v => v._id.toString() === productDetailId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }

    // Kiểm tra số lượng
    if (variant.amount < quantity) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm ${product.name} chỉ còn ${variant.amount} sản phẩm`
      });
    }

    // Tìm giỏ hàng của người dùng
    let cart = await Cart.findOne({ account: req.account.id });

    // Nếu không có giỏ hàng, tạo mới
    if (!cart) {
      cart = new Cart({
        account: req.account.id,
        items: []
      });
    }

    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const existingItemIndex = cart.items.findIndex(
      item => item.productDetail.toString() === productDetailId
    );

    if (existingItemIndex !== -1) {
      // Nếu sản phẩm đã có, tăng số lượng
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Nếu sản phẩm chưa có, thêm mới
      cart.items.push({
        productDetail: productDetailId,
        quantity
      });
    }

    await cart.save();

    // Lấy giỏ hàng đã populate để trả về
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.productDetail',
        select: 'price code brand sole material category size color images',
        populate: {
          path: 'brand sole material category size color',
          select: 'name code size'
        }
      });

    return res.status(200).json({
      success: true,
      message: 'Thêm sản phẩm vào giỏ hàng thành công',
      data: updatedCart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng',
      error: error.message
    });
  }
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ hàng
 * @route PUT /api/cart/:itemId
 * @access Private
 */
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng phải lớn hơn 0'
      });
    }

    // Tìm giỏ hàng của người dùng
    const cart = await Cart.findOne({ account: req.account.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng'
      });
    }

    // Tìm sản phẩm trong giỏ hàng
    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }

    // Kiểm tra số lượng sản phẩm có đủ không
    const product = await Product.findOne({
      'variants._id': cart.items[itemIndex].productDetail
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }

    const variant = product.variants.find(v => v._id.toString() === cart.items[itemIndex].productDetail.toString());
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }

    if (variant.amount < quantity) {
      return res.status(400).json({
        success: false,
        message: `Sản phẩm ${product.name} chỉ còn ${variant.amount} sản phẩm`
      });
    }

    // Cập nhật số lượng
    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    // Lấy giỏ hàng đã populate để trả về
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.productDetail',
        select: 'price code brand sole material category size color images',
        populate: {
          path: 'brand sole material category size color',
          select: 'name code size'
        }
      });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật giỏ hàng thành công',
      data: updatedCart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật giỏ hàng',
      error: error.message
    });
  }
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 * @route DELETE /api/cart/:itemId
 * @access Private
 */
export const removeFromCart = async (req, res) => {
  try {
    // Tìm giỏ hàng của người dùng
    const cart = await Cart.findOne({ account: req.account.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng'
      });
    }

    // Tìm sản phẩm trong giỏ hàng
    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }

    // Xóa sản phẩm khỏi giỏ hàng
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Lấy giỏ hàng đã populate để trả về
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.productDetail',
        select: 'price code brand sole material category size color images',
        populate: {
          path: 'brand sole material category size color',
          select: 'name code size'
        }
      });

    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
      data: updatedCart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa sản phẩm khỏi giỏ hàng',
      error: error.message
    });
  }
};

/**
 * Xóa toàn bộ giỏ hàng
 * @route DELETE /api/cart
 * @access Private
 */
export const clearCart = async (req, res) => {
  try {
    // Tìm giỏ hàng của người dùng
    const cart = await Cart.findOne({ account: req.account.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng'
      });
    }

    // Xóa tất cả sản phẩm trong giỏ hàng
    cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa toàn bộ giỏ hàng thành công',
      data: cart
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa toàn bộ giỏ hàng',
      error: error.message
    });
  }
}; 