import { Router } from "express";
import * as userController from "../../controllers/users/userController.js";

const router = Router();

// Rutas básicas CRUD
router.post("/", userController.createUser);
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

// Rutas adicionales
router.get("/spotify/:spotifyId", userController.getUserBySpotifyId);

export default router;

