import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import { validateShippingInfo } from '../utils/validation.js';

export const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      type
    } = req.query;

    let query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('items.product')
      .populate('customer')
      .populate('payments')
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

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('customer')
      .populate('payments')
      .populate({
        path: 'statusHistory.updatedBy',
        select: 'name email'
      });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Thêm vào lịch sử trạng thái
    order.statusHistory.push({
      status,
      note,
      updatedBy: req.account.id,
      updatedAt: new Date()
    });

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateShippingInfo = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const validatedData = validateShippingInfo(req.body);
    order.shippingInfo = validatedData;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateOrderItems = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (order.status !== 'PENDING' && order.status !== 'PROCESSING') {
      return res.status(400).json({
        message: 'Chỉ có thể cập nhật sản phẩm cho đơn hàng đang xử lý'
      });
    }

    const { items } = req.body;
    const validatedItems = [];

    // Kiểm tra và xác thực từng sản phẩm
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          message: `Không tìm thấy sản phẩm với ID ${item.product}`
        });
      }

      const variant = product.variants.id(item.variant);
      if (!variant) {
        return res.status(404).json({
          message: `Không tìm thấy biến thể sản phẩm với ID ${item.variant}`
        });
      }

      if (variant.stock < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm ${product.name} không đủ số lượng`
        });
      }

      validatedItems.push({
        product: product._id,
        variant: variant._id,
        quantity: item.quantity,
        price: variant.price
      });
    }

    // Cập nhật danh sách sản phẩm
    order.items = validatedItems;

    // Tính lại tổng tiền
    order.subtotal = validatedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    order.totalAmount = order.subtotal - (order.discount || 0);

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 