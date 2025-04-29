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

// Cấu hình CORS cho phép tất cả các origin
app.use(cors({
  origin: true, // Cho phép tất cả các origin
  credentials: true, // Cho phép gửi cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // Thời gian cache preflight request trong 24 giờ
}));
app.use(express.static('public')); // Thư mục chứa static files

app.use('/_next/image', (req: any, res: any, next: any) => {
  const imageUrl = decodeURIComponent(req.query.url);
  if (imageUrl.startsWith('https://')) {
    res.redirect(imageUrl);
  } else {
    const localPath = path.join('public', imageUrl);
    res.sendFile(localPath);
  }
});

registerRoutes(app);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;