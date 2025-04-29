import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { registerRoutes } from './routes.js';
import cors from 'cors';
import path from 'path';

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware để parse JSON
app.use(express.json());

// Cấu hình CORS cho phép nhiều origin
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'https://street-sneaker.vercel.app',
  'https://street-sneaker-fe.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // Cho phép requests không có origin (như mobile apps hoặc curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Cho phép gửi cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // Thời gian cache preflight request trong 24 giờ
}));

// Middleware xử lý static files
app.use(express.static('public')); // Thư mục chứa static files

// Middleware xử lý images
app.use('/_next/image', (req: any, res: any, next: any) => {
  const imageUrl = decodeURIComponent(req.query.url);
  if (imageUrl.startsWith('https://')) {
    res.redirect(imageUrl);
  } else {
    // Nếu là ảnh local, tìm trong thư mục public
    const localPath = path.join('public', imageUrl);
    res.sendFile(localPath);
  }
});

// Đăng ký routes (bao gồm cả Swagger UI)
registerRoutes(app);

// Lưu ý: Middleware xử lý lỗi và 404 đã được đăng ký trong registerRoutes
// nên không cần đăng ký thêm middleware ở đây

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;