import type { Express } from "express";
import { createServer, type Server } from "http";
import { connectDB } from "./config/database.js";
import { setupSwagger } from "./config/swagger.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { Request, Response } from "express";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import statRoutes from "./routes/stat.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import promotionRoutes from "./routes/promotion.routes.js";
import voucherRoutes from "./routes/voucher.routes.js";
import billRoutes from "./routes/bill.routes.js";
import accountRoutes from "./routes/account.routes.js";

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    // Connect to database
    await connectDB();
    
    // API routes
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api/stats", statRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/cart", cartRoutes);
    app.use("/api/promotions", promotionRoutes);
    app.use("/api/vouchers", voucherRoutes);
    app.use("/api/bills", billRoutes);
    app.use("/api/accounts", accountRoutes);
    
    // Set up Swagger documentation
    setupSwagger(app);
    
    // API health check endpoint
    app.get("/api/health", (req: Request, res: Response) => {
      res.status(200).json({ 
        status: "ok", 
        message: "API is running"
      });
    });
    
    // Error handling
    app.use(notFound);
    app.use(errorHandler);
    
    const httpServer = createServer(app);
    
    return httpServer;
  } catch (error) {
    console.error("Error registering routes:", error);
    throw error;
  }
} 