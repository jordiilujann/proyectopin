import { Router } from "express";
import * as followController from "../../controllers/follows/followController.js";
import { getCurrentUserFromSpotify } from "../../middlewares/spotifyAuthMiddleware.js";

const router = Router();

// Seguir a un usuario (el follower es el user logueado, sacado del token)
router.post(
  "/",
  getCurrentUserFromSpotify,
  followController.follow
);

// Dejar de seguir
router.delete(
  "/",
  getCurrentUserFromSpotify,
  followController.unfollow
);

// Listar seguidores de un usuario
router.get(
  "/followers/:userId",
  followController.getFollowers
);

// Listar a quién sigue un usuario
router.get(
  "/following/:userId",
  followController.getFollowing
);

// Contar seguidores
router.get(
  "/followers/:userId/count",
  followController.getFollowerCount
);

// Contar seguidos
router.get(
  "/following/:userId/count",
  followController.getFollowingCount
);

export default router;
    