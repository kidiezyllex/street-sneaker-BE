import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Account from '../models/account.model.js';

/**
 * Đăng nhập
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm tài khoản bằng email
    const account = await Account.findOne({ email });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại'
      });
    }

    // Kiểm tra trạng thái tài khoản
    if (account.status === 'KHONG_HOAT_DONG') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác'
      });
    }

    // Tạo token
    const token = jwt.sign(
      { id: account._id, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        account: {
          _id: account._id,
          code: account.code,
          fullName: account.fullName,
          email: account.email,
          phoneNumber: account.phoneNumber,
          role: account.role,
          avatar: account.avatar
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng nhập',
      error: error.message
    });
  }
};

/**
 * Đăng ký
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;

    // Xây dựng điều kiện truy vấn linh hoạt
    const queryConditions = [{ email: email.trim() }];
    if (phoneNumber && phoneNumber.trim()) {
      queryConditions.push({ phoneNumber: phoneNumber.trim() });
    }

    // Kiểm tra xem email hoặc số điện thoại đã tồn tại chưa
    const existingAccount = await Account.findOne({ $or: queryConditions });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc số điện thoại đã được sử dụng'
      });
    }

    // Tạo tài khoản mới
    const accountData = {
      fullName,
      email,
      password,
      role: 'CUSTOMER', // Mặc định là khách hàng khi đăng ký
      addresses: []
    };
    if (phoneNumber) {
      accountData.phoneNumber = phoneNumber;
    }
    const newAccount = new Account(accountData);

    await newAccount.save();

    // Tạo token
    const token = jwt.sign(
      { id: newAccount._id, role: newAccount.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: {
        token,
        account: {
          _id: newAccount._id,
          code: newAccount.code,
          fullName: newAccount.fullName,
          email: newAccount.email,
          phoneNumber: newAccount.phoneNumber,
          role: newAccount.role
        }
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký tài khoản',
      error: error.message
    });
  }
};

/**
 * Lấy thông tin tài khoản hiện tại
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.account.id).select('-password');
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin tài khoản thành công',
      data: account
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin tài khoản',
      error: error.message
    });
  }
};

/**
 * Thay đổi mật khẩu
 * @route PUT /api/auth/change-password
 * @access Private
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const account = await Account.findById(req.account.id);

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(currentPassword, account.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác'
      });
    }

    // Cập nhật mật khẩu mới
    account.password = newPassword;
    await account.save();

    return res.status(200).json({
      success: true,
      message: 'Thay đổi mật khẩu thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thay đổi mật khẩu',
      error: error.message
    });
  }
};

/**
 * Cập nhật thông tin tài khoản
 * @route PUT /api/auth/update-profile
 * @access Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, birthday, gender, avatar } = req.body;
    const account = await Account.findById(req.account.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    // Cập nhật thông tin
    if (fullName) account.fullName = fullName;
    if (phoneNumber) account.phoneNumber = phoneNumber;
    if (birthday) account.birthday = birthday;
    if (gender !== undefined) account.gender = gender;
    if (avatar) account.avatar = avatar;

    await account.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin tài khoản thành công',
      data: account
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông tin tài khoản',
      error: error.message
    });
  }
};

/**
 * Thêm địa chỉ mới
 * @route POST /api/auth/address
 * @access Private
 */
export const addAddress = async (req, res) => {
  try {
    const { name, phoneNumber, provinceId, districtId, wardId, specificAddress, type, isDefault } = req.body;
    const account = await Account.findById(req.account.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    // Tạo địa chỉ mới
    const newAddress = {
      name,
      phoneNumber,
      provinceId,
      districtId,
      wardId,
      specificAddress,
      type: type || false,
      isDefault: isDefault || false
    };

    // Nếu đặt địa chỉ mới là mặc định, hủy các địa chỉ mặc định khác
    if (newAddress.isDefault) {
      account.addresses.forEach(address => {
        address.isDefault = false;
      });
    }

    account.addresses.push(newAddress);
    await account.save();

    return res.status(201).json({
      success: true,
      message: 'Thêm địa chỉ mới thành công',
      data: account.addresses
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm địa chỉ mới',
      error: error.message
    });
  }
};

/**
 * Cập nhật địa chỉ
 * @route PUT /api/auth/address/:addressId
 * @access Private
 */
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { name, phoneNumber, provinceId, districtId, wardId, specificAddress, type, isDefault } = req.body;
    const account = await Account.findById(req.account.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    // Tìm địa chỉ cần cập nhật
    const addressIndex = account.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    // Cập nhật thông tin địa chỉ
    if (name) account.addresses[addressIndex].name = name;
    if (phoneNumber) account.addresses[addressIndex].phoneNumber = phoneNumber;
    if (provinceId) account.addresses[addressIndex].provinceId = provinceId;
    if (districtId) account.addresses[addressIndex].districtId = districtId;
    if (wardId) account.addresses[addressIndex].wardId = wardId;
    if (specificAddress) account.addresses[addressIndex].specificAddress = specificAddress;
    if (type !== undefined) account.addresses[addressIndex].type = type;
    
    // Nếu đặt địa chỉ này là mặc định, hủy các địa chỉ mặc định khác
    if (isDefault) {
      account.addresses.forEach((address, index) => {
        if (index !== addressIndex) {
          address.isDefault = false;
        }
      });
      account.addresses[addressIndex].isDefault = true;
    }

    await account.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật địa chỉ thành công',
      data: account.addresses
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật địa chỉ',
      error: error.message
    });
  }
};

/**
 * Xóa địa chỉ
 * @route DELETE /api/auth/address/:addressId
 * @access Private
 */
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const account = await Account.findById(req.account.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    // Tìm địa chỉ cần xóa
    const addressIndex = account.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    // Xóa địa chỉ
    account.addresses.splice(addressIndex, 1);
    await account.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa địa chỉ thành công',
      data: account.addresses
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa địa chỉ',
      error: error.message
    });
  }
};

/**
 * Đặt địa chỉ làm mặc định
 * @route PUT /api/auth/address/:addressId/default
 * @access Private
 */
export const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const account = await Account.findById(req.account.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }

    // Tìm địa chỉ cần đặt làm mặc định
    const addressIndex = account.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }

    // Hủy địa chỉ mặc định hiện tại
    account.addresses.forEach((address, index) => {
      if (index !== addressIndex) {
        address.isDefault = false;
      }
    });

    // Đặt địa chỉ mới làm mặc định
    account.addresses[addressIndex].isDefault = true;
    await account.save();

    return res.status(200).json({
      success: true,
      message: 'Đặt địa chỉ mặc định thành công',
      data: account.addresses
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đặt địa chỉ mặc định',
      error: error.message
    });
  }
}; 