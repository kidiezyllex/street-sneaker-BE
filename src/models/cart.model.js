import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productDetail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product.variants',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  items: [cartItemSchema],
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  }
}, {
  timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart; 