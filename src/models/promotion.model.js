import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  discountPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
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
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  }
}, {
  timestamps: true
});

promotionSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.code) {
      const count = await mongoose.models.Promotion.countDocuments();
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      this.code = `KM${year}${month}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;