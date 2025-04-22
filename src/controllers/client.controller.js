import Product from '../models/product.model.js';
import Cart from '../models/cart.model.js';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import { validateCartItem, validateAddress } from '../utils/validation.js';

// Trang chủ
export const getHomeData = async (req, res) => {
  try {
    // Lấy sản phẩm mới
    const newProducts = await Product.find({ status: 'ACTIVE' })
      .sort({ createdAt: -1 })
      .limit(8);

    // Lấy sản phẩm phổ biến
    const popularProducts = await Product.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.product',
          as: 'orders'
        }
      },
      {
        $project: {
          name: 1,
          images: 1,
          price: 1,
          orderCount: { $size: '$orders' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 8 }
    ]);

    res.json({
      newProducts,
      popularProducts
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getNewProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const products = await Product.find({ status: 'ACTIVE' })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.countDocuments({ status: 'ACTIVE' });

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getPopularProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const products = await Product.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.product',
          as: 'orders'
        }
      },
      {
        $project: {
          name: 1,
          images: 1,
          price: 1,
          orderCount: { $size: '$orders' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit * 1 }
    ]);

    const count = await Product.countDocuments({ status: 'ACTIVE' });

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Sản phẩm
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, sort } = req.query;
    const query = { status: 'ACTIVE' };
    if (category) query.category = category;

    let sortOption = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    }

    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;
    const query = {
      status: 'ACTIVE',
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const filterProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      colors,
      sizes,
      sort
    } = req.query;

    const query = { status: 'ACTIVE' };
    if (category) query.category = category;
    if (colors) query['variants.color'] = { $in: colors.split(',') };
    if (sizes) query['variants.size'] = { $in: sizes.split(',') };
    if (minPrice || maxPrice) {
      query['variants.price'] = {};
      if (minPrice) query['variants.price'].$gte = Number(minPrice);
      if (maxPrice) query['variants.price'].$lte = Number(maxPrice);
    }

    let sortOption = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    }

    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Giỏ hàng
export const addToCart = async (req, res) => {
  try {
    const validatedData = validateCartItem(req.body);
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: []
      });
    }

    const existingItem = cart.items.find(
      item =>
        item.product.toString() === validatedData.productId &&
        item.variant.toString() === validatedData.variantId
    );

    if (existingItem) {
      existingItem.quantity += validatedData.quantity;
    } else {
      cart.items.push({
        product: validatedData.productId,
        variant: validatedData.variantId,
        quantity: validatedData.quantity
      });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product')
      .populate('items.variant');

    res.json(cart || { items: [] });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }

    const item = cart.items.id(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    item.quantity = quantity;
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }

    cart.items.pull(req.params.id);
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Thanh toán
export const checkout = async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product')
      .populate('items.variant');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(400).json({ message: 'Không tìm thấy địa chỉ giao hàng' });
    }

    // Tạo đơn hàng mới
    const order = new Order({
      user: req.user._id,
      items: cart.items.map(item => ({
        product: item.product._id,
        variant: item.variant._id,
        quantity: item.quantity,
        price: item.variant.price
      })),
      shippingAddress: address,
      paymentMethod,
      status: 'PENDING'
    });

    // Tính tổng tiền
    order.subtotal = order.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    order.totalAmount = order.subtotal; // Có thể thêm phí vận chuyển và giảm giá ở đây

    await order.save();

    // Xóa giỏ hàng
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [
      { id: 'CASH', name: 'Tiền mặt' },
      { id: 'BANK_TRANSFER', name: 'Chuyển khoản ngân hàng' }
    ];
    res.json(paymentMethods);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Đơn hàng
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('items.product')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('items.product')
      .populate('items.variant');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Hồ sơ khách hàng
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    Object.assign(user, req.body);
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.addresses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addAddress = async (req, res) => {
  try {
    const validatedData = validateAddress(req.body);
    const user = await User.findById(req.user._id);

    user.addresses.push(validatedData);
    await user.save();

    res.json(user.addresses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const validatedData = validateAddress(req.body);
    const user = await User.findById(req.user._id);

    const address = user.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    }

    Object.assign(address, validatedData);
    await user.save();

    res.json(user.addresses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.pull(req.params.id);
    await user.save();

    res.json(user.addresses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 