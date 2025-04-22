import mongoose from 'mongoose';

// Schema cho customer voucher
const customerVoucherSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  }
}, { timestamps: true });

// Main voucher schema
const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    unique: true,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  maximumValue: {
    type: Number
  },
  type: {
    type: String,
    enum: ['GIAM_GIA', 'QUA_TANG', 'GIAM_PHI_VAN_CHUYEN'],
    required: true
  },
  typeValue: {
    type: String,
    enum: ['TIEN_MAT', 'PHAN_TRAM'],
    required: true
  },
  minimumAmount: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['SU_DUNG', 'HET_HAN', 'BI_HUY', 'HET_SO_LUONG'],
    default: 'SU_DUNG'
  },
  customers: [customerVoucherSchema]
}, {
  timestamps: true
});

// Tạo mã voucher tự động
voucherSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.code) {
      const count = await mongoose.models.Voucher.countDocuments();
      const prefix = 'VC';
      const date = new Date();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      this.code = `${prefix}${month}${year}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Cập nhật trạng thái voucher tự động dựa vào thời gian
voucherSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.endDate < now) {
    this.status = 'HET_HAN';
  } else if (this.startDate > now) {
    this.status = 'CHUA_DIEN_RA';
  } else if (this.quantity <= 0) {
    this.status = 'HET_SO_LUONG';
  } else {
    this.status = 'SU_DUNG';
  }
  
  next();
});

const Voucher = mongoose.model('Voucher', voucherSchema);

export default Voucher; 