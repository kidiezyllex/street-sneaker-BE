import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import statRoutes from './routes/stat.routes.js';
import { protect, admin } from './middlewares/auth.middleware.js';

// Load environment variables
dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Apply routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Error handling middleware, etc.
export default app;