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
      orderId,
      customer, 
      items, 
      voucher, 
      subTotal, 
      discount, 
      total, 
      shippingAddress,
      paymentMethod 
    } = req.body;

    if (!customer || !items || !subTotal || !total || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: customer, items, subTotal, total, paymentMethod'
      });
    }

    const newOrder = new Order({
      code: orderId,
      customer,
      staff: req.account ? req.account._id : undefined,
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
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }
    if (search) {
      filter.code = { $regex: search, $options: 'i' };
    }
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const populatedOrders = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      if (order.customer && mongoose.Types.ObjectId.isValid(order.customer)) {
        try {
          const populatedCustomer = await Order.findById(order._id)
            .populate('customer', 'fullName email phoneNumber');
          
          if (populatedCustomer && populatedCustomer.customer) {
            orderObj.customer = populatedCustomer.customer;
          }
        } catch (err) {
        }
      }
      if (order.staff && mongoose.Types.ObjectId.isValid(order.staff)) {
        try {
          const populatedStaff = await Order.findById(order._id)
            .populate('staff', 'fullName');
          
          if (populatedStaff && populatedStaff.staff) {
            orderObj.staff = populatedStaff.staff;
          }
        } catch (err) {
        }
      }
      
      return orderObj;
    }));
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: {
        orders: populatedOrders,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
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
    
    if (req.account.role !== 'ADMIN' && order.customer._id.toString() !== req.account._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập đơn hàng này'
      });
    }
    
    if (order && order.customer && mongoose.Types.ObjectId.isValid(order.customer)) {
      try {
        await order.populate('customer', 'fullName email phoneNumber addresses');
      } catch (err) {
        console.error("Error populating customer:", err);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin đơn hàng thành công',
      data: order
    });
  } catch (error) {
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
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }
    
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
    
    if (order.orderStatus !== 'CHO_XAC_NHAN' && order.orderStatus !== 'CHO_GIAO_HANG') {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy đơn hàng ở trạng thái hiện tại'
      });
    }
    
    if (req.account.role !== 'ADMIN' && order.customer._id.toString() !== req.account._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn hàng này'
      });
    }
    
    order.orderStatus = 'DA_HUY';
    await order.save();
    
    return res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: order
    });
  } catch (error) {
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
    
    order.orderStatus = status;
    await order.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order
    });
  } catch (error) {
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
    
    const filter = { customer: userId };
    
    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }
    
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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách đơn hàng theo _id của user (dùng cho admin hoặc mục đích đặc biệt)
 * @route GET /api/orders/user/:userId
 * @access Private/Admin
 */
export const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { orderStatus, page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = { customer: userId };
    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }

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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
      error: error.message
    });
  }
};

/**
 * Tạo đơn hàng POS mới
 * @route POST /api/orders/pos
 * @access Private (Assuming staff/admin access)
 */
export const createPOSOrder = async (req, res) => {
  try {
    const {
      orderId,
      customer,
      items,
      voucher,
      subTotal,
      total,
      shippingAddress,
      paymentMethod,
      discount,
    } = req.body;

    if (!orderId || !items || !subTotal || !total || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: orderId, items, subTotal, total, paymentMethod'
      });
    }
    
    const finalShippingAddress = {
      name: shippingAddress?.name || customer || 'Khách lẻ',
      phoneNumber: shippingAddress?.phoneNumber || 'N/A',
      provinceId: shippingAddress?.provinceId || 'N/A',
      districtId: shippingAddress?.districtId || 'N/A',
      wardId: shippingAddress?.wardId || 'N/A',
      specificAddress: shippingAddress?.specificAddress || 'Tại quầy',
    };

    const newOrder = new Order({
      code: orderId,
      customer, 
      staff: req.account ? req.account._id : undefined,
      items,
      voucher,
      subTotal,
      discount: discount || 0,
      total,
      shippingAddress: finalShippingAddress,
      paymentMethod,
      paymentStatus: 'PAID',
      orderStatus: 'HOAN_THANH'
    });

    await newOrder.save();

    const populatedOrder = await Order.findById(newOrder._id)
      .populate('staff', 'fullName')
      .populate(newOrder.voucher ? 'voucher' : null)
      .populate({
        path: 'items.product',
        select: 'name code imageUrl'
      });

    return res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng POS thành công',
      data: populatedOrder
    });
  } catch (error) {
    if (error.code === 11000) {
        return res.status(409).json({ 
            success: false,
            message: 'Lỗi khi tạo đơn hàng POS: Mã đơn hàng đã tồn tại.',
            error: error.message
        });
    }
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo đơn hàng POS',
      error: error.message
    });
  }
}; 