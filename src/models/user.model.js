import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  passwordChangedAt: {
    type: Date
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'employee'],
    default: 'employee'
  },
  avatar: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    default: ''
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  skills: [{
    type: String
  }],
  bio: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Tạo employeeId tự động trước khi lưu
userSchema.pre('save', async function(next) {
  try {
    // Nếu là document mới và không có employeeId, tạo employeeId mới
    if (this.isNew && !this.employeeId) {
      // Đếm số lượng user hiện tại để tạo employeeId tiếp theo
      const count = await mongoose.models.User.countDocuments();
      // Format: EMP + số thứ tự 4 chữ số + 2 chữ số cuối của năm hiện tại
      const year = new Date().getFullYear().toString().slice(-2);
      this.employeeId = `EMP${(count + 1).toString().padStart(4, '0')}${year}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Hash password trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Cập nhật thời gian thay đổi mật khẩu
    this.passwordChangedAt = Date.now() - 1000; // Trừ 1 giây để đảm bảo token được tạo sau khi mật khẩu thay đổi
    
    next();
  } catch (error) {
    next(error);
  }
});

// Phương thức kiểm tra mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Phương thức kiểm tra thời gian thay đổi mật khẩu
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

export default User;