import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import Payment from '../models/payment.model.js';
import Voucher from '../models/voucher.model.js';
import { validateOrder, validateOrderItem, validatePayment } from '../utils/validation.js';
import { generateQRCode, scanQRCode } from '../utils/qr.js';
import { generateReceipt } from '../utils/receipt.js';

// Tối đa 5 đơn hàng cùng lúc
const MAX_CONCURRENT_ORDERS = 5;

exports.createOrder = async (req, res) => {
  try {
    // Kiểm tra số lượng đơn hàng hiện tại
    const activeOrders = await Order.countDocuments({
      status: { $in: ['PENDING', 'PROCESSING'] },
      createdBy: req.user._id
    });

    if (activeOrders >= MAX_CONCURRENT_ORDERS) {
      return res.status(400).json({
        message: 'Đã đạt giới hạn số đơn hàng đang xử lý. Vui lòng hoàn thành một đơn hàng trước khi tạo đơn mới.'
      });
    }

    const validatedData = validateOrder(req.body);
    const order = new Order({
      ...validatedData,
      createdBy: req.user._id
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {
      createdBy: req.user._id
    };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('items.product')
      .populate('customer')
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

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('customer')
      .populate('payments');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const addOrderItem = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const validatedData = validateOrderItem(req.body);
    const product = await Product.findById(validatedData.productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Kiểm tra tồn kho
    const variant = product.variants.id(validatedData.variantId);
    if (!variant || variant.stock < validatedData.quantity) {
      return res.status(400).json({ message: 'Số lượng sản phẩm không đủ' });
    }

    order.items.push({
      product: product._id,
      variant: validatedData.variantId,
      quantity: validatedData.quantity,
      price: variant.price
    });

    // Tự động áp dụng khuyến mãi tốt nhất
    await applyBestPromotion(order);

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateOrderItem = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong đơn hàng' });
    }

    const validatedData = validateOrderItem(req.body);
    const product = await Product.findById(item.product);
    const variant = product.variants.id(validatedData.variantId);

    if (!variant || variant.stock < validatedData.quantity) {
      return res.status(400).json({ message: 'Số lượng sản phẩm không đủ' });
    }

    item.quantity = validatedData.quantity;
    item.variant = validatedData.variantId;
    item.price = variant.price;

    // Tự động áp dụng khuyến mãi tốt nhất
    await applyBestPromotion(order);

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const processPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const validatedData = validatePayment(req.body);
    const { amount, method } = validatedData;

    // Kiểm tra số tiền thanh toán
    const remainingAmount = order.totalAmount - order.paidAmount;
    if (amount > remainingAmount) {
      return res.status(400).json({ message: 'Số tiền thanh toán vượt quá số tiền cần thanh toán' });
    }

    const payment = new Payment({
      orderId: order._id,
      amount,
      method,
      status: 'COMPLETED'
    });

    await payment.save();
    order.payments.push(payment._id);
    order.paidAmount += amount;

    if (order.paidAmount >= order.totalAmount) {
      order.status = 'COMPLETED';
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const completeOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (order.paidAmount < order.totalAmount) {
      return res.status(400).json({ message: 'Đơn hàng chưa được thanh toán đủ' });
    }

    // Cập nhật tồn kho
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      const variant = product.variants.id(item.variant);
      variant.stock -= item.quantity;
      await product.save();
    }

    order.status = 'COMPLETED';
    order.completedAt = new Date();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const scanQRCode = async (req, res) => {
  try {
    const { qrCode } = req.body;
    const productData = await scanQRCode(qrCode);
    if (!productData) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin sản phẩm' });
    }
    res.json(productData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const printReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate('customer')
      .populate('payments');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const receipt = await generateReceipt(order);
    res.json(receipt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Hàm hỗ trợ tìm và áp dụng khuyến mãi tốt nhất
export const applyBestPromotion = async (order) => {
  try {
    // Tìm tất cả khuyến mãi có hiệu lực
    const validPromotions = await Voucher.find({
      status: 'ACTIVE',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      minimumAmount: { $lte: order.subtotal }
    });

    let maxDiscount = 0;
    let bestPromotion = null;

    // Tính toán khuyến mãi tốt nhất
    for (const promotion of validPromotions) {
      let discount = 0;
      if (promotion.type === 'PERCENTAGE') {
        discount = (order.subtotal * promotion.value) / 100;
        if (promotion.maximumValue) {
          discount = Math.min(discount, promotion.maximumValue);
        }
      } else {
        discount = promotion.value;
      }

      if (discount > maxDiscount) {
        maxDiscount = discount;
        bestPromotion = promotion;
      }
    }

    // Áp dụng khuyến mãi tốt nhất
    if (bestPromotion) {
      order.promotion = bestPromotion._id;
      order.discount = maxDiscount;
    } else {
      order.promotion = null;
      order.discount = 0;
    }

    // Cập nhật tổng tiền
    order.totalAmount = order.subtotal - order.discount;
  } catch (error) {
    console.error('Lỗi khi áp dụng khuyến mãi:', error);
  }
} 