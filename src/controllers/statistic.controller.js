import Statistic from '../models/statistic.model.js';
import mongoose from 'mongoose';

export const getStatistics = async (req, res) => {
  try {
    const { type, startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách thống kê',
      error: error.message
    });
  }
};

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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin thống kê',
      error: error.message
    });
  }
};

export const createStatistic = async (req, res) => {
  try {
    const { date, type, totalOrders, totalRevenue, totalProfit, productsSold, vouchersUsed, customerCount } = req.body;

    if (!date || !type) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: date, type'
      });
    }

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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thống kê',
      error: error.message
    });
  }
};

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
    
    const statistic = await Statistic.findById(id);
    
    if (!statistic) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thống kê'
      });
    }
    
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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thống kê',
      error: error.message
    });
  }
};

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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa thống kê',
      error: error.message
    });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, type = 'DAILY' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp startDate và endDate'
      });
    }
    
    const filter = {
      type,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    const statistics = await Statistic.find(filter)
      .select('date totalRevenue totalOrders')
      .sort({ date: 1 });
    
    return res.status(200).json({
      success: true,
      message: 'Lấy báo cáo doanh thu thành công',
      data: statistics
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy báo cáo doanh thu',
      error: error.message
    });
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp startDate và endDate'
      });
    }
    
    const filter = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    const statistics = await Statistic.find(filter)
      .populate({
        path: 'productsSold.product',
        select: 'name code'
      });
    
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
    
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, parseInt(limit));
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách sản phẩm bán chạy thành công',
      data: topProducts
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm bán chạy',
      error: error.message
    });
  }
};

export const generateDailyStatistic = async (req, res) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày để tạo thống kê'
      });
    }
    
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
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
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thống kê ngày',
      error: error.message
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const { days } = req.query;
    
    // Tính toán khoảng thời gian
    let dateFilter = {};
    if (days) {
      const daysNum = parseInt(days);
      if (daysNum > 0) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - daysNum);
        
        dateFilter = {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        };
      }
    }

    // Import models
    const Order = (await import('../models/order.model.js')).default;
    const Account = (await import('../models/account.model.js')).default;
    const Product = (await import('../models/product.model.js')).default;

    // 1. Tổng doanh thu từ các đơn hàng đã hoàn thành
    const revenueResult = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          orderStatus: { $in: ['DA_GIAO_HANG', 'HOAN_THANH'] },
          paymentStatus: 'PAID'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // 2. Tổng số đơn hàng
    const totalOrders = await Order.countDocuments({
      ...dateFilter,
      orderStatus: { $ne: 'DA_HUY' }
    });

    // 3. Tính lợi nhuận (doanh thu - chi phí sản xuất)
    // Giả sử lợi nhuận = 30% doanh thu (có thể điều chỉnh theo logic business)
    const profitMargin = 0.3; // 30% profit margin
    const totalProfit = totalRevenue * profitMargin;

    // 4. Khách hàng mới
    const newCustomersCount = await Account.countDocuments({
      ...dateFilter,
      role: 'CUSTOMER'
    });

    // Thống kê bổ sung: Đơn hàng theo trạng thái
    const ordersByStatus = await Order.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Thống kê bổ sung: Doanh thu theo phương thức thanh toán
    const revenueByPaymentMethod = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          orderStatus: { $in: ['DA_GIAO_HANG', 'HOAN_THANH'] },
          paymentStatus: 'PAID'
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$total' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Thống kê bổ sung: Top 5 sản phẩm bán chạy
    const topProducts = await Order.aggregate([
      {
        $match: {
          ...dateFilter,
          orderStatus: { $in: ['DA_GIAO_HANG', 'HOAN_THANH'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $project: {
          _id: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          productName: { $arrayElemAt: ['$productInfo.name', 0] },
          productCode: { $arrayElemAt: ['$productInfo.code', 0] }
        }
      }
    ]);

    // Tính toán tỷ lệ tăng trưởng so với kỳ trước (nếu có days)
    let growthRate = null;
    if (days) {
      const daysNum = parseInt(days);
      const previousPeriodStart = new Date();
      previousPeriodStart.setDate(previousPeriodStart.getDate() - (daysNum * 2));
      const previousPeriodEnd = new Date();
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - daysNum);

      const previousRevenueResult = await Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: previousPeriodStart,
              $lte: previousPeriodEnd
            },
            orderStatus: { $in: ['DA_GIAO_HANG', 'HOAN_THANH'] },
            paymentStatus: 'PAID'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' }
          }
        }
      ]);

      const previousRevenue = previousRevenueResult.length > 0 ? previousRevenueResult[0].totalRevenue : 0;
      if (previousRevenue > 0) {
        growthRate = ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(2);
      }
    }

    const analytics = {
      period: days ? `${days} ngày gần nhất` : 'Tất cả thời gian',
      totalRevenue,
      totalOrders,
      totalProfit,
      newCustomers: newCustomersCount,
      growthRate: growthRate ? `${growthRate}%` : null,
      ordersByStatus,
      revenueByPaymentMethod,
      topProducts,
      averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0
    };

    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê phân tích thành công',
      data: analytics
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê phân tích',
      error: error.message
    });
  }
};
