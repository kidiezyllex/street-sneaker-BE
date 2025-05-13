import Voucher from '../models/voucher.model.js';
import Account from '../models/account.model.js';
import Notification from '../models/notification.model.js';
import mongoose from 'mongoose';

/**
 * Tạo phiếu giảm giá mới
 * @route POST /api/vouchers
 * @access Private/Admin
 */
export const createVoucher = async (req, res) => {
  try {
    const { code, name, type, value, quantity, startDate, endDate, minOrderValue, maxDiscount, status } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!code || !name || !type || value === undefined || quantity === undefined || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: code, name, type, value, quantity, startDate, endDate'
      });
    }

    // Kiểm tra mã voucher đã tồn tại chưa
    const existingVoucher = await Voucher.findOne({ code });
    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: 'Mã voucher đã tồn tại'
      });
    }

    // Kiểm tra giá trị value hợp lệ
    if (type === 'PERCENTAGE' && (value <= 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị phần trăm phải từ 1 đến 100'
      });
    }

    if (type === 'FIXED_AMOUNT' && value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá trị cố định phải lớn hơn 0'
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

    // Tạo voucher mới
    const newVoucher = new Voucher({
      code,
      name,
      type,
      value,
      quantity,
      startDate,
      endDate,
      minOrderValue: minOrderValue || 0,
      maxDiscount,
      status: status || 'HOAT_DONG'
    });

    await newVoucher.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo phiếu giảm giá thành công',
      data: newVoucher
    });
  } catch (error) {
    console.error('Lỗi khi tạo phiếu giảm giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo phiếu giảm giá',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách phiếu giảm giá
 * @route GET /api/vouchers
 * @access Private/Admin
 */
export const getVouchers = async (req, res) => {
  try {
    const { code, name, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Xây dựng query filter
    const filter = {};
    
    if (code) {
      filter.code = { $regex: code, $options: 'i' };
    }
    
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    
    if (status) {
      filter.status = status;
    }
    
    // Lọc theo thời gian
    if (startDate || endDate) {
      filter.startDate = {};
      
      if (startDate) {
        filter.startDate.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filter.endDate = filter.endDate || {};
        filter.endDate.$lte = new Date(endDate);
      }
    }
    
    // Thực hiện query với phân trang
    const total = await Voucher.countDocuments(filter);
    const vouchers = await Voucher.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Trả về kết quả
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách phiếu giảm giá thành công',
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
    console.error('Lỗi khi lấy danh sách phiếu giảm giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách phiếu giảm giá',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết phiếu giảm giá
 * @route GET /api/vouchers/:id
 * @access Private/Admin
 */
export const getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu giảm giá không hợp lệ'
      });
    }
    
    const voucher = await Voucher.findById(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin phiếu giảm giá thành công',
      data: voucher
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết phiếu giảm giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin phiếu giảm giá',
      error: error.message
    });
  }
};

/**
 * Cập nhật phiếu giảm giá
 * @route PUT /api/vouchers/:id
 * @access Private/Admin
 */
export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, startDate, endDate, minOrderValue, maxDiscount, status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu giảm giá không hợp lệ'
      });
    }
    
    // Tìm voucher cần cập nhật
    const voucher = await Voucher.findById(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
    // Cập nhật thông tin
    if (name) voucher.name = name;
    if (quantity !== undefined) voucher.quantity = quantity;
    if (startDate) voucher.startDate = startDate;
    if (endDate) voucher.endDate = endDate;
    if (minOrderValue !== undefined) voucher.minOrderValue = minOrderValue;
    if (maxDiscount !== undefined) voucher.maxDiscount = maxDiscount;
    if (status) voucher.status = status;
    
    await voucher.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật phiếu giảm giá thành công',
      data: voucher
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật phiếu giảm giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật phiếu giảm giá',
      error: error.message
    });
  }
};

/**
 * Xóa phiếu giảm giá
 * @route DELETE /api/vouchers/:id
 * @access Private/Admin
 */
export const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu giảm giá không hợp lệ'
      });
    }
    
    const voucher = await Voucher.findByIdAndDelete(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Xóa phiếu giảm giá thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa phiếu giảm giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa phiếu giảm giá',
      error: error.message
    });
  }
};

/**
 * Kiểm tra mã voucher hợp lệ
 * @route POST /api/vouchers/validate
 * @access Private
 */
export const validateVoucher = async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã voucher'
      });
    }
    
    const voucher = await Voucher.findOne({ code });
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Mã voucher không tồn tại'
      });
    }
    
    // Kiểm tra trạng thái
    if (voucher.status === 'KHONG_HOAT_DONG') {
      return res.status(400).json({
        success: false,
        message: 'Mã voucher đã hết hạn hoặc không còn hiệu lực'
      });
    }
    
    // Kiểm tra số lượng
    if (voucher.usedCount >= voucher.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Mã voucher đã hết lượt sử dụng'
      });
    }
    
    // Kiểm tra thời gian
    const currentDate = new Date();
    if (currentDate < voucher.startDate || currentDate > voucher.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Mã voucher chưa đến thời gian sử dụng hoặc đã hết hạn'
      });
    }
    
    // Kiểm tra giá trị đơn hàng tối thiểu
    if (orderValue && orderValue < voucher.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Giá trị đơn hàng phải từ ${voucher.minOrderValue.toLocaleString('vi-VN')}đ trở lên để sử dụng voucher này`
      });
    }
    
    // Tính toán giá trị giảm giá
    let discountValue = 0;
    if (voucher.type === 'PERCENTAGE') {
      discountValue = (orderValue * voucher.value) / 100;
      
      // Áp dụng giới hạn giảm giá nếu có
      if (voucher.maxDiscount && discountValue > voucher.maxDiscount) {
        discountValue = voucher.maxDiscount;
      }
    } else {
      discountValue = voucher.value;
    }
    
    return res.status(200).json({
      success: true,
      message: 'Mã voucher hợp lệ',
      data: {
        voucher,
        discountValue
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra mã voucher:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi kiểm tra mã voucher',
      error: error.message
    });
  }
};

/**
 * Tăng số lượt sử dụng voucher
 * @route PUT /api/vouchers/:id/increment-usage
 * @access Private/Admin
 */
export const incrementVoucherUsage = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu giảm giá không hợp lệ'
      });
    }
    
    const voucher = await Voucher.findById(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
    // Cập nhật số lượng sử dụng
    voucher.usedCount += 1;
    
    // Nếu đã sử dụng hết, cập nhật trạng thái
    if (voucher.usedCount >= voucher.quantity) {
      voucher.status = 'KHONG_HOAT_DONG';
    }
    
    await voucher.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật lượt sử dụng voucher thành công',
      data: voucher
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật lượt sử dụng voucher:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật lượt sử dụng voucher',
      error: error.message
    });
  }
};

/**
 * Gửi thông báo về voucher mới đến tất cả khách hàng
 * @route POST /api/vouchers/:id/notify
 * @access Private/Admin
 */
export const notifyVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phiếu giảm giá không hợp lệ'
      });
    }
    
    const voucher = await Voucher.findById(id);
    
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiếu giảm giá'
      });
    }
    
    // Lấy tất cả khách hàng
    const customers = await Account.find({ role: 'CUSTOMER' }).select('_id');
    const customerIds = customers.map(customer => customer._id);
    
    // Chuẩn bị nội dung thông báo
    const title = `Mã giảm giá mới: ${voucher.name}`;
    const content = `Sử dụng mã ${voucher.code} để được giảm ${
      voucher.type === 'PERCENTAGE' ? `${voucher.value}%` : `${voucher.value.toLocaleString('vi-VN')}đ`
    } cho đơn hàng từ ${voucher.minOrderValue.toLocaleString('vi-VN')}đ. Hiệu lực từ ${
      new Date(voucher.startDate).toLocaleDateString('vi-VN')
    } đến ${new Date(voucher.endDate).toLocaleDateString('vi-VN')}.`;
    
    // Tạo thông báo
    const notification = new Notification({
      type: 'SYSTEM',
      title,
      content,
      recipients: customerIds,
      relatedTo: 'VOUCHER',
      relatedId: voucher._id,
      status: 'PENDING'
    });
    
    await notification.save();
    
    // Cập nhật trạng thái thông báo thành đã gửi
    notification.status = 'SENT';
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'Gửi thông báo về voucher thành công',
      data: notification
    });
  } catch (error) {
    console.error('Lỗi khi gửi thông báo về voucher:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi gửi thông báo về voucher',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách phiếu giảm giá có sẵn cho người dùng
 * @route GET /api/vouchers/user/:userId
 * @access Private
 */
export const getAvailableVouchersForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const currentDate = new Date();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    const userNotifications = await Notification.find({
      recipients: userId,
      relatedTo: 'VOUCHER',
      status: 'SENT'
    }).select('relatedId');

    const notifiedVoucherIds = userNotifications.map(notification => notification.relatedId);

    if (notifiedVoucherIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Không có phiếu giảm giá nào có sẵn cho người dùng này',
        data: {
          vouchers: [],
          pagination: {
            totalItems: 0,
            totalPages: 0,
            currentPage: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });
    }

    // Filter for vouchers that the user was notified about and are currently available
    const filter = {
      _id: { $in: notifiedVoucherIds },
      status: 'HOAT_DONG',
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
      $expr: { $gt: ["$quantity", "$usedCount"] } // quantity > usedCount
    };

    const total = await Voucher.countDocuments(filter);
    const vouchers = await Voucher.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách phiếu giảm giá có sẵn thành công',
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
    console.error('Lỗi khi lấy danh sách phiếu giảm giá cho người dùng:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách phiếu giảm giá cho người dùng',
      error: error.message
    });
  }
};