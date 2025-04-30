import mongoose from 'mongoose';

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
    required: true // Weight in grams
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

// Tạo code tự động
productSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.code) {
      const count = await mongoose.models.Product.countDocuments();
      this.code = `PRD${(count + 1).toString().padStart(6, '0')}`;
    }
    next();
  } catch (error) {
    console.error('Lỗi khi tạo mã sản phẩm tự động:', error);
    next(error);
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;