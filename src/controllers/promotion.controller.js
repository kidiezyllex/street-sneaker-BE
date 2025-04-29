import Promotion from '../models/promotion.model.js';
import mongoose from 'mongoose';

/**
 * Tạo chương trình khuyến mãi mới
 * @route POST /api/promotions
 * @access Private/Admin
 */
export const createPromotion = async (req, res) => {
  try {
    const { name, description, discountPercent, products, startDate, endDate } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !discountPercent || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: name, discountPercent, startDate, endDate'
      });
    }

    // Kiểm tra discountPercent hợp lệ
    if (discountPercent < 0 || discountPercent > 100) {
      return res.status(400).json({
        success: false,
        message: 'Phần trăm giảm giá phải từ 0 đến 100'
      });
    }

    // Kiểm tra thời gian hợp lệ
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
      });
    }

    // Kiểm tra products có hợp lệ không
    if (products && products.length > 0) {
      const invalidProducts = products.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidProducts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách sản phẩm không hợp lệ'
        });
      }
    }

    // Tạo chương trình khuyến mãi mới
    const newPromotion = new Promotion({
      name,
      description,
      discountPercent,
      products: products || [],
      startDate,
      endDate,
      status: 'HOAT_DONG'
    });

    await newPromotion.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo chương trình khuyến mãi thành công',
      data: newPromotion
    });
  } catch (error) {
    console.error('Lỗi khi tạo chương trình khuyến mãi:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo chương trình khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách chương trình khuyến mãi
 * @route GET /api/promotions
 * @access Private/Admin
 */
export const getPromotions = async (req, res) => {
  try {
    const { status, search, startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Xây dựng query filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (startDate && endDate) {
      filter.$and = [
        { startDate: { $lte: new Date(endDate) } },
        { endDate: { $gte: new Date(startDate) } }
      ];
    }
    
    // Thực hiện query với phân trang
    const total = await Promotion.countDocuments(filter);
    const promotions = await Promotion.find(filter)
      .populate('products', 'name code price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Trả về kết quả
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách chương trình khuyến mãi thành công',
      data: {
        promotions,
        pagination: {
          totalItems: total,
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khuyến mãi:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết chương trình khuyến mãi
 * @route GET /api/promotions/:id
 * @access Private/Admin
 */
export const getPromotionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chương trình khuyến mãi không hợp lệ'
      });
    }
    
    const promotion = await Promotion.findById(id)
      .populate('products', 'name code price images');
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình khuyến mãi'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin chương trình khuyến mãi thành công',
      data: promotion
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết khuyến mãi:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Cập nhật chương trình khuyến mãi
 * @route PUT /api/promotions/:id
 * @access Private/Admin
 */
export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, discountPercent, products, startDate, endDate, status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chương trình khuyến mãi không hợp lệ'
      });
    }
    
    // Tìm chương trình khuyến mãi cần cập nhật
    const promotion = await Promotion.findById(id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình khuyến mãi'
      });
    }
    
    // Kiểm tra và cập nhật thông tin
    if (name) promotion.name = name;
    if (description !== undefined) promotion.description = description;
    
    if (discountPercent !== undefined) {
      if (discountPercent < 0 || discountPercent > 100) {
        return res.status(400).json({
          success: false,
          message: 'Phần trăm giảm giá phải từ 0 đến 100'
        });
      }
      promotion.discountPercent = discountPercent;
    }
    
    if (products) {
      const invalidProducts = products.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidProducts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách sản phẩm không hợp lệ'
        });
      }
      promotion.products = products;
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
        });
      }
      promotion.startDate = startDate;
      promotion.endDate = endDate;
    } else if (startDate) {
      const start = new Date(startDate);
      const end = new Date(promotion.endDate);
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
        });
      }
      promotion.startDate = startDate;
    } else if (endDate) {
      const start = new Date(promotion.startDate);
      const end = new Date(endDate);
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
        });
      }
      promotion.endDate = endDate;
    }
    
    if (status) promotion.status = status;
    
    await promotion.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật chương trình khuyến mãi thành công',
      data: promotion
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật khuyến mãi:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Xóa chương trình khuyến mãi
 * @route DELETE /api/promotions/:id
 * @access Private/Admin
 */
export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chương trình khuyến mãi không hợp lệ'
      });
    }
    
    const promotion = await Promotion.findByIdAndDelete(id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chương trình khuyến mãi'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Xóa chương trình khuyến mãi thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa khuyến mãi:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách khuyến mãi đang áp dụng cho sản phẩm
 * @route GET /api/promotions/product/:productId
 * @access Public
 */
export const getProductPromotions = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'ID sản phẩm không hợp lệ'
      });
    }
    
    const currentDate = new Date();
    
    const promotions = await Promotion.find({
      products: productId,
      status: 'HOAT_DONG',
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).select('name discountPercent startDate endDate');
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách khuyến mãi thành công',
      data: promotions
    });
  } catch (error) {
    console.error('Lỗi khi lấy khuyến mãi của sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy khuyến mãi',
      error: error.message
    });
  }
}; 