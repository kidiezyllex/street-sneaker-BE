import { Promotion, Voucher } from '../models/index.js';

/**
 * Lấy danh sách tất cả khuyến mãi có phân trang
 * @route GET /api/promotions
 * @access Private (Admin, Staff)
 */
export const getAllPromotions = async (req, res) => {
  try {
    let { page = 1, limit = 10, sort = '-createdAt', name, code, type, status, fromDate, toDate } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Xây dựng query
    const query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (code) query.code = { $regex: code, $options: 'i' };
    if (type) query.type = type;
    if (status) query.status = status;

    // Filter theo khoảng thời gian
    if (fromDate && toDate) {
      query.$and = [
        { startDate: { $lte: new Date(toDate) } },
        { endDate: { $gte: new Date(fromDate) } }
      ];
    } else if (fromDate) {
      query.endDate = { $gte: new Date(fromDate) };
    } else if (toDate) {
      query.startDate = { $lte: new Date(toDate) };
    }

    // Thực hiện truy vấn
    const total = await Promotion.countDocuments(query);
    const promotions = await Promotion.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách khuyến mãi thành công',
      data: {
        promotions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin chi tiết khuyến mãi
 * @route GET /api/promotions/:id
 * @access Private (Admin, Staff)
 */
export const getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khuyến mãi'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin khuyến mãi thành công',
      data: promotion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Thêm khuyến mãi mới
 * @route POST /api/promotions
 * @access Private (Admin)
 */
export const createPromotion = async (req, res) => {
  try {
    const { name, type, value, startDate, endDate, description } = req.body;

    // Kiểm tra tên khuyến mãi đã tồn tại chưa
    const existingPromotion = await Promotion.findOne({ name });
    if (existingPromotion) {
      return res.status(400).json({
        success: false,
        message: 'Tên khuyến mãi đã tồn tại'
      });
    }

    // Kiểm tra giá trị khuyến mãi
    if (type === 'PHAN_TRAM' && (value <= 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị phần trăm phải nằm trong khoảng (0, 100]'
      });
    }

    if (type === 'TIEN_MAT' && value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị tiền mặt phải lớn hơn 0'
      });
    }

    // Kiểm tra thời gian
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian bắt đầu phải trước thời gian kết thúc'
      });
    }

    // Tạo khuyến mãi mới
    const newPromotion = new Promotion({
      name,
      type,
      value,
      startDate,
      endDate,
      description
    });

    await newPromotion.save();

    return res.status(201).json({
      success: true,
      message: 'Thêm khuyến mãi mới thành công',
      data: newPromotion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm khuyến mãi mới',
      error: error.message
    });
  }
};

/**
 * Cập nhật khuyến mãi
 * @route PUT /api/promotions/:id
 * @access Private (Admin)
 */
export const updatePromotion = async (req, res) => {
  try {
    const { name, type, value, startDate, endDate, status, description } = req.body;
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khuyến mãi'
      });
    }

    // Kiểm tra tên khuyến mãi mới đã tồn tại chưa
    if (name && name !== promotion.name) {
      const existingPromotion = await Promotion.findOne({ name });
      if (existingPromotion) {
        return res.status(400).json({
          success: false,
          message: 'Tên khuyến mãi đã tồn tại'
        });
      }
      promotion.name = name;
    }

    // Kiểm tra giá trị khuyến mãi
    if (type && value) {
      if (type === 'PHAN_TRAM' && (value <= 0 || value > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Giá trị phần trăm phải nằm trong khoảng (0, 100]'
        });
      }

      if (type === 'TIEN_MAT' && value <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Giá trị tiền mặt phải lớn hơn 0'
        });
      }

      promotion.type = type;
      promotion.value = value;
    } else if (value) {
      if (promotion.type === 'PHAN_TRAM' && (value <= 0 || value > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Giá trị phần trăm phải nằm trong khoảng (0, 100]'
        });
      }

      if (promotion.type === 'TIEN_MAT' && value <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Giá trị tiền mặt phải lớn hơn 0'
        });
      }

      promotion.value = value;
    } else if (type) {
      promotion.type = type;
    }

    // Kiểm tra thời gian
    if (startDate && endDate) {
      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian bắt đầu phải trước thời gian kết thúc'
        });
      }
      promotion.startDate = startDate;
      promotion.endDate = endDate;
    } else if (startDate) {
      if (new Date(startDate) >= new Date(promotion.endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian bắt đầu phải trước thời gian kết thúc'
        });
      }
      promotion.startDate = startDate;
    } else if (endDate) {
      if (new Date(promotion.startDate) >= new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian bắt đầu phải trước thời gian kết thúc'
        });
      }
      promotion.endDate = endDate;
    }

    if (description !== undefined) promotion.description = description;
    if (status) promotion.status = status;

    await promotion.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật khuyến mãi thành công',
      data: promotion
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Xóa khuyến mãi
 * @route DELETE /api/promotions/:id
 * @access Private (Admin)
 */
export const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khuyến mãi'
      });
    }

    // Ẩn khuyến mãi thay vì xóa
    promotion.status = 'NGUNG_HOAT_DONG';
    await promotion.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa khuyến mãi thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa khuyến mãi',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách khuyến mãi đang hoạt động
 * @route GET /api/promotions/active
 * @access Public
 */
export const getActivePromotions = async (req, res) => {
  try {
    const now = new Date();
    
    const promotions = await Promotion.find({
      status: 'DANG_HOAT_DONG',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách khuyến mãi đang hoạt động thành công',
      data: promotions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách khuyến mãi đang hoạt động',
      error: error.message
    });
  }
};

// =================== Voucher Controller ===================

// Lấy danh sách voucher với phân trang và lọc
export const getAllVouchers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Xây dựng query filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    // Thực hiện query với phân trang
    const total = await Voucher.countDocuments(filter);
    const vouchers = await Voucher.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách voucher thành công',
      data: {
        vouchers,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách voucher',
      error: error.message
    });
  }
};

// Lấy chi tiết voucher theo ID
export const getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const voucher = await Voucher.findById(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin voucher thành công',
      data: voucher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin voucher',
      error: error.message
    });
  }
};

// Tạo voucher mới
export const createVoucher = async (req, res) => {
  try {
    const { name, value, maximumValue, type, typeValue, minimumAmount, quantity, startDate, endDate } = req.body;
    
    // Kiểm tra tên voucher đã tồn tại chưa
    const existingVoucher = await Voucher.findOne({ name });
    
    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: 'Tên voucher đã tồn tại'
      });
    }
    
    // Tạo voucher mới (code tự động tạo trong pre-save)
    const newVoucher = new Voucher({
      name,
      value,
      maximumValue,
      type,
      typeValue,
      minimumAmount,
      quantity,
      startDate,
      endDate,
      customers: []
    });
    
    await newVoucher.save();
    
    return res.status(201).json({
      success: true,
      message: 'Tạo voucher thành công',
      data: newVoucher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo voucher',
      error: error.message
    });
  }
};

// Cập nhật voucher
export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value, maximumValue, type, typeValue, minimumAmount, quantity, startDate, endDate, status } = req.body;
    
    // Tìm voucher cần cập nhật
    const voucher = await Voucher.findById(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }
    
    // Kiểm tra nếu đổi tên thì cần kiểm tra tên mới đã tồn tại chưa
    if (name && name !== voucher.name) {
      const existingVoucher = await Voucher.findOne({ name });
      
      if (existingVoucher) {
        return res.status(400).json({
          success: false,
          message: 'Tên voucher đã tồn tại'
        });
      }
      
      voucher.name = name;
    }
    
    // Cập nhật thông tin voucher
    if (value) voucher.value = value;
    if (maximumValue) voucher.maximumValue = maximumValue;
    if (type) voucher.type = type;
    if (typeValue) voucher.typeValue = typeValue;
    if (minimumAmount) voucher.minimumAmount = minimumAmount;
    if (quantity) voucher.quantity = quantity;
    if (startDate) voucher.startDate = startDate;
    if (endDate) voucher.endDate = endDate;
    if (status) voucher.status = status;
    
    await voucher.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật voucher thành công',
      data: voucher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật voucher',
      error: error.message
    });
  }
};

// Thêm khách hàng vào voucher
export const addCustomerToVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountId } = req.body;
    
    // Tìm voucher
    const voucher = await Voucher.findById(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }
    
    // Kiểm tra khách hàng đã được thêm vào voucher chưa
    const existingCustomer = voucher.customers.find(c => c.account.toString() === accountId);
    
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Khách hàng đã được thêm vào voucher này'
      });
    }
    
    // Thêm khách hàng vào voucher
    voucher.customers.push({ account: accountId });
    
    await voucher.save();
    
    return res.status(200).json({
      success: true,
      message: 'Thêm khách hàng vào voucher thành công',
      data: voucher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm khách hàng vào voucher',
      error: error.message
    });
  }
};

// Xóa khách hàng khỏi voucher
export const removeCustomerFromVoucher = async (req, res) => {
  try {
    const { id, customerId } = req.params;
    
    // Tìm voucher
    const voucher = await Voucher.findById(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }
    
    // Tìm và xóa khách hàng khỏi voucher
    const customerIndex = voucher.customers.findIndex(c => c._id.toString() === customerId);
    
    if (customerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng trong voucher này'
      });
    }
    
    // Xóa khách hàng
    voucher.customers.splice(customerIndex, 1);
    
    await voucher.save();
    
    return res.status(200).json({
      success: true,
      message: 'Xóa khách hàng khỏi voucher thành công',
      data: voucher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa khách hàng khỏi voucher',
      error: error.message
    });
  }
}; 