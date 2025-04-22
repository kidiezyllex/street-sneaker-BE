import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { registerRoutes } from './routes.js';

// Load environment variables
dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

registerRoutes(app);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Error handling middleware, etc.
export default app;