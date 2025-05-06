import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    trim: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variant: {
      colorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Color'
      },
      sizeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Size'
      }
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  voucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  },
  subTotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  shippingAddress: {
    name: String,
    phoneNumber: String,
    provinceId: String,
    districtId: String,
    wardId: String,
    specificAddress: String
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'BANK_TRANSFER', 'COD', 'MIXED'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PARTIAL_PAID', 'PAID'],
    default: 'PENDING'
  },
  orderStatus: {
    type: String,
    enum: ['CHO_XAC_NHAN', 'CHO_GIAO_HANG', 'DANG_VAN_CHUYEN', 'DA_GIAO_HANG', 'HOAN_THANH', 'DA_HUY'],
    default: 'CHO_XAC_NHAN'
  }
}, {
  timestamps: true
});

// Tạo code tự động
orderSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.code) {
      let code = null;
      try {
        const count = await mongoose.models.Order.countDocuments();
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        code = `DH${year}${month}${(count + 1).toString().padStart(4, '0')}`;
      } catch {
        // Nếu có lỗi khi đếm, sinh code random dự phòng
        code = `DH${Date.now()}${Math.floor(Math.random() * 10000)}`;
      }
      this.code = code;
    }
    // Nếu vì lý do nào đó vẫn chưa có code, sinh code random cuối cùng
    if (!this.code) {
      this.code = `DH${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }
    next();
  } catch {
    // Nếu có lỗi, vẫn cố gắng sinh code random để không bị null
    this.code = `DH${Date.now()}${Math.floor(Math.random() * 10000)}`;
    next();
  }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;