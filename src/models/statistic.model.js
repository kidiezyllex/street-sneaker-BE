import mongoose from 'mongoose';

const statisticSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
    required: true
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  productsSold: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: Number,
    revenue: Number
  }],
  vouchersUsed: [{
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher'
    },
    usageCount: Number,
    totalDiscount: Number
  }],
  customerCount: {
    new: Number,
    total: Number
  }
}, {
  timestamps: true
});

const Statistic = mongoose.model('Statistic', statisticSchema);

export default Statistic;