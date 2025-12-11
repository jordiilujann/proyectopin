import { Router } from "express";
import spotifyRoutes from "./spotify/spotifyRoutes.js";
import reviewRoutes from "./reviews/reviewRoutes.js";
import userRoutes from "./users/userRoutes.js";
import commentRoutes from "./comments/commentRoutes.js";
import * as authController from "../controllers/auth/authController.js";
import followRoutes from "./follows/followRoutes.js";
import notificationRoutes from "./notifications/notificationRoutes.js";


const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));
router.get("/me", authController.getProfile);
router.use("/spotify", spotifyRoutes);
router.use("/reviews", reviewRoutes);
router.use("/users", userRoutes);
router.use("/comments", commentRoutes);
router.use("/follows", followRoutes);
router.use("/notifications", notificationRoutes);

export default router;

