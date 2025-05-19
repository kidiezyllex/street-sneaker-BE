import Notification from '../models/notification.model.js';
import Account from '../models/account.model.js';
import mongoose from 'mongoose';

/**
 * Tạo thông báo mới
 * @route POST /api/notifications
 * @access Private/Admin
 */
export const createNotification = async (req, res) => {
  try {
    const { type, title, content, recipients, relatedTo, relatedId } = req.body;

    if (!type || !title || !content || !relatedTo || !relatedId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: type, title, content, relatedTo, relatedId'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(relatedId)) {
      return res.status(400).json({
        success: false,
        message: 'relatedId không hợp lệ'
      });
    }

    const newNotification = new Notification({
      type,
      title,
      content,
      recipients: recipients || [],
      relatedTo,
      relatedId,
      status: 'PENDING'
    });

    await newNotification.save();

    return res.status(201).json({
      success: true,
      message: 'Tạo thông báo thành công',
      data: newNotification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thông báo',
      error: error.message
    });
  }
};

/**
 * Lấy danh sách thông báo
 * @route GET /api/notifications
 * @access Private/Admin
 */
export const getNotifications = async (req, res) => {
  try {
    const { type, status, relatedTo, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (relatedTo) {
      filter.relatedTo = relatedTo;
    }
    
    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .populate('recipients', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách thông báo thành công',
      data: {
        notifications,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách thông báo',
      error: error.message
    });
  }
};

/**
 * Lấy chi tiết thông báo
 * @route GET /api/notifications/:id
 * @access Private/Admin
 */
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    
    const notification = await Notification.findById(id)
      .populate('recipients', 'fullName email');
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin thông báo thành công',
      data: notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin thông báo',
      error: error.message
    });
  }
};

/**
 * Cập nhật thông báo
 * @route PUT /api/notifications/:id
 * @access Private/Admin
 */
export const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, recipients, status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    if (title) notification.title = title;
    if (content) notification.content = content;
    if (recipients) notification.recipients = recipients;
    if (status) notification.status = status;
    
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông báo thành công',
      data: notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông báo',
      error: error.message
    });
  }
};

/**
 * Xóa thông báo
 * @route DELETE /api/notifications/:id
 * @access Private/Admin
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    
    const notification = await Notification.findByIdAndDelete(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Xóa thông báo thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa thông báo',
      error: error.message
    });
  }
};

/**
 * Gửi thông báo
 * @route POST /api/notifications/:id/send
 * @access Private/Admin
 */
export const sendNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    
    const notification = await Notification.findById(id)
      .populate('recipients', 'email');
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
    
    notification.status = 'SENT';
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'Gửi thông báo thành công',
      data: notification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi gửi thông báo',
      error: error.message
    });
  }
};

/**
 * Lấy thông báo của người dùng
 * @route GET /api/notifications/user
 * @access Private
 */
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.account._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const total = await Notification.countDocuments({ 
      recipients: userId,
      status: 'SENT'
    });
    
    const notifications = await Notification.find({ 
      recipients: userId,
      status: 'SENT'
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách thông báo thành công',
      data: {
        notifications,
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
      message: 'Đã xảy ra lỗi khi lấy thông báo',
      error: error.message
    });
  }
};

/**
 * Gửi thông báo đến tất cả khách hàng
 * @route POST /api/notifications/send-all
 * @access Private/Admin
 */
export const sendNotificationToAllCustomers = async (req, res) => {
  try {
    const { title, content, type, relatedTo, relatedId } = req.body;
    
    if (!type || !title || !content || !relatedTo || !relatedId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: type, title, content, relatedTo, relatedId'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(relatedId)) {
      return res.status(400).json({
        success: false,
        message: 'relatedId không hợp lệ'
      });
    }
    
    const customers = await Account.find({ role: 'CUSTOMER' }).select('_id');
    const customerIds = customers.map(customer => customer._id);
    
    const newNotification = new Notification({
      type,
      title,
      content,
      recipients: customerIds,
      relatedTo,
      relatedId,
      status: 'PENDING'
    });
    
    await newNotification.save();
    
    return res.status(201).json({
      success: true,
      message: 'Tạo thông báo cho tất cả khách hàng thành công',
      data: newNotification
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo thông báo',
      error: error.message
    });
  }
}; 