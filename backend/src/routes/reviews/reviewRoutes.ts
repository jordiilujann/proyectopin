import { Router } from "express";
import * as reviewController from "../../controllers/reviews/reviewController.js";
import { getCurrentUserFromSpotify } from "../../middlewares/spotifyAuthMiddleware.js";

const router = Router();

// Rutas básicas CRUD
router.post("/", getCurrentUserFromSpotify, reviewController.createReview);
router.get("/", reviewController.getReviews);
router.get("/:id", reviewController.getReviewById);
router.put("/:id", reviewController.updateReview);
router.delete("/:id", reviewController.deleteReview);

// Rutas adicionales
router.get("/user/:userId", reviewController.getReviewsByUser);
router.get("/spotify/:spotifyId", reviewController.getReviewsBySpotifyId);

export default router;

