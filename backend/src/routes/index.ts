import { Router } from "express";
import spotifyRoutes from "./spotify/spotifyRoutes.js";
import * as authController from "../controllers/auth/authController.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));
router.get("/me", authController.getProfile);
router.use("/spotify", spotifyRoutes);

export default router;

