import { Router } from "express";
import * as reviewController from "../../controllers/reviews/reviewController.js";
import { getCurrentUserFromSpotify } from "../../middlewares/spotifyAuthMiddleware.js";

const router = Router();

// Rutas básicas CRUD
router.post("/", getCurrentUserFromSpotify, reviewController.createReview);
router.get("/", reviewController.getReviews);

// Rutas adicionales (más específicas primero)
router.get("/user/:userId/likes", getCurrentUserFromSpotify, reviewController.getLikedReviews);
router.get("/user/:userId", reviewController.getReviewsByUser);
router.get("/spotify/:spotifyId", reviewController.getReviewsBySpotifyId);

// Rutas de likes (formato /like/:id para evitar conflictos con /:id)
router.post("/like/:id", getCurrentUserFromSpotify, reviewController.likeReview);
router.post("/unlike/:id", getCurrentUserFromSpotify, reviewController.unlikeReview);

// Rutas genéricas (al final)
router.get("/:id", reviewController.getReviewById);
router.put("/:id", reviewController.updateReview);
router.delete("/:id", reviewController.deleteReview);

export default router;

