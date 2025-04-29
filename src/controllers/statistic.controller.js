import Statistic from '../models/statistic.model.js';
import mongoose from 'mongoose';

/**
 * Lấy danh sách thống kê
 * @route GET /api/statistics
 * @access Private/Admin
 */
export const getStatistics = async (req, res) => {
  try {
    const { type, startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Xây dựng query filter
    const filter = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.date = {
        $gte: new Date(startDate)
      };
    } else if (endDate) {
      filter.date = {
        $lte: new Date(endDate)
      };
    }
    
    // Thực hiện query với phân trang
    const total = await Statistic.countDocuments(filter);
    const statistics = await Statistic.find(filter)
      .populate({
        path: 'productsSold.product',
        select: 'name code'
      })
      .populate({
        path: 'vouchersUsed.voucher',
        select: 'code name'
      })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Trả về kết quả
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách thống kê thành công',
      data: {
        statistics,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thống kê:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách thống kê',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết thống kê
 * @route GET /api/statistics/:id
 * @access Private/Admin
 */
export const getStatisticById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID thống kê không hợp lệ'
      });
    }
    
    const statistic = await Statistic.findById(id)
      .populate({
        path: 'productsSold.product',
        select: 'name code'
      })
      .populate({
        path: 'vouchersUsed.voucher',
        select: 'code name'
      });
    
    if (!statistic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thống kê'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin thống kê thành công',
      data: statistic
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết thống kê:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin thống kê',
      error: error.message
    });
  }
};

/**
 * Tạo thống kê mới
 * @route POST /api/statistics
 * @access Private/Admin
 */
export const createStatistic = async (req, res) => {
  try {
    const { date, type, totalOrders, totalRevenue, totalProfit, productsSold, vouchersUsed, customerCount } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!date || !type) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: date, type'
      });
    }

    // Tạo thống kê mới
    const newStatistic = new Statistic({
      date,
      type,
      totalOrders: totalOrders || 0,
      totalRevenue: totalRevenue || 0,
      totalProfit: totalProfit || 0,
      productsSold: productsSold || [],
      vouchersUsed: vouchersUsed || [],
      customerCount: customerCount || { new: 0, total: 0 }
    });

    await newStatistic.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo thống kê thành công',
      data: newStatistic
    });
  } catch (error) {
    console.error('Lỗi khi tạo thống kê:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thống kê',
      error: error.message
    });
  }
};

/**
 * Cập nhật thống kê
 * @route PUT /api/statistics/:id
 * @access Private/Admin
 */
export const updateStatistic = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalOrders, totalRevenue, totalProfit, productsSold, vouchersUsed, customerCount } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID thống kê không hợp lệ'
      });
    }
    
    // Tìm thống kê cần cập nhật
    const statistic = await Statistic.findById(id);
    
    if (!statistic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thống kê'
      });
    }
    
    // Cập nhật thông tin
    if (totalOrders !== undefined) statistic.totalOrders = totalOrders;
    if (totalRevenue !== undefined) statistic.totalRevenue = totalRevenue;
    if (totalProfit !== undefined) statistic.totalProfit = totalProfit;
    if (productsSold) statistic.productsSold = productsSold;
    if (vouchersUsed) statistic.vouchersUsed = vouchersUsed;
    if (customerCount) statistic.customerCount = customerCount;
    
    await statistic.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật thống kê thành công',
      data: statistic
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật thống kê:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thống kê',
      error: error.message
    });
  }
};

/**
 * Xóa thống kê
 * @route DELETE /api/statistics/:id
 * @access Private/Admin
 */
export const deleteStatistic = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID thống kê không hợp lệ'
      });
    }
    
    const statistic = await Statistic.findByIdAndDelete(id);
    
    if (!statistic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thống kê'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Xóa thống kê thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa thống kê:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa thống kê',
      error: error.message
    });
  }
};

/**
 * Lấy báo cáo doanh thu
 * @route GET /api/statistics/revenue
 * @access Private/Admin
 */
export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, type = 'DAILY' } = req.query;
    
    // Kiểm tra ngày bắt đầu và kết thúc
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp startDate và endDate'
      });
    }
    
    // Tạo filter cho query
    const filter = {
      type,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    // Thực hiện query
    const statistics = await Statistic.find(filter)
      .select('date totalRevenue totalOrders')
      .sort({ date: 1 });
    
    // Trả về kết quả
    return res.status(200).json({
      success: true,
      message: 'Lấy báo cáo doanh thu thành công',
      data: statistics
    });
  } catch (error) {
    console.error('Lỗi khi lấy báo cáo doanh thu:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy báo cáo doanh thu',
      error: error.message
    });
  }
};

/**
 * Lấy báo cáo sản phẩm bán chạy
 * @route GET /api/statistics/top-products
 * @access Private/Admin
 */
export const getTopProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    // Kiểm tra ngày bắt đầu và kết thúc
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp startDate và endDate'
      });
    }
    
    // Tạo filter cho query
    const filter = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    // Tìm tất cả thống kê trong khoảng thời gian
    const statistics = await Statistic.find(filter)
      .populate({
        path: 'productsSold.product',
        select: 'name code'
      });
    
    // Tổng hợp dữ liệu sản phẩm
    const productMap = new Map();
    
    statistics.forEach(stat => {
      stat.productsSold.forEach(item => {
        if (item.product) {
          const productId = item.product._id.toString();
          const currentData = productMap.get(productId) || {
            product: item.product,
            totalQuantity: 0,
            totalRevenue: 0
          };
          
          currentData.totalQuantity += item.quantity;
          currentData.totalRevenue += item.revenue;
          
          productMap.set(productId, currentData);
        }
      });
    });
    
    // Chuyển kết quả thành mảng và sắp xếp
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, parseInt(limit));
    
    // Trả về kết quả
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sản phẩm bán chạy thành công',
      data: topProducts
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm bán chạy:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm bán chạy',
      error: error.message
    });
  }
};

/**
 * Tạo thống kê theo ngày
 * @route POST /api/statistics/generate-daily
 * @access Private/Admin
 */
export const generateDailyStatistic = async (req, res) => {
  try {
    const { date } = req.body;
    
    // Kiểm tra ngày
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày để tạo thống kê'
      });
    }
    
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
    // Kiểm tra xem đã có thống kê cho ngày này chưa
    const existingStatistic = await Statistic.findOne({
      type: 'DAILY',
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    if (existingStatistic) {
      return res.status(400).json({
        success: false,
        message: 'Đã tồn tại thống kê cho ngày này'
      });
    }
    
    // Tạo thống kê mới (trong thực tế, bạn sẽ truy vấn dữ liệu từ các nguồn khác)
    // Đây chỉ là ví dụ, bạn cần thay thế phần này bằng logic thực tế
    const newStatistic = new Statistic({
      date: startOfDay,
      type: 'DAILY',
      totalOrders: 0,
      totalRevenue: 0,
      totalProfit: 0,
      productsSold: [],
      vouchersUsed: [],
      customerCount: { new: 0, total: 0 }
    });
    
    await newStatistic.save();
    
    return res.status(201).json({
      success: true,
      message: 'Tạo thống kê ngày thành công',
      data: newStatistic
    });
  } catch (error) {
    console.error('Lỗi khi tạo thống kê ngày:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thống kê ngày',
      error: error.message
    });
  }
}; 