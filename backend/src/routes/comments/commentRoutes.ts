import { Router } from "express";
import * as commentController from "../../controllers/comments/commentController.js";

const router = Router();

// Rutas básicas CRUD
router.post("/", commentController.createComment);
router.get("/", commentController.getComments);
router.get("/:id", commentController.getCommentById);
router.put("/:id", commentController.updateComment);
router.delete("/:id", commentController.deleteComment);

// Rutas adicionales
router.get("/review/:reviewId", commentController.getCommentsByReview);
router.get("/user/:userId", commentController.getCommentsByUser);

export default router;

