import Account from '../models/account.model.js';
import { validatePassword } from '../utils/validation.js';
import { hashPassword, comparePassword } from '../utils/auth.js';
export const getAllAccounts = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = {};
    
    if (role) {
      filter.role = role;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    const total = await Account.countDocuments(filter);
    const accounts = await Account.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách tài khoản thành công',
      data: {
        accounts,
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
      message: 'Đã xảy ra lỗi khi lấy danh sách tài khoản',
      error: error.message
    });
  }
};

export const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const account = await Account.findById(id).select('-password');
    
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

export const createAccount = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, role, gender, birthday, citizenId } = req.body;
    
    const queryConditions = [];
    if (email && typeof email === 'string') {
      queryConditions.push({ email: email.trim() });
    }
    if (phoneNumber && typeof phoneNumber === 'string') {
      queryConditions.push({ phoneNumber: phoneNumber.trim() });
    }
    const existingAccount = await Account.findOne({
      $or: queryConditions
    });
    
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc số điện thoại đã được sử dụng'
      });
    }
    
    const newAccount = new Account({
      fullName,
      email,
      password,
      phoneNumber,
      role: role || 'CUSTOMER',
      gender,
      birthday,
      citizenId
    });
    
    await newAccount.save();
    
    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: {
        _id: newAccount._id,
        code: newAccount.code,
        fullName: newAccount.fullName,
        email: newAccount.email,
        phoneNumber: newAccount.phoneNumber,
        role: newAccount.role
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo tài khoản',
      error: error.message
    });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phoneNumber, gender, birthday, citizenId, avatar, status } = req.body;
    
    const account = await Account.findById(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    if (email && email !== account.email) {
      const existingEmailAccount = await Account.findOne({ email });
      if (existingEmailAccount) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }
    }
    
    if (phoneNumber && phoneNumber !== account.phoneNumber) {
      const existingPhoneAccount = await Account.findOne({ phoneNumber });
      if (existingPhoneAccount) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng'
        });
      }
    }
    
    if (fullName) account.fullName = fullName;
    if (email) account.email = email;
    if (phoneNumber) account.phoneNumber = phoneNumber;
    if (gender !== undefined) account.gender = gender;
    if (birthday) account.birthday = birthday;
    if (citizenId) account.citizenId = citizenId;
    if (avatar) account.avatar = avatar;
    if (status) account.status = status;
    
    await account.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật tài khoản thành công',
      data: {
        _id: account._id,
        code: account.code,
        fullName: account.fullName,
        email: account.email,
        phoneNumber: account.phoneNumber,
        role: account.role,
        status: account.status
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật tài khoản',
      error: error.message
    });
  }
};

export const updateAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái tài khoản là bắt buộc'
      });
    }
    
    const account = await Account.findById(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    if (account.role === 'ADMIN' && account.isMainAdmin && status === 'KHONG_HOAT_DONG') {
      return res.status(403).json({
        success: false,
        message: 'Không thể vô hiệu hóa tài khoản Admin chính'
      });
    }
    
    account.status = status;
    await account.save();
    
    return res.status(200).json({
      success: true,
      message: `Tài khoản đã được ${status === 'HOAT_DONG' ? 'kích hoạt' : 'vô hiệu hóa'} thành công`,
      data: {
        _id: account._id,
        status: account.status
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái tài khoản',
      error: error.message
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    
    const account = await Account.findById(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    if (account.role === 'ADMIN' && account.isMainAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không thể xóa tài khoản Admin chính'
      });
    }
    
    await Account.deleteOne({ _id: id });
    
    return res.status(200).json({
      success: true,
      message: 'Xóa tài khoản thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa tài khoản',
      error: error.message
    });
  }
};

export const addAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, provinceId, districtId, wardId, specificAddress, type, isDefault } = req.body;
    
    const account = await Account.findById(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    const newAddress = {
      name,
      phoneNumber,
      provinceId,
      districtId,
      wardId,
      specificAddress,
      type,
      isDefault: isDefault || false
    };
    
    if (newAddress.isDefault) {
      account.addresses.forEach(address => {
        address.isDefault = false;
      });
    }
    
    account.addresses.push(newAddress);
    
    await account.save();
    
    return res.status(201).json({
      success: true,
      message: 'Thêm địa chỉ thành công',
      data: account.addresses
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm địa chỉ',
      error: error.message
    });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;
    const { name, phoneNumber, provinceId, districtId, wardId, specificAddress, type, isDefault } = req.body;
    
    const account = await Account.findById(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    const addressIndex = account.addresses.findIndex(addr => addr._id.toString() === addressId);
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }
    
    if (name) account.addresses[addressIndex].name = name;
    if (phoneNumber) account.addresses[addressIndex].phoneNumber = phoneNumber;
    if (provinceId) account.addresses[addressIndex].provinceId = provinceId;
    if (districtId) account.addresses[addressIndex].districtId = districtId;
    if (wardId) account.addresses[addressIndex].wardId = wardId;
    if (specificAddress) account.addresses[addressIndex].specificAddress = specificAddress;
    if (type !== undefined) account.addresses[addressIndex].type = type;
    
    if (isDefault) {
      account.addresses.forEach((address, index) => {
        if (index !== addressIndex) {
          address.isDefault = false;
        } else {
          address.isDefault = true;
        }
      });
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

export const deleteAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;
    
    const account = await Account.findById(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    const addressIndex = account.addresses.findIndex(addr => addr._id.toString() === addressId);
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }
    
    const isDefault = account.addresses[addressIndex].isDefault;
    account.addresses.splice(addressIndex, 1);
    
    if (isDefault && account.addresses.length > 0) {
      account.addresses[0].isDefault = true;
    }
    
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

export const getProfile = async (req, res) => {
  try {
    const accountId = req.account._id || req.account.id;
    const account = await Account.findById(accountId).select('-password');
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin cá nhân thành công',
      data: account
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin cá nhân',
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, gender, birthday, avatar } = req.body;
    
    const account = await Account.findById(req.account._id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    if (fullName) account.fullName = fullName;
    if (phoneNumber && phoneNumber !== account.phoneNumber) {
      const existingPhoneAccount = await Account.findOne({ phoneNumber });
      if (existingPhoneAccount) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng'
        });
      }
      account.phoneNumber = phoneNumber;
    }
    if (gender !== undefined) account.gender = gender;
    if (birthday) account.birthday = birthday;
    if (avatar) account.avatar = avatar;
    
    await account.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công',
      data: {
        _id: account._id,
        fullName: account.fullName,
        email: account.email,
        phoneNumber: account.phoneNumber,
        role: account.role,
        gender: account.gender,
        birthday: account.birthday,
        avatar: account.avatar
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông tin cá nhân',
      error: error.message
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const passwordData = validatePassword(req.body);
    
    const account = await Account.findById(req.account._id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    const isMatch = await comparePassword(passwordData.currentPassword, account.password);
    
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác'
      });
    }
    const hashedPassword = await hashPassword(passwordData.newPassword);
    account.password = hashedPassword;
    await account.save();
    
    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đổi mật khẩu',
      error: error.message
    });
  }
};