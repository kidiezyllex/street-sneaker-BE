import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    trim: true,
  },
  originalOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
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
    },
    reason: String
  }],
  totalRefund: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['CHO_XU_LY', 'DA_HOAN_TIEN', 'DA_HUY'],
    default: 'CHO_XU_LY'
  }
}, {
  timestamps: true
});

returnSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.code) {
      const count = await mongoose.models.Return.countDocuments();
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      this.code = `RT${year}${month}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Return = mongoose.model('Return', returnSchema);

export default Return;