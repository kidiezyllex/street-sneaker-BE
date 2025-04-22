import mongoose from 'mongoose';

// Tạo các schema cho các thuộc tính nhỏ
const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  }
}, { _id: true });

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  }
}, { _id: true });

const colorSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  }
}, { _id: true });

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  }
}, { _id: true });

const sizeSchema = new mongoose.Schema({
  size: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  }
}, { _id: true });

const soleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  }
}, { _id: true });

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  defaultImage: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  }
}, { _id: true });

// Schema chính cho sản phẩm
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  },
  variants: [{
    code: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
    },
    amount: {
      type: Number,
      default: 0,
    },
    quantityReturn: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
      default: 'HOAT_DONG'
    },
    brand: brandSchema,
    sole: soleSchema,
    material: materialSchema,
    category: categorySchema,
    size: sizeSchema,
    color: colorSchema,
    images: [imageSchema],
    promotions: [{
      promotionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion'
      },
      pricePromotion: {
        type: Number,
      }
    }]
  }]
}, {
  timestamps: true
});

// Generate code for product variant
productSchema.pre('save', function(next) {
  if (this.isNew) {
    // Generate codes for new variants
    this.variants.forEach((variant, index) => {
      if (!variant.code) {
        const productPrefix = this.name.substring(0, 2).toUpperCase();
        variant.code = `${productPrefix}${new Date().getFullYear().toString().substring(2)}-${(index + 1).toString().padStart(4, '0')}`;
      }
    });
  } else if (this.isModified('variants')) {
    // Handle added variants
    this.variants.forEach((variant, index) => {
      if (!variant.code) {
        const productPrefix = this.name.substring(0, 2).toUpperCase();
        variant.code = `${productPrefix}${new Date().getFullYear().toString().substring(2)}-${(this.variants.length + index).toString().padStart(4, '0')}`;
      }
    });
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

// Tạo models cho các schema nhỏ để reference
const Brand = mongoose.model('Brand', brandSchema);
const Category = mongoose.model('Category', categorySchema);
const Color = mongoose.model('Color', colorSchema);
const Material = mongoose.model('Material', materialSchema);
const Size = mongoose.model('Size', sizeSchema);
const Sole = mongoose.model('Sole', soleSchema);

export default Product;
export { Brand, Category, Color, Material, Size, Sole }; 