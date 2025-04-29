import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  usedCount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  minOrderValue: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number
  },
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  }
}, {
  timestamps: true
});

const Voucher = mongoose.model('Voucher', voucherSchema);

export default Voucher;