import { Router } from "express";
import * as authController from "../../controllers/auth/authController.js";

const router = Router();

router.get("/login", authController.login);
router.get("/callback", authController.callback);
router.post("/logout", authController.logout);

export default router;

