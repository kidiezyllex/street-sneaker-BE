import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
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
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'Người dùng không tồn tại',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    // Gán thông tin người dùng vào request
    req.user = user;
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
    const currentUser = await User.findById(decoded.userId).select('-password');
    
    if (!currentUser) {
      return res.status(401).json({
        status: false,
        message: 'Người dùng của token này không còn tồn tại',
        data: null,
        errors: {},
        timestamp: new Date().toISOString()
      });
    }
    
    // Kiểm tra xem người dùng có thay đổi mật khẩu sau khi token được tạo không
    if (currentUser.passwordChangedAt) {
      const passwordChangedTimestamp = parseInt(
        currentUser.passwordChangedAt.getTime() / 1000,
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
    req.user = currentUser;
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
  if (req.user && req.user.role === 'admin') {
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
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, chỉ Admin mới có quyền'
    });
  }
};

/**
 * Middleware kiểm tra vai trò employee
 */
export const isEmployee = (req, res, next) => {
  if (req.user && req.user.role === 'employee') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, chỉ employee mới có quyền'
    });
  }
};

/**
 * Middleware dành cho nhân viên (staff)
 * Cho phép truy cập nếu người dùng là nhân viên hoặc admin
 * Đây là alias cho isAdminOrEmployee nhưng với tên thân thiện hơn
 */
export const staff = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'employee')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, chỉ nhân viên mới có quyền'
    });
  }
};

/**
 * Middleware kiểm tra vai trò admin hoặc employee
 */
export const isAdminOrEmployee = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'employee')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập, chỉ Admin hoặc employee mới có quyền'
    });
  }
};

/**
 * Middleware giới hạn truy cập dựa trên vai trò
 * @param  {...string} roles - Các vai trò được phép truy cập
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
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
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Nếu là coordinator, kiểm tra ngành
    if (req.user.role === 'coordinator') {
      const departmentId = req.params.departmentId || req.body.department;
      
      // Nếu không có departmentId, cho phép truy cập (sẽ được xử lý trong controller)
      if (!departmentId) {
        return next();
      }
      
      const userDepartment = req.user.department ? req.user.department.toString() : null;
      
      // Kiểm tra xem người dùng có thuộc ngành được truy cập không
      if (userDepartment !== departmentId) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập dữ liệu của ngành khác'
        });
      }
      
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