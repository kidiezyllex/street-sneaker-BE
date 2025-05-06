/**
 * Middleware kiểm tra quyền admin
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const authorizeAdmin = (req, res, next) => {
  try {
    // Kiểm tra xem người dùng đã được xác thực chưa
    if (!req.account) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện hành động này',
        data: null,
      });
    }

    // Kiểm tra xem người dùng có quyền admin không
    if (req.account.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này',
        data: null,
      });
    }

    // Nếu có quyền admin, cho phép tiếp tục
    next();
  } catch (error) {
    console.error('Lỗi xác thực quyền admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xác thực quyền',
      data: null,
    });
  }
};

/**
 * Middleware kiểm tra quyền nhân viên hoặc admin
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
export const authorizeStaffOrAdmin = (req, res, next) => {
  try {
    // Kiểm tra xem người dùng đã được xác thực chưa
    if (!req.account) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để thực hiện hành động này',
        data: null,
      });
    }

    // Kiểm tra xem người dùng có quyền nhân viên hoặc admin không
    if (req.account.role !== 'ADMIN' && req.account.role !== 'STAFF') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ nhân viên hoặc admin mới có quyền thực hiện hành động này',
        data: null,
      });
    }

    // Nếu có quyền nhân viên hoặc admin, cho phép tiếp tục
    next();
  } catch (error) {
    console.error('Lỗi xác thực quyền nhân viên/admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi xác thực quyền',
      data: null,
    });
  }
}; 