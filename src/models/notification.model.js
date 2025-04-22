import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  idRedirect: {
    type: String
  },
  type: {
    type: String,
    enum: ['DON_HANG', 'KHUYEN_MAI', 'HE_THONG', 'KHAC'],
    required: true
  },
  status: {
    type: String,
    enum: ['HOAT_DONG', 'KHONG_HOAT_DONG'],
    default: 'HOAT_DONG'
  },
  image: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 