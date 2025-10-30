import { Router } from "express";
import spotifyRoutes from "./spotifyRoutes.js";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));
router.use("/spotify", spotifyRoutes);

export default router;

