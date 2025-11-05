import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "../build/routes/index.js";
import authRoutes from "../build/routes/auth/authRoutes.js";
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

dotenv.config();
await connectDB();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:4200",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("", authRoutes);
app.use("/api", routes);

export default app;

