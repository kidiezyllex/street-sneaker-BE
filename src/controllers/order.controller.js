import Order from '../models/order.model.js';
import mongoose from 'mongoose';

/**
 * Tạo đơn hàng mới
 * @route POST /api/orders
 * @access Private
 */
export const createOrder = async (req, res) => {
  try {
    const { 
      customer, 
      items, 
      voucher, 
      subTotal, 
      discount, 
      total, 
      shippingAddress,
      paymentMethod 
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!customer || !items || !subTotal || !total || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: customer, items, subTotal, total, paymentMethod'
      });
    }

    // Tạo đơn hàng mới
    const newOrder = new Order({
      customer,
      staff: req.account._id,
      items,
      voucher,
      subTotal,
      discount: discount || 0,
      total,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'PENDING',
      orderStatus: 'CHO_XAC_NHAN'
    });

    await newOrder.save();

    // Populate thông tin để trả về
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('customer', 'fullName email phoneNumber')
      .populate('staff', 'fullName')
      .populate('voucher')
      .populate({
        path: 'items.product',
        select: 'name code imageUrl'
      });

    return res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công',
      data: populatedOrder
    });
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo đơn hàng',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách đơn hàng
 * @route GET /api/orders
 * @access Private/Admin
 */
export const getOrders = async (req, res) => {
  try {
    const { 
      customer, 
      orderStatus, 
      paymentStatus, 
      startDate, 
      endDate, 
      search,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Xây dựng query filter
    const filter = {};
    
    if (customer) {
      filter.customer = customer;
    }
    
    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }
    
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }
    
    // Lọc theo khoảng thời gian
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Tìm kiếm theo mã đơn hàng
    if (search) {
      filter.code = { $regex: search, $options: 'i' };
    }
    
    // Thực hiện query với phân trang
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'fullName email phoneNumber')
      .populate('staff', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Trả về kết quả
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        orders,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết đơn hàng
 * @route GET /api/orders/:id
 * @access Private
 */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    const order = await Order.findById(id)
      .populate('customer', 'fullName email phoneNumber addresses')
      .populate('staff', 'fullName')
      .populate('voucher')
      .populate({
        path: 'items.product',
        select: 'name code imageUrl price'
      });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Kiểm tra quyền truy cập (chỉ admin hoặc người dùng sở hữu đơn hàng mới có quyền xem)
    if (req.account.role !== 'ADMIN' && order.customer._id.toString() !== req.account._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập đơn hàng này'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin đơn hàng thành công',
      data: order
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin đơn hàng',
      error: error.message
    });
  }
};

/**
 * Cập nhật đơn hàng
 * @route PUT /api/orders/:id
 * @access Private/Admin
 */
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      shippingAddress, 
      orderStatus, 
      paymentStatus 
    } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    // Tìm đơn hàng cần cập nhật
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Cập nhật thông tin
    if (shippingAddress) {
      order.shippingAddress = { ...order.shippingAddress, ...shippingAddress };
    }
    
    if (orderStatus) {
      order.orderStatus = orderStatus;
    }
    
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    
    await order.save();
    
    // Trả về đơn hàng đã cập nhật
    const updatedOrder = await Order.findById(id)
      .populate('customer', 'fullName email phoneNumber')
      .populate('staff', 'fullName')
      .populate('voucher')
      .populate({
        path: 'items.product',
        select: 'name code imageUrl'
      });
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật đơn hàng thành công',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật đơn hàng',
      error: error.message
    });
  }
};

/**
 * Hủy đơn hàng
 * @route PATCH /api/orders/:id/cancel
 * @access Private
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    const order = await Order.findById(id)
      .populate('customer', 'fullName _id');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Chỉ cho phép hủy đơn hàng khi trạng thái là CHO_XAC_NHAN hoặc CHO_GIAO_HANG
    if (order.orderStatus !== 'CHO_XAC_NHAN' && order.orderStatus !== 'CHO_GIAO_HANG') {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng ở trạng thái hiện tại'
      });
    }
    
    // Kiểm tra quyền: chỉ admin hoặc chủ đơn hàng mới có quyền hủy
    if (req.account.role !== 'ADMIN' && order.customer._id.toString() !== req.account._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn hàng này'
      });
    }
    
    // Cập nhật trạng thái đơn hàng thành đã hủy
    order.orderStatus = 'DA_HUY';
    await order.save();
    
    return res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: order
    });
  } catch (error) {
    console.error('Lỗi khi hủy đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi hủy đơn hàng',
      error: error.message
    });
  }
};

/**
 * Cập nhật trạng thái đơn hàng
 * @route PATCH /api/orders/:id/status
 * @access Private/Admin
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái mới'
      });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
    // Cập nhật trạng thái
    order.orderStatus = status;
    await order.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách đơn hàng của người dùng đăng nhập
 * @route GET /api/orders/my-orders
 * @access Private
 */
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.account._id;
    const { orderStatus, page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Xây dựng filter
    const filter = { customer: userId };
    
    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }
    
    // Thực hiện query
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        orders,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
}; 