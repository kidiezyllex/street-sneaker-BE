import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
export const mongoURI = "mongodb+srv://kidiezyllex:kidiezyllex.1111@cluster0.dm3rgls.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
export const jwtSecret = "kidiezyllex.1111";
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h";
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error(`Error disconnecting from MongoDB: ${error.message}`);
  }
};

mongoose.set('strictQuery', true);

export default mongoose; 