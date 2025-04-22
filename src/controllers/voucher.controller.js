import Voucher from '../models/voucher.model.js';
import Account from '../models/account.model.js';
import mongoose from 'mongoose';

/**
 * Lấy danh sách tất cả voucher có phân trang
 * @route GET /api/vouchers
 * @access Private (Admin, Staff)
 */
export const getAllVouchers = async (req, res) => {
  try {
    let { page = 1, limit = 10, sort = '-createdAt', name, code, type, typeValue, status, fromDate, toDate } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Xây dựng query
    const query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (code) query.code = { $regex: code, $options: 'i' };
    if (type) query.type = type;
    if (typeValue) query.typeValue = typeValue;
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
    const total = await Voucher.countDocuments(query);
    const vouchers = await Voucher.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách voucher thành công',
      data: {
        vouchers,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách voucher',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin chi tiết voucher
 * @route GET /api/vouchers/:id
 * @access Private (Admin, Staff)
 */
export const getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id)
      .populate('customers.account', 'fullName email phoneNumber');
    
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

/**
 * Thêm voucher mới
 * @route POST /api/vouchers
 * @access Private (Admin)
 */
export const createVoucher = async (req, res) => {
  try {
    const { name, value, maximumValue, type, typeValue, minimumAmount, quantity, startDate, endDate } = req.body;

    // Kiểm tra tên và mã voucher đã tồn tại chưa
    const existingVoucher = await Voucher.findOne({ name });
    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: 'Tên voucher đã tồn tại'
      });
    }

    // Kiểm tra giá trị voucher
    if (typeValue === 'PHAN_TRAM' && (value <= 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị phần trăm phải nằm trong khoảng (0, 100]'
      });
    }

    if (typeValue === 'TIEN_MAT' && value <= 0) {
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

    // Tạo voucher mới
    const newVoucher = new Voucher({
      name,
      value,
      maximumValue: maximumValue || null,
      type,
      typeValue,
      minimumAmount: minimumAmount || 0,
      quantity,
      startDate,
      endDate,
      customers: []
    });

    await newVoucher.save();

    return res.status(201).json({
      success: true,
      message: 'Thêm voucher mới thành công',
      data: newVoucher
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm voucher mới',
      error: error.message
    });
  }
};

/**
 * Cập nhật voucher
 * @route PUT /api/vouchers/:id
 * @access Private (Admin)
 */
export const updateVoucher = async (req, res) => {
  try {
    const { name, value, maximumValue, type, typeValue, minimumAmount, quantity, startDate, endDate, status } = req.body;
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }

    // Kiểm tra tên voucher mới đã tồn tại chưa
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

    // Kiểm tra giá trị voucher
    if (typeValue && value) {
      if (typeValue === 'PHAN_TRAM' && (value <= 0 || value > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Giá trị phần trăm phải nằm trong khoảng (0, 100]'
        });
      }

      if (typeValue === 'TIEN_MAT' && value <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Giá trị tiền mặt phải lớn hơn 0'
        });
      }

      voucher.typeValue = typeValue;
      voucher.value = value;
    } else if (value) {
      if (voucher.typeValue === 'PHAN_TRAM' && (value <= 0 || value > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Giá trị phần trăm phải nằm trong khoảng (0, 100]'
        });
      }

      if (voucher.typeValue === 'TIEN_MAT' && value <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Giá trị tiền mặt phải lớn hơn 0'
        });
      }

      voucher.value = value;
    } else if (typeValue) {
      voucher.typeValue = typeValue;
    }

    // Kiểm tra thời gian
    if (startDate && endDate) {
      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian bắt đầu phải trước thời gian kết thúc'
        });
      }
      voucher.startDate = startDate;
      voucher.endDate = endDate;
    } else if (startDate) {
      if (new Date(startDate) >= new Date(voucher.endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian bắt đầu phải trước thời gian kết thúc'
        });
      }
      voucher.startDate = startDate;
    } else if (endDate) {
      if (new Date(voucher.startDate) >= new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: 'Thời gian bắt đầu phải trước thời gian kết thúc'
        });
      }
      voucher.endDate = endDate;
    }

    if (maximumValue !== undefined) voucher.maximumValue = maximumValue;
    if (type) voucher.type = type;
    if (minimumAmount !== undefined) voucher.minimumAmount = minimumAmount;
    if (quantity !== undefined) voucher.quantity = quantity;
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

/**
 * Xóa voucher
 * @route DELETE /api/vouchers/:id
 * @access Private (Admin)
 */
export const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }

    // Hủy voucher thay vì xóa
    voucher.status = 'BI_HUY';
    await voucher.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa voucher thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa voucher',
      error: error.message
    });
  }
};

/**
 * Thêm khách hàng vào voucher
 * @route POST /api/vouchers/:id/customers
 * @access Private (Admin, Staff)
 */
export const addCustomerToVoucher = async (req, res) => {
  try {
    const { accountId } = req.body;
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }

    // Kiểm tra trạng thái voucher
    if (voucher.status !== 'SU_DUNG') {
      return res.status(400).json({
        success: false,
        message: 'Voucher không khả dụng'
      });
    }

    // Kiểm tra số lượng voucher còn lại
    if (voucher.customers.length >= voucher.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Voucher đã hết số lượng'
      });
    }

    // Kiểm tra khách hàng đã tồn tại chưa
    const existingCustomer = voucher.customers.find(
      customer => customer.account.toString() === accountId
    );

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Khách hàng đã được thêm vào voucher này'
      });
    }

    // Kiểm tra khách hàng tồn tại
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng'
      });
    }

    // Thêm khách hàng
    voucher.customers.push({ account: accountId });
    await voucher.save();

    return res.status(201).json({
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

/**
 * Xóa khách hàng khỏi voucher
 * @route DELETE /api/vouchers/:id/customers/:customerId
 * @access Private (Admin, Staff)
 */
export const removeCustomerFromVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }

    // Tìm và xóa khách hàng
    const customerIndex = voucher.customers.findIndex(
      customer => customer._id.toString() === req.params.customerId
    );

    if (customerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng trong voucher'
      });
    }

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

/**
 * Kiểm tra voucher hợp lệ
 * @route POST /api/vouchers/check
 * @access Private
 */
export const checkVoucher = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;
    const accountId = req.user.id;

    const voucher = await Voucher.findOne({ code });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy voucher'
      });
    }

    // Kiểm tra trạng thái voucher
    if (voucher.status !== 'SU_DUNG') {
      return res.status(400).json({
        success: false,
        message: 'Voucher không khả dụng'
      });
    }

    // Kiểm tra thời gian hiệu lực
    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Voucher không trong thời gian hiệu lực'
      });
    }

    // Kiểm tra khách hàng được phép sử dụng
    if (voucher.customers.length > 0) {
      const isAllowed = voucher.customers.some(
        customer => customer.account.toString() === accountId
      );

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không được phép sử dụng voucher này'
        });
      }
    }

    // Kiểm tra số tiền tối thiểu
    if (totalAmount < voucher.minimumAmount) {
      return res.status(400).json({
        success: false,
        message: `Giá trị đơn hàng cần tối thiểu ${voucher.minimumAmount.toLocaleString('vi-VN')} đ để sử dụng voucher này`
      });
    }

    // Tính toán giá trị giảm giá
    let discountAmount = 0;
    if (voucher.typeValue === 'PHAN_TRAM') {
      discountAmount = (totalAmount * voucher.value) / 100;
      if (voucher.maximumValue && discountAmount > voucher.maximumValue) {
        discountAmount = voucher.maximumValue;
      }
    } else {
      discountAmount = voucher.value;
    }

    return res.status(200).json({
      success: true,
      message: 'Voucher hợp lệ',
      data: {
        voucher,
        discountAmount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi kiểm tra voucher',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách voucher của khách hàng
 * @route GET /api/vouchers/customer
 * @access Private
 */
export const getCustomerVouchers = async (req, res) => {
  try {
    const accountId = req.user.id;
    const now = new Date();

    // Tìm tất cả voucher mà khách hàng có thể sử dụng
    const vouchers = await Voucher.find({
      status: 'SU_DUNG',
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { 'customers.account': mongoose.Types.ObjectId(accountId) },
        { customers: { $size: 0 } }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách voucher thành công',
      data: vouchers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách voucher',
      error: error.message
    });
  }
}; 