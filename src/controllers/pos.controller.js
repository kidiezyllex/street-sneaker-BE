import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import Payment from '../models/payment.model.js';
import Voucher from '../models/voucher.model.js';
import { validateOrder, validateOrderItem, validatePayment } from '../utils/validation.js';
import { scanQRCode } from '../utils/qr.js';
import { generateReceipt } from '../utils/receipt.js';

// Tối đa 5 đơn hàng cùng lúc
const MAX_CONCURRENT_ORDERS = 5;

export const createOrder = async (req, res) => {
  try {
    // Kiểm tra số lượng đơn hàng hiện tại
    const activeOrders = await Order.countDocuments({
      status: { $in: ['PENDING', 'PROCESSING'] },
      createdBy: req.account.id
    });

    if (activeOrders >= MAX_CONCURRENT_ORDERS) {
      return res.status(400).json({
        message: 'Đã đạt giới hạn số đơn hàng đang xử lý. Vui lòng hoàn thành một đơn hàng trước khi tạo đơn mới.'
      });
    }

    const validatedData = validateOrder(req.body);
    const order = new Order({
      ...validatedData,
      createdBy: req.account.id
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {
      createdBy: req.account.id
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

export const getOrderById = async (req, res) => {
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

/**
 * Cập nhật thông tin đơn hàng
 */
export const updateOrder = async (req, res) => {
  try {
    const { customer, status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (customer) order.customer = customer;
    if (status) order.status = status;
    if (note) order.note = note;

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Xóa đơn hàng
 */
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Không xóa hoàn toàn, chỉ đổi trạng thái
    order.status = 'CANCELLED';
    await order.save();

    res.json({ message: 'Đơn hàng đã được hủy thành công' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Xóa sản phẩm khỏi đơn hàng
 */
export const removeOrderItem = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong đơn hàng' });
    }

    item.remove();
    
    // Tự động áp dụng khuyến mãi tốt nhất sau khi xóa sản phẩm
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

export const scanProductQRCode = async (req, res) => {
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

export const applyBestPromotion = async (order) => {
  try {
    if (!order || !order.items || order.items.length === 0) {
      return;
    }

    // Tính tổng giá trị đơn hàng trước khuyến mãi
    let subtotal = 0;
    for (const item of order.items) {
      subtotal += item.price * item.quantity;
    }
    
    // Tìm voucher có thể áp dụng tốt nhất
    const applicableVouchers = await Voucher.find({
      minOrderValue: { $lte: subtotal },
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      status: 'HOAT_DONG'
    }).sort({ value: -1 });

    let bestDiscount = 0;
    
    if (applicableVouchers.length > 0) {
      const bestVoucher = applicableVouchers[0];
      
      if (bestVoucher.type === 'PHAN_TRAM') {
        bestDiscount = subtotal * (bestVoucher.value / 100);
        // Giới hạn giảm giá tối đa nếu có
        if (bestVoucher.maxDiscount && bestDiscount > bestVoucher.maxDiscount) {
          bestDiscount = bestVoucher.maxDiscount;
        }
      } else {
        bestDiscount = bestVoucher.value;
      }
    }
    
    // Cập nhật thông tin đơn hàng
    order.subtotal = subtotal;
    order.discount = bestDiscount;
    order.totalAmount = subtotal - bestDiscount;
    
    return order;
  } catch (error) {
    console.error('Error applying promotion:', error);
    throw error;
  }
}; 