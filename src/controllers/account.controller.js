
import User from '../models/user.model.js';
import { validateUser, validateAddress, validatePassword } from '../utils/validation.js';
import { hashPassword, comparePassword } from '../utils/auth.js';
import { scanIdCard } from '../utils/scanner.js';

// Lấy danh sách tất cả tài khoản
export const getAllAccounts = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Xây dựng query filter
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
    
    // Thực hiện query với phân trang
    const total = await Account.countDocuments(filter);
    const accounts = await Account.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Trả về kết quả
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

// Lấy thông tin chi tiết một tài khoản
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

// Tạo tài khoản mới (không cần đăng nhập)
export const createAccount = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, role, gender, birthday, citizenId } = req.body;
    
    // Kiểm tra email hoặc số điện thoại đã tồn tại
    const existingAccount = await Account.findOne({
      $or: [
        { email: email },
        { phoneNumber: phoneNumber }
      ]
    });
    
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Email hoặc số điện thoại đã được sử dụng'
      });
    }
    
    // Tạo tài khoản mới
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

// Tạo tài khoản nhân viên (chỉ dành cho admin)
export const createStaffAccount = async (req, res) => {
  try {
    const validatedData = validateUser(req.body);
    const hashedPassword = await hashPassword(validatedData.password);

    const user = new User({
      ...validatedData,
      password: hashedPassword,
      role: 'STAFF'
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật thông tin tài khoản
export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phoneNumber, gender, birthday, citizenId, avatar, status } = req.body;
    
    // Tìm tài khoản cần cập nhật
    const account = await Account.findById(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    // Kiểm tra email hoặc số điện thoại đã tồn tại
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
    
    // Cập nhật thông tin
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

// Cập nhật trạng thái tài khoản (kích hoạt/vô hiệu hóa)
export const updateAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Kiểm tra tham số đầu vào
    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái tài khoản là bắt buộc'
      });
    }
    
    // Tìm tài khoản cần cập nhật
    const account = await Account.findById(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    // Ngăn chặn việc vô hiệu hóa tài khoản admin chính
    if (account.role === 'ADMIN' && account.isMainAdmin && status === 'KHONG_HOAT_DONG') {
      return res.status(403).json({
        success: false,
        message: 'Không thể vô hiệu hóa tài khoản Admin chính'
      });
    }
    
    // Cập nhật trạng thái
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

// Xóa tài khoản
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm tài khoản cần xóa
    const account = await Account.findById(id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    
    // Ngăn chặn việc xóa tài khoản admin chính
    if (account.role === 'ADMIN' && account.isMainAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không thể xóa tài khoản Admin chính'
      });
    }
    
    // Xóa tài khoản
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

// Thêm địa chỉ mới cho tài khoản
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
    
    // Tạo địa chỉ mới
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
    
    // Nếu địa chỉ mới là mặc định, cập nhật tất cả địa chỉ khác không là mặc định
    if (newAddress.isDefault) {
      account.addresses.forEach(address => {
        address.isDefault = false;
      });
    }
    
    // Thêm địa chỉ mới vào danh sách
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

// Cập nhật địa chỉ
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
    
    // Xử lý trường hợp isDefault
    if (isDefault) {
      // Cập nhật tất cả địa chỉ khác không là mặc định
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

// Xóa địa chỉ
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
    
    // Tìm địa chỉ cần xóa
    const addressIndex = account.addresses.findIndex(addr => addr._id.toString() === addressId);
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ'
      });
    }
    
    // Xóa địa chỉ
    const isDefault = account.addresses[addressIndex].isDefault;
    account.addresses.splice(addressIndex, 1);
    
    // Nếu địa chỉ vừa xóa là mặc định và còn địa chỉ khác, cập nhật địa chỉ đầu tiên là mặc định
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

// Quản lý tài khoản nhân viên
exports.getStaffAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { role: 'STAFF' };
    if (status) query.status = status;

    const staff = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments(query);

    res.json({
      staff,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getStaffAccountById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'STAFF') {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản nhân viên' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateStaffAccount = async (req, res) => {
  try {
    const validatedData = validateUser(req.body);
    const user = await User.findById(req.params.id);
    
    if (!user || user.role !== 'STAFF') {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản nhân viên' });
    }

    if (validatedData.password) {
      validatedData.password = await hashPassword(validatedData.password);
    }

    Object.assign(user, validatedData);
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteStaffAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'STAFF') {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản nhân viên' });
    }

    await user.remove();
    res.json({ message: 'Đã xóa tài khoản nhân viên' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.scanStaffId = async (req, res) => {
  try {
    const { image } = req.files;
    const staffData = await scanIdCard(image.path);
    res.json(staffData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Quản lý tài khoản khách hàng
exports.getCustomerAccounts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { role: 'CUSTOMER' };
    if (status) query.status = status;

    const customers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCustomerAccountById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'CUSTOMER') {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản khách hàng' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCustomerAccount = async (req, res) => {
  try {
    const validatedData = validateUser(req.body);
    const user = await User.findById(req.params.id);
    
    if (!user || user.role !== 'CUSTOMER') {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản khách hàng' });
    }

    Object.assign(user, validatedData);
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addCustomerAddress = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'CUSTOMER') {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản khách hàng' });
    }

    const validatedData = validateAddress(req.body);
    user.addresses.push(validatedData);
    await user.save();

    res.json(user.addresses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCustomerAddress = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'CUSTOMER') {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản khách hàng' });
    }

    const address = user.addresses.id(req.params.addressId);
    if (!address) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    }

    const validatedData = validateAddress(req.body);
    Object.assign(address, validatedData);
    await user.save();

    res.json(user.addresses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCustomerAddress = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'CUSTOMER') {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản khách hàng' });
    }

    user.addresses.pull(req.params.addressId);
    await user.save();

    res.json(user.addresses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Quản lý hồ sơ cá nhân
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const validatedData = validateUser(req.body);
    const user = await User.findById(req.user._id);

    // Không cho phép thay đổi role qua API này
    delete validatedData.role;
    
    Object.assign(user, validatedData);
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = validatePassword(req.body);
    const user = await User.findById(req.user._id);

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    res.json({ message: 'Đã thay đổi mật khẩu thành công' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 