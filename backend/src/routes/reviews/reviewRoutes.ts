import { Router } from "express";
import * as reviewController from "../../controllers/reviews/reviewController.js";
import { getCurrentUserFromSpotify } from "../../middlewares/spotifyAuthMiddleware.js";

const router = Router();

// Rutas básicas CRUD
router.post("/", getCurrentUserFromSpotify, reviewController.createReview);

// ⚠️ PONEMOS /me ANTES QUE /:id
router.get("/me", reviewController.getMyReviews);

router.get("/", reviewController.getReviews);
router.get("/user/:userId", reviewController.getReviewsByUser);
router.get("/spotify/:spotifyId", reviewController.getReviewsBySpotifyId);
router.get("/:id", reviewController.getReviewById);
router.put("/:id", reviewController.updateReview);
router.delete("/:id", reviewController.deleteReview);

export default router;
