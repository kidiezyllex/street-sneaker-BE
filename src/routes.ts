import type { Express } from "express";
import { createServer, type Server } from "http";
import { connectDB } from "./config/database.js";
import { setupSwagger } from "./config/swagger.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { Request, Response } from "express";
import { Router } from 'express';

// Import routes
import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import accountRoutes from './routes/account.routes.js';
import orderRoutes from './routes/order.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const router = Router();
export async function registerRoutes(app: Express): Promise<Server> {
  try {
    // Connect to database
    await connectDB();
    
    // API routes
    app.use("/api/auth", authRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/accounts", accountRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/payments", paymentRoutes);
    
    setupSwagger(app);
    app.get("/api/health", (req: Request, res: Response) => {
      res.status(200).json({ 
        status: "ok", 
        message: "API is running"
      });
    });
    
    app.use(notFound);
    app.use(errorHandler);
    
    const httpServer = createServer(app);
    
    return httpServer;
  } catch (error) {
    console.error("Error registering routes:", error);
    throw error;
  }
}

export default router; 