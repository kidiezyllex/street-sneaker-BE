import jwt from 'jsonwebtoken';
import Account from '../models/account.model.js';
import dotenv from 'dotenv';
import config from '../config/config.js';

dotenv.config();

/**
 * Middleware xác thực người dùng
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Lấy token từ Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Kiểm tra token tồn tại
    if (!token) {
      return res.status(401).json({
        status: false,
        message: 'Không có token, từ chối truy cập',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    // Xác thực token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Tìm người dùng từ token
    const account = await Account.findById(decoded.id).select('-password');
    
    if (!account) {
      return res.status(401).json({
        status: false,
        message: 'Tài khoản không tồn tại',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    // Gán thông tin người dùng vào request
    req.account = account;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: false,
        message: 'Token không hợp lệ',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: false,
        message: 'Token đã hết hạn',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    console.error('Lỗi xác thực:', error);
    res.status(500).json({
      status: false,
      message: 'Lỗi server',
      data: null,
      errors: { server: error.message },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware bảo vệ route - kiểm tra xác thực và gán thông tin người dùng vào request
 * Middleware này kiểm tra token, xác thực và gán thông tin người dùng như authenticate
 * nhưng cung cấp thêm kiểm tra quyền truy cập nâng cao
 */
export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Lấy token từ header hoặc cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Kiểm tra token tồn tại
    if (!token) {
      return res.status(401).json({
        status: false,
        message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    // Xác thực token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Tìm người dùng từ token với thông tin đầy đủ
    const currentAccount = await Account.findById(decoded.id).select('-password');
    
    if (!currentAccount) {
      return res.status(401).json({
        status: false,
        message: 'Tài khoản của token này không còn tồn tại',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    // Kiểm tra xem người dùng có thay đổi mật khẩu sau khi token được tạo không
    if (currentAccount.passwordChangedAt) {
      const passwordChangedTimestamp = parseInt(
        currentAccount.passwordChangedAt.getTime() / 1000,
        10
      );
      
      // Nếu mật khẩu thay đổi sau khi token được tạo
      if (decoded.iat < passwordChangedTimestamp) {
        return res.status(401).json({
          status: false, 
          message: 'Mật khẩu đã thay đổi gần đây! Vui lòng đăng nhập lại.',
          data: null,
          errors: {},
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Đánh dấu người dùng đã đăng nhập và gán thông tin vào request
    req.account = currentAccount;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: false,
        message: 'Token không hợp lệ. Vui lòng đăng nhập lại.',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: false,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    console.error('Lỗi xác thực:', error);
    res.status(500).json({
      status: false,
      message: 'Lỗi server trong quá trình xác thực',
      data: null,
      errors: { server: error.message },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware kiểm tra vai trò admin
 */
export const isAdmin = (req, res, next) => {
  if (req.account && req.account.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, chỉ Admin mới có quyền'
    });
  }
};

/**
 * Alias cho middleware isAdmin, để phù hợp với coding style trong routes
 */
export const admin = (req, res, next) => {
  if (req.account && req.account.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, chỉ Admin mới có quyền'
    });
  }
};

/**
 * Middleware giới hạn truy cập dựa trên vai trò
 * @param  {...string} roles - Các vai trò được phép truy cập
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.account.role)) {
      return res.status(403).json({
        status: false,
        message: 'Bạn không có quyền thực hiện hành động này',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

/**
 * Middleware kiểm tra coordinator chỉ truy cập dữ liệu thuộc ngành mình
 */
export const checkDepartmentAccess = async (req, res, next) => {
  try {
    // Nếu là admin, cho phép truy cập tất cả
    if (req.account.role === 'admin') {
      return next();
    }
    
    // Nếu vai trò khác, từ chối truy cập
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập'
    });
  } catch (error) {
    console.error('Lỗi kiểm tra quyền truy cập ngành:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
}; 