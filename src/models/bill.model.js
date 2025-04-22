import mongoose from 'mongoose';

// Bill detail schema
const billDetailSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_VAN_CHUYEN', 
           'DA_GIAO', 'DA_NHAN', 'DA_HUY'],
    default: 'CHO_XAC_NHAN'
  },
  note: {
    type: String,
  },
  productDetail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product.variants'
  }
}, { timestamps: true });

// Bill history schema
const billHistorySchema = new mongoose.Schema({
  statusBill: {
    type: String,
    enum: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_VAN_CHUYEN', 
           'DA_GIAO', 'DA_THANH_TOAN', 'DA_HUY'],
    required: true
  },
  note: {
    type: String,
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
}, { timestamps: true });

// Transaction schema
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['THANH_TOAN', 'HOAN_TIEN'],
    required: true
  },
  totalMoney: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['TIEN_MAT', 'CHUYEN_KHOAN', 'THE', 'VI_DIEN_TU'],
    required: true
  },
  note: {
    type: String
  },
  transactionCode: {
    type: String
  },
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }
}, { timestamps: true });

// Main bill schema
const billSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  email: {
    type: String
  },
  totalMoney: {
    type: Number,
    required: true
  },
  moneyReduced: {
    type: Number,
    default: 0
  },
  moneyAfter: {
    type: Number,
    required: true
  },
  shipDate: {
    type: Date
  },
  receiveDate: {
    type: Date
  },
  moneyShip: {
    type: Number,
    default: 0
  },
  confirmationDate: {
    type: Date
  },
  type: {
    type: String,
    enum: ['ONLINE', 'OFFLINE'],
    required: true
  },
  note: {
    type: String
  },
  customerAmount: {
    type: Number
  },
  desiredReceiptDate: {
    type: Date
  },
  completeDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['CHO_XAC_NHAN', 'DA_XAC_NHAN', 'DANG_VAN_CHUYEN', 
           'DA_GIAO', 'DA_THANH_TOAN', 'DA_HUY'],
    default: 'CHO_XAC_NHAN'
  },
  receivingMethod: {
    type: Number,
    enum: [0, 1], // 0: tại quầy, 1: giao hàng
    default: 0
  },
  percentMoney: {
    type: Number
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  voucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  },
  billDetails: [billDetailSchema],
  billHistory: [billHistorySchema],
  transactions: [transactionSchema]
}, {
  timestamps: true
});

// Tạo mã đơn hàng tự động
billSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.code) {
      const count = await mongoose.models.Bill.countDocuments();
      const prefix = this.type === 'ONLINE' ? 'HD-ON' : 'HD-OFF';
      const date = new Date();
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      this.code = `${prefix}-${day}${month}${year}-${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Bill = mongoose.model('Bill', billSchema);

export default Bill; 