import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['TIEN_MAT', 'PHAN_TRAM'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
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
    enum: ['DANG_HOAT_DONG', 'NGUNG_HOAT_DONG', 'SAP_DIEN_RA', 'DA_KET_THUC'],
    default: 'SAP_DIEN_RA'
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

// Tạo mã khuyến mãi tự động
promotionSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.code) {
      const count = await mongoose.models.Promotion.countDocuments();
      const prefix = 'KM';
      const date = new Date();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      this.code = `${prefix}${month}${year}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Cập nhật trạng thái khuyến mãi tự động dựa vào thời gian
promotionSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.endDate < now) {
    this.status = 'DA_KET_THUC';
  } else if (this.startDate > now) {
    this.status = 'SAP_DIEN_RA';
  } else if (this.status !== 'NGUNG_HOAT_DONG') {
    this.status = 'DANG_HOAT_DONG';
  }
  
  next();
});

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion; 