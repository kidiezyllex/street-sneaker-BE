import Return from '../models/return.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import { validateReturn } from '../utils/validation.js';
import { scanQRCode } from '../utils/qr.js';

export const createReturn = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Kiểm tra thời hạn trả hàng (ví dụ: 7 ngày)
    const returnPeriod = 7 * 24 * 60 * 60 * 1000; // 7 ngày tính bằng milliseconds
    if (Date.now() - order.completedAt > returnPeriod) {
      return res.status(400).json({ message: 'Đã quá thời hạn trả hàng' });
    }

    const validatedData = validateReturn(req.body);
    const returnOrder = new Return({
      order: order._id,
      items: validatedData.items,
      reason: validatedData.reason,
      status: 'PENDING',
      createdBy: req.user._id
    });

    // Tính toán số tiền hoàn trả
    let refundAmount = 0;
    for (const item of validatedData.items) {
      const orderItem = order.items.find(
        oi => oi.product.toString() === item.product.toString() &&
        oi.variant.toString() === item.variant.toString()
      );

      if (!orderItem) {
        return res.status(400).json({ message: 'Sản phẩm không tồn tại trong đơn hàng' });
      }

      if (item.quantity > orderItem.quantity) {
        return res.status(400).json({ message: 'Số lượng trả hàng vượt quá số lượng đã mua' });
      }

      refundAmount += orderItem.price * item.quantity;
    }

    // Áp dụng tỷ lệ hoàn tiền dựa trên chính sách (ví dụ: hoàn 90% giá trị)
    returnOrder.refundAmount = refundAmount * 0.9;

    await returnOrder.save();
    res.status(201).json(returnOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getReturns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const returns = await Return.find(query)
      .populate({
        path: 'order',
        populate: {
          path: 'items.product'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Return.countDocuments(query);

    res.json({
      returns,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getReturnById = async (req, res) => {
  try {
    const returnOrder = await Return.findById(req.params.id)
      .populate({
        path: 'order',
        populate: {
          path: 'items.product'
        }
      });

    if (!returnOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn trả hàng' });
    }

    res.json(returnOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateReturnStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const returnOrder = await Return.findById(req.params.id);
    if (!returnOrder) {
      return res.status(404).json({ message: 'Không tìm thấy đơn trả hàng' });
    }

    // Xử lý cập nhật trạng thái
    if (status === 'APPROVED') {
      // Cập nhật tồn kho khi chấp nhận trả hàng
      for (const item of returnOrder.items) {
        const product = await Product.findById(item.product);
        const variant = product.variants.id(item.variant);
        variant.stock += item.quantity;
        await product.save();
      }

      // Xử lý hoàn tiền
      returnOrder.refundedAt = new Date();
    }

    returnOrder.status = status;
    returnOrder.updatedBy = req.user._id;
    await returnOrder.save();

    res.json(returnOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const scanOrderQR = async (req, res) => {
  try {
    const { qrCode } = req.body;
    const orderData = await scanQRCode(qrCode);
    if (!orderData) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng' });
    }

    const order = await Order.findById(orderData.orderId)
      .populate('items.product');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 