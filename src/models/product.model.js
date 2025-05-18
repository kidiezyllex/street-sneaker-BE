import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  variants: [{
    colorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Color',
      required: true
    },
    sizeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Size',
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    stock: {
      type: Number,
      default: 0
    },
    images: [{
      type: String
    }]
  }],
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  }
}, {
  timestamps: true
});

productSchema.index({ name: 1 }, { unique: false });

productSchema.pre('save', async function (next) {
  try {
    if (this.isNew && !this.code) {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'productId' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );

      this.code = `PRD${counter.sequence_value.toString().padStart(6, '0')}`;
    }
    next();
  } catch (error) {
    console.error('Lỗi khi tạo mã sản phẩm tự động:', error);
    next(error);
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;