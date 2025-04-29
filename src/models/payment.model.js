import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    trim: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['CASH', 'BANK_TRANSFER'],
    required: true
  },
  bankTransferInfo: {
    bankName: String,
    accountNumber: String,
    transactionCode: String,
    transferDate: Date
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  note: String
}, {
  timestamps: true
});

// Tạo code tự động
paymentSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.code) {
      const count = await mongoose.models.Payment.countDocuments();
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      this.code = `PAY${year}${month}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;