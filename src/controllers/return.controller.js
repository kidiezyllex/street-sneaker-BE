import Return from '../models/return.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';

/**
 * Tạo đơn trả hàng mới
 * @route POST /api/returns
 * @access Private/Admin
 */
export const createReturn = async (req, res) => {
  try {
    const { originalOrder, customer, items, totalRefund } = req.body;
    const staff = req.account._id;

    // Kiểm tra các trường bắt buộc
    if (!originalOrder || !customer || !items || items.length === 0 || !totalRefund) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: originalOrder, customer, items, totalRefund'
      });
    }

    // Kiểm tra ID đơn hàng gốc có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(originalOrder)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn hàng không hợp lệ'
      });
    }

    // Kiểm tra ID khách hàng có hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(customer)) {
      return res.status(400).json({
        success: false,
        message: 'ID khách hàng không hợp lệ'
      });
    }

    // Kiểm tra đơn hàng gốc có tồn tại không
    const orderExists = await Order.findById(originalOrder);
    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng gốc'
      });
    }

    // Kiểm tra trạng thái đơn hàng (chỉ được trả đơn hàng đã hoàn thành)
    if (orderExists.status !== 'HOAN_THANH') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ được trả hàng cho đơn hàng đã hoàn thành'
      });
    }

    // Kiểm tra các sản phẩm trả có trong đơn hàng gốc không
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({
          success: false,
          message: 'ID sản phẩm không hợp lệ'
        });
      }

      // Tìm sản phẩm trong đơn hàng gốc
      const orderItem = orderExists.items.find(
        oi => oi.product.toString() === item.product.toString() && 
        oi.variant.colorId.toString() === item.variant.colorId.toString() && 
        oi.variant.sizeId.toString() === item.variant.sizeId.toString()
      );

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm không tồn tại trong đơn hàng gốc: ${item.product}`
        });
      }

      // Kiểm tra số lượng trả không vượt quá số lượng trong đơn hàng
      if (item.quantity > orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Số lượng trả (${item.quantity}) vượt quá số lượng trong đơn hàng (${orderItem.quantity})`
        });
      }
    }

    // Tạo đơn trả hàng mới
    const newReturn = new Return({
      originalOrder,
      customer,
      staff,
      items,
      totalRefund,
      status: 'CHO_XU_LY'
    });

    await newReturn.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo đơn trả hàng thành công',
      data: newReturn
    });
  } catch (error) {
    console.error('Lỗi khi tạo đơn trả hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo đơn trả hàng',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách đơn trả hàng
 * @route GET /api/returns
 * @access Private/Admin
 */
export const getReturns = async (req, res) => {
  try {
    const { status, customer, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Xây dựng query filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (customer && mongoose.Types.ObjectId.isValid(customer)) {
      filter.customer = customer;
    }
    
    // Thực hiện query với phân trang
    const total = await Return.countDocuments(filter);
    const returns = await Return.find(filter)
      .populate('customer', 'fullName email phoneNumber')
      .populate('staff', 'fullName')
      .populate('originalOrder', 'code')
      .populate({
        path: 'items.product',
        select: 'name images code'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Trả về kết quả
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn trả hàng thành công',
      data: {
        returns,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn trả hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn trả hàng',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết đơn trả hàng
 * @route GET /api/returns/:id
 * @access Private/Admin
 */
export const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn trả hàng không hợp lệ'
      });
    }
    
    const returnOrder = await Return.findById(id)
      .populate('customer', 'fullName email phoneNumber')
      .populate('staff', 'fullName')
      .populate('originalOrder')
      .populate({
        path: 'items.product',
        select: 'name images code price'
      });
    
    if (!returnOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn trả hàng'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin đơn trả hàng thành công',
      data: returnOrder
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết đơn trả hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin đơn trả hàng',
      error: error.message
    });
  }
};

/**
 * Cập nhật trạng thái đơn trả hàng
 * @route PUT /api/returns/:id/status
 * @access Private/Admin
 */
export const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn trả hàng không hợp lệ'
      });
    }
    
    if (!status || !['CHO_XU_LY', 'DA_HOAN_TIEN', 'DA_HUY'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ. Trạng thái phải là một trong: CHO_XU_LY, DA_HOAN_TIEN, DA_HUY'
      });
    }
    
    // Tìm đơn trả hàng cần cập nhật
    const returnOrder = await Return.findById(id);
    
    if (!returnOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn trả hàng'
      });
    }
    
    // Nếu đơn hàng đã hoàn tiền hoặc đã hủy thì không được thay đổi trạng thái nữa
    if (returnOrder.status === 'DA_HOAN_TIEN' || returnOrder.status === 'DA_HUY') {
      return res.status(400).json({
        success: false,
        message: `Không thể thay đổi trạng thái của đơn trả hàng đã ${returnOrder.status === 'DA_HOAN_TIEN' ? 'hoàn tiền' : 'hủy'}`
      });
    }
    
    // Cập nhật trạng thái
    returnOrder.status = status;
    
    // Nếu đơn hàng được cập nhật thành "Đã hoàn tiền", cập nhật lại số lượng tồn kho
    if (status === 'DA_HOAN_TIEN') {
      // Cập nhật lại tồn kho
      for (const item of returnOrder.items) {
        const product = await Product.findById(item.product);
        
        if (product) {
          // Tìm variant tương ứng
          const variantIndex = product.variants.findIndex(
            v => v.colorId.toString() === item.variant.colorId.toString() && 
            v.sizeId.toString() === item.variant.sizeId.toString()
          );
          
          if (variantIndex !== -1) {
            // Cộng lại số lượng vào tồn kho
            product.variants[variantIndex].quantity += item.quantity;
            await product.save();
          }
        }
      }
    }
    
    await returnOrder.save();
    
    return res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái đơn trả hàng thành ${status === 'DA_HOAN_TIEN' ? 'đã hoàn tiền' : (status === 'DA_HUY' ? 'đã hủy' : 'chờ xử lý')}`,
      data: returnOrder
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái đơn trả hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn trả hàng',
      error: error.message
    });
  }
};

/**
 * Cập nhật thông tin đơn trả hàng
 * @route PUT /api/returns/:id
 * @access Private/Admin
 */
export const updateReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, totalRefund } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn trả hàng không hợp lệ'
      });
    }
    
    // Tìm đơn trả hàng cần cập nhật
    const returnOrder = await Return.findById(id);
    
    if (!returnOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn trả hàng'
      });
    }
    
    // Chỉ cho phép cập nhật khi đơn hàng đang ở trạng thái "Chờ xử lý"
    if (returnOrder.status !== 'CHO_XU_LY') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể cập nhật đơn trả hàng ở trạng thái Chờ xử lý'
      });
    }
    
    // Lấy thông tin đơn hàng gốc
    const originalOrder = await Order.findById(returnOrder.originalOrder);
    if (!originalOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng gốc'
      });
    }
    
    // Kiểm tra các sản phẩm trả có trong đơn hàng gốc không
    if (items && items.length > 0) {
      for (const item of items) {
        if (!mongoose.Types.ObjectId.isValid(item.product)) {
          return res.status(400).json({
            success: false,
            message: 'ID sản phẩm không hợp lệ'
          });
        }
  
        // Tìm sản phẩm trong đơn hàng gốc
        const orderItem = originalOrder.items.find(
          oi => oi.product.toString() === item.product.toString() && 
          oi.variant.colorId.toString() === item.variant.colorId.toString() && 
          oi.variant.sizeId.toString() === item.variant.sizeId.toString()
        );
  
        if (!orderItem) {
          return res.status(400).json({
            success: false,
            message: `Sản phẩm không tồn tại trong đơn hàng gốc: ${item.product}`
          });
        }
  
        // Kiểm tra số lượng trả không vượt quá số lượng trong đơn hàng
        if (item.quantity > orderItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Số lượng trả (${item.quantity}) vượt quá số lượng trong đơn hàng (${orderItem.quantity})`
          });
        }
      }
      
      returnOrder.items = items;
    }
    
    // Cập nhật tổng số tiền hoàn trả nếu có
    if (totalRefund !== undefined) {
      returnOrder.totalRefund = totalRefund;
    }
    
    await returnOrder.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật đơn trả hàng thành công',
      data: returnOrder
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật đơn trả hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật đơn trả hàng',
      error: error.message
    });
  }
};

/**
 * Xóa đơn trả hàng
 * @route DELETE /api/returns/:id
 * @access Private/Admin
 */
export const deleteReturn = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID đơn trả hàng không hợp lệ'
      });
    }
    
    const returnOrder = await Return.findById(id);
    
    if (!returnOrder) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn trả hàng'
      });
    }
    
    // Chỉ cho phép xóa khi đơn hàng đang ở trạng thái "Chờ xử lý"
    if (returnOrder.status !== 'CHO_XU_LY') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể xóa đơn trả hàng ở trạng thái Chờ xử lý'
      });
    }
    
    await Return.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: 'Xóa đơn trả hàng thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa đơn trả hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa đơn trả hàng',
      error: error.message
    });
  }
};

/**
 * Tìm kiếm đơn trả hàng theo mã QR hoặc mã đơn hàng
 * @route GET /api/returns/search
 * @access Private/Admin
 */
export const searchReturn = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp từ khóa tìm kiếm'
      });
    }
    
    // Tìm kiếm theo mã đơn trả hàng
    const returnOrders = await Return.find({ code: { $regex: query, $options: 'i' } })
      .populate('customer', 'fullName email phoneNumber')
      .populate('staff', 'fullName')
      .populate('originalOrder', 'code')
      .limit(5);
    
    // Nếu không tìm thấy đơn trả hàng, thử tìm theo đơn hàng gốc
    if (returnOrders.length === 0) {
      // Tìm đơn hàng gốc trước
      const originalOrders = await Order.find({ code: { $regex: query, $options: 'i' } }).select('_id');
      
      if (originalOrders.length > 0) {
        const orderIds = originalOrders.map(order => order._id);
        
        // Tìm đơn trả hàng dựa trên đơn hàng gốc
        const returnsByOrder = await Return.find({ originalOrder: { $in: orderIds } })
          .populate('customer', 'fullName email phoneNumber')
          .populate('staff', 'fullName')
          .populate('originalOrder', 'code')
          .limit(5);
          
        return res.status(200).json({
          success: true,
          message: 'Tìm kiếm đơn trả hàng thành công',
          data: returnsByOrder
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Tìm kiếm đơn trả hàng thành công',
      data: returnOrders
    });
  } catch (error) {
    console.error('Lỗi khi tìm kiếm đơn trả hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tìm kiếm đơn trả hàng',
      error: error.message
    });
  }
};

/**
 * Lấy thống kê đơn trả hàng
 * @route GET /api/returns/stats
 * @access Private/Admin
 */
export const getReturnStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Xây dựng filter theo ngày
    const dateFilter = {};
    if (startDate) {
      dateFilter.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate) };
    }
    
    // Đếm số lượng đơn theo trạng thái
    const totalPending = await Return.countDocuments({ ...dateFilter, status: 'CHO_XU_LY' });
    const totalRefunded = await Return.countDocuments({ ...dateFilter, status: 'DA_HOAN_TIEN' });
    const totalCancelled = await Return.countDocuments({ ...dateFilter, status: 'DA_HUY' });
    const total = await Return.countDocuments(dateFilter);
    
    // Tính tổng giá trị hoàn tiền
    const totalRefundAmount = await Return.aggregate([
      { $match: { ...dateFilter, status: 'DA_HOAN_TIEN' } },
      { $group: { _id: null, total: { $sum: '$totalRefund' } } }
    ]);
    
    const stats = {
      totalReturns: total,
      pendingReturns: totalPending,
      refundedReturns: totalRefunded,
      cancelledReturns: totalCancelled,
      totalRefundAmount: totalRefundAmount.length > 0 ? totalRefundAmount[0].total : 0
    };
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê đơn trả hàng thành công',
      data: stats
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê đơn trả hàng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê đơn trả hàng',
      error: error.message
    });
  }
}; 