import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const accountSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  birthday: {
    type: Date,
  },
  gender: {
    type: Boolean,
  },
  avatar: {
    type: String,
  },
  role: {
    type: String,
    enum: ['CUSTOMER', 'STAFF', 'ADMIN'],
    default: 'CUSTOMER',
  },
  citizenId: {
    type: String,
  },
  addresses: [{
    name: String,
    phoneNumber: String,
    provinceId: String,
    districtId: String,
    wardId: String,
    specificAddress: String,
    type: Boolean,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  }
}, {
  timestamps: true
});

// Hash password trước khi lưu
accountSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Tạo code tự động
accountSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.code) {
      const count = await mongoose.models.Account.countDocuments();
      const prefix = this.role === 'CUSTOMER' ? 'CUS' : this.role === 'STAFF' ? 'STF' : 'ADM';
      const year = new Date().getFullYear().toString().slice(-2);
      this.code = `${prefix}${(count + 1).toString().padStart(4, '0')}${year}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Account = mongoose.model('Account', accountSchema);

export default Account; 