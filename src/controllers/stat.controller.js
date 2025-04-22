import { Product } from '../models/index.js';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Bill from '../models/bill.model.js';
import Account from '../models/account.model.js';

// Thống kê doanh thu theo khoảng thời gian
export const getRevenueStat = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    let matchStage = { status: 'Delivered' };
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let groupStage = {};
    
    // Phân nhóm theo ngày, tháng hoặc năm
    if (type === 'daily') {
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$totalPrice" },
          count: { $sum: 1 }
        }
      };
    } else if (type === 'monthly') {
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalRevenue: { $sum: "$totalPrice" },
          count: { $sum: 1 }
        }
      };
    } else {
      // Mặc định theo năm
      groupStage = {
        $group: {
          _id: { $dateToString: { format: "%Y", date: "$createdAt" } },
          totalRevenue: { $sum: "$totalPrice" },
          count: { $sum: 1 }
        }
      };
    }

    const stats = await Order.aggregate([
      { $match: matchStage },
      groupStage,
      { $sort: { _id: 1 } }
    ]);

    // Tính tổng doanh thu
    const totalRevenue = stats.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    
    res.json({
      success: true,
      data: {
        stats,
        summary: {
          totalRevenue,
          totalOrders: stats.reduce((acc, curr) => acc + curr.count, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Thống kê đơn hàng theo trạng thái
export const getOrderStat = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Thống kê theo trạng thái đơn hàng
    const orderByStatus = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" }
        }
      }
    ]);

    // Thống kê theo phương thức thanh toán
    const orderByPayment = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: orderByStatus,
        byPayment: orderByPayment,
        summary: {
          totalOrders: orderByStatus.reduce((acc, curr) => acc + curr.count, 0),
          totalRevenue: orderByStatus.reduce((acc, curr) => acc + curr.revenue, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Thống kê sản phẩm bán chạy
export const getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    let matchStage = { status: 'Delivered' };
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Tìm các sản phẩm bán chạy nhất
    const topProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.name" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $addFields: {
          image: { $arrayElemAt: ["$productDetails.images", 0] },
          category: { $arrayElemAt: ["$productDetails.category", 0] }
        }
      },
      {
        $project: {
          productDetails: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Thống kê hàng tồn kho
export const getInventoryStat = async (req, res) => {
  try {
    // Thống kê sản phẩm theo số lượng tồn kho
    const inventorySummary = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: "$countInStock" },
          outOfStock: {
            $sum: {
              $cond: [{ $eq: ["$countInStock", 0] }, 1, 0]
            }
          },
          lowStock: {
            $sum: {
              $cond: [{ $and: [{ $gt: ["$countInStock", 0] }, { $lte: ["$countInStock", 5] }] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Thống kê sản phẩm theo danh mục
    const inventoryByCategory = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          totalStock: { $sum: "$countInStock" },
          avgStock: { $avg: "$countInStock" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Sản phẩm sắp hết hàng
    const lowStockProducts = await Product.find({
      countInStock: { $gt: 0, $lte: 5 }
    })
    .select('name images countInStock price category')
    .sort({ countInStock: 1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        summary: inventorySummary[0] || {
          totalProducts: 0,
          totalStock: 0,
          outOfStock: 0,
          lowStock: 0
        },
        byCategory: inventoryByCategory,
        lowStockProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Thống kê khách hàng mới và tổng số khách hàng
export const getCustomerStat = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Tổng số khách hàng
    const totalCustomers = await User.countDocuments({ role: 'User' });
    
    let matchStage = {};
    
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Khách hàng mới trong khoảng thời gian
    const newCustomers = await User.countDocuments({
      ...matchStage,
      role: 'User'
    });

    // Khách hàng có đơn hàng nhiều nhất
    const topCustomers = await Order.aggregate([
      { $match: { ...matchStage, status: 'Delivered' } },
      {
        $group: {
          _id: "$userId",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalPrice" }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $addFields: {
          name: { $arrayElemAt: ["$userDetails.name", 0] },
          email: { $arrayElemAt: ["$userDetails.email", 0] }
        }
      },
      {
        $project: {
          userDetails: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          newCustomers
        },
        topCustomers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Thống kê tổng quan
 * @route GET /api/stats/overview
 * @access Private (Admin, Staff)
 */
export const getOverviewStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Thống kê đơn hàng
    const totalOrders = await Bill.countDocuments();
    const todayOrders = await Bill.countDocuments({ createdAt: { $gte: today } });
    const monthOrders = await Bill.countDocuments({ createdAt: { $gte: startOfMonth } });
    const yearOrders = await Bill.countDocuments({ createdAt: { $gte: startOfYear } });

    // Thống kê doanh thu
    const totalRevenue = await Bill.aggregate([
      { $match: { status: 'DA_THANH_TOAN' } },
      { $group: { _id: null, total: { $sum: '$moneyAfter' } } }
    ]);

    const todayRevenue = await Bill.aggregate([
      { $match: { status: 'DA_THANH_TOAN', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$moneyAfter' } } }
    ]);

    const monthRevenue = await Bill.aggregate([
      { $match: { status: 'DA_THANH_TOAN', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$moneyAfter' } } }
    ]);

    const yearRevenue = await Bill.aggregate([
      { $match: { status: 'DA_THANH_TOAN', createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$moneyAfter' } } }
    ]);

    // Thống kê sản phẩm và khách hàng
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await Account.countDocuments({ role: 'CUSTOMER' });

    // Đơn hàng theo trạng thái
    const ordersByStatus = await Bill.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê tổng quan thành công',
      data: {
        orders: {
          total: totalOrders,
          today: todayOrders,
          month: monthOrders,
          year: yearOrders
        },
        revenue: {
          total: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
          today: todayRevenue.length > 0 ? todayRevenue[0].total : 0,
          month: monthRevenue.length > 0 ? monthRevenue[0].total : 0,
          year: yearRevenue.length > 0 ? yearRevenue[0].total : 0
        },
        products: totalProducts,
        customers: totalCustomers,
        ordersByStatus: ordersByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê tổng quan',
      error: error.message
    });
  }
};

/**
 * Thống kê doanh thu theo thời gian
 * @route GET /api/stats/revenue
 * @access Private (Admin, Staff)
 */
export const getRevenueStats = async (req, res) => {
  try {
    const { type = 'month', start, end } = req.query;
    let startDate, endDate, groupId;

    if (start && end) {
      startDate = new Date(start);
      endDate = new Date(end);
    } else {
      const now = new Date();
      if (type === 'day') {
        // Thống kê 30 ngày gần nhất
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 29);
        groupId = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      } else if (type === 'month') {
        // Thống kê 12 tháng gần nhất
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
        groupId = { 
          year: { $year: '$createdAt' }, 
          month: { $month: '$createdAt' } 
        };
      } else if (type === 'year') {
        // Thống kê 5 năm gần nhất
        endDate = new Date(now.getFullYear(), 11, 31);
        startDate = new Date(now.getFullYear() - 4, 0, 1);
        groupId = { $year: '$createdAt' };
      }
    }

    // Thống kê doanh thu
    const revenueStats = await Bill.aggregate([
      { 
        $match: { 
          status: 'DA_THANH_TOAN', 
          createdAt: { $gte: startDate, $lte: endDate } 
        } 
      },
      { 
        $group: { 
          _id: groupId,
          revenue: { $sum: '$moneyAfter' },
          count: { $sum: 1 }
        } 
      },
      { $sort: { '_id': 1 } }
    ]);

    // Định dạng kết quả
    let formattedStats = [];
    if (type === 'day') {
      formattedStats = revenueStats.map(item => ({
        date: item._id,
        revenue: item.revenue,
        count: item.count
      }));
    } else if (type === 'month') {
      formattedStats = revenueStats.map(item => ({
        date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        revenue: item.revenue,
        count: item.count
      }));
    } else if (type === 'year') {
      formattedStats = revenueStats.map(item => ({
        date: item._id.toString(),
        revenue: item.revenue,
        count: item.count
      }));
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê doanh thu thành công',
      data: {
        timeRange: {
          start: startDate,
          end: endDate
        },
        stats: formattedStats
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê doanh thu',
      error: error.message
    });
  }
};

/**
 * Thống kê sản phẩm bán chạy
 * @route GET /api/stats/best-selling
 * @access Private (Admin, Staff)
 */
export const getBestSellingProducts = async (req, res) => {
  try {
    const { limit = 10, start, end } = req.query;
    let matchQuery = { status: 'DA_THANH_TOAN' };

    if (start && end) {
      matchQuery.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }

    const bestSellingProducts = await Bill.aggregate([
      { $match: matchQuery },
      { $unwind: '$billDetails' },
      { 
        $group: { 
          _id: '$billDetails.productDetail',
          totalSold: { $sum: '$billDetails.quantity' },
          revenue: { $sum: { $multiply: ['$billDetails.price', '$billDetails.quantity'] } }
        } 
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
      { 
        $lookup: {
          from: 'products',
          let: { variantId: '$_id' },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $in: ['$$variantId', '$variants._id'] 
                } 
              } 
            },
            {
              $addFields: {
                variant: {
                  $filter: {
                    input: '$variants',
                    as: 'v',
                    cond: { $eq: ['$$v._id', '$$variantId'] }
                  }
                }
              }
            },
            { 
              $project: { 
                _id: 1, 
                name: 1, 
                variant: { $arrayElemAt: ['$variant', 0] }
              } 
            }
          ],
          as: 'product'
        }
      },
      { 
        $addFields: { 
          product: { $arrayElemAt: ['$product', 0] } 
        } 
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê sản phẩm bán chạy thành công',
      data: bestSellingProducts
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê sản phẩm bán chạy',
      error: error.message
    });
  }
};

/**
 * Thống kê sản phẩm sắp hết
 * @route GET /api/stats/low-stock
 * @access Private (Admin, Staff)
 */
export const getLowStockProducts = async (req, res) => {
  try {
    const { threshold = 10, limit = 20 } = req.query;
    
    // Lấy danh sách sản phẩm có số lượng dưới ngưỡng
    const lowStockProducts = await Product.aggregate([
      { $unwind: '$variants' },
      { 
        $match: { 
          'variants.status': 'HOAT_DONG',
          'variants.amount': { $lte: parseInt(threshold) }
        } 
      },
      { $sort: { 'variants.amount': 1 } },
      { $limit: parseInt(limit) },
      { 
        $project: {
          _id: 1,
          name: 1,
          variant: '$variants'
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê sản phẩm sắp hết thành công',
      data: lowStockProducts
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê sản phẩm sắp hết',
      error: error.message
    });
  }
};

/**
 * Thống kê khách hàng tiềm năng
 * @route GET /api/stats/potential-customers
 * @access Private (Admin, Staff)
 */
export const getPotentialCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Lấy danh sách khách hàng có tổng chi tiêu cao nhất
    const potentialCustomers = await Bill.aggregate([
      { $match: { status: 'DA_THANH_TOAN', customer: { $ne: null } } },
      { 
        $group: { 
          _id: '$customer',
          totalSpent: { $sum: '$moneyAfter' },
          orderCount: { $sum: 1 }
        } 
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) },
      { 
        $lookup: {
          from: 'accounts',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { 
        $addFields: { 
          customer: { $arrayElemAt: ['$customerInfo', 0] } 
        } 
      },
      { 
        $project: {
          customerId: '$_id',
          fullName: '$customer.fullName',
          email: '$customer.email',
          phoneNumber: '$customer.phoneNumber',
          totalSpent: 1,
          orderCount: 1,
          _id: 0
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê khách hàng tiềm năng thành công',
      data: potentialCustomers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê khách hàng tiềm năng',
      error: error.message
    });
  }
};

/**
 * Thống kê tăng trưởng theo thời gian
 * @route GET /api/stats/growth
 * @access Private (Admin, Staff)
 */
export const getGrowthStats = async (req, res) => {
  try {
    const now = new Date();
    
    // Tính toán thời gian
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1); // Không sử dụng
    
    const thisYear = new Date(now.getFullYear(), 0, 1);
    const lastYear = new Date(now.getFullYear() - 1, 0, 1);
    
    // Thống kê doanh thu theo tháng
    const [thisMonthRevenue, lastMonthRevenue, thisYearRevenue, lastYearRevenue] = await Promise.all([
      Bill.aggregate([
        { $match: { status: 'DA_THANH_TOAN', createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$moneyAfter' } } }
      ]),
      Bill.aggregate([
        { $match: { status: 'DA_THANH_TOAN', createdAt: { $gte: lastMonth, $lt: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$moneyAfter' } } }
      ]),
      Bill.aggregate([
        { $match: { status: 'DA_THANH_TOAN', createdAt: { $gte: thisYear } } },
        { $group: { _id: null, total: { $sum: '$moneyAfter' } } }
      ]),
      Bill.aggregate([
        { $match: { status: 'DA_THANH_TOAN', createdAt: { $gte: lastYear, $lt: thisYear } } },
        { $group: { _id: null, total: { $sum: '$moneyAfter' } } }
      ])
    ]);
    
    // Thống kê số đơn hàng theo tháng
    const [thisMonthOrders, lastMonthOrders, thisYearOrders, lastYearOrders] = await Promise.all([
      Bill.countDocuments({ createdAt: { $gte: thisMonth } }),
      Bill.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),
      Bill.countDocuments({ createdAt: { $gte: thisYear } }),
      Bill.countDocuments({ createdAt: { $gte: lastYear, $lt: thisYear } })
    ]);
    
    // Thống kê số khách hàng mới theo tháng
    const [thisMonthCustomers, lastMonthCustomers, thisYearCustomers, lastYearCustomers] = await Promise.all([
      Account.countDocuments({ role: 'CUSTOMER', createdAt: { $gte: thisMonth } }),
      Account.countDocuments({ role: 'CUSTOMER', createdAt: { $gte: lastMonth, $lt: thisMonth } }),
      Account.countDocuments({ role: 'CUSTOMER', createdAt: { $gte: thisYear } }),
      Account.countDocuments({ role: 'CUSTOMER', createdAt: { $gte: lastYear, $lt: thisYear } })
    ]);
    
    // Tính tỷ lệ tăng trưởng
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    const thisMonthRevenueValue = thisMonthRevenue.length > 0 ? thisMonthRevenue[0].total : 0;
    const lastMonthRevenueValue = lastMonthRevenue.length > 0 ? lastMonthRevenue[0].total : 0;
    const thisYearRevenueValue = thisYearRevenue.length > 0 ? thisYearRevenue[0].total : 0;
    const lastYearRevenueValue = lastYearRevenue.length > 0 ? lastYearRevenue[0].total : 0;
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê tăng trưởng thành công',
      data: {
        revenue: {
          month: {
            current: thisMonthRevenueValue,
            previous: lastMonthRevenueValue,
            growth: calculateGrowth(thisMonthRevenueValue, lastMonthRevenueValue)
          },
          year: {
            current: thisYearRevenueValue,
            previous: lastYearRevenueValue,
            growth: calculateGrowth(thisYearRevenueValue, lastYearRevenueValue)
          }
        },
        orders: {
          month: {
            current: thisMonthOrders,
            previous: lastMonthOrders,
            growth: calculateGrowth(thisMonthOrders, lastMonthOrders)
          },
          year: {
            current: thisYearOrders,
            previous: lastYearOrders,
            growth: calculateGrowth(thisYearOrders, lastYearOrders)
          }
        },
        customers: {
          month: {
            current: thisMonthCustomers,
            previous: lastMonthCustomers,
            growth: calculateGrowth(thisMonthCustomers, lastMonthCustomers)
          },
          year: {
            current: thisYearCustomers,
            previous: lastYearCustomers,
            growth: calculateGrowth(thisYearCustomers, lastYearCustomers)
          }
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thống kê tăng trưởng',
      error: error.message
    });
  }
}; 