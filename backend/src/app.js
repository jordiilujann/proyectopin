import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "../build/routes/index.js";
import authRoutes from "../build/routes/auth/authRoutes.js";
import { connectDB } from '../build/db/connection.js';

await connectDB();

const app = express();

app.use(cors({
  origin: ["http://localhost:4200", "http://127.0.0.1:4200"],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("", authRoutes);
app.use("/api", routes);

export default app;

