import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { registerRoutes } from './routes.js';
import cors from 'cors';

dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000'
}));

registerRoutes(app);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;