import { Router } from "express";
import * as notificationController from "../../controllers/notifications/notificationController.js";
import { getCurrentUserFromSpotify } from "../../middlewares/spotifyAuthMiddleware.js";

const router = Router();

// IMPORTANTE: Las rutas más específicas deben ir ANTES que las generales

// Obtener conteo de notificaciones no leídas (más específica)
router.get(
  "/user/:userId/unread-count",
  getCurrentUserFromSpotify,
  notificationController.getUnreadCount
);

// Marcar todas las notificaciones como leídas (más específica)
router.patch(
  "/user/:userId/read-all",
  getCurrentUserFromSpotify,
  notificationController.markAllAsRead
);

// Obtener notificaciones de un usuario
router.get(
  "/user/:userId",
  getCurrentUserFromSpotify,
  notificationController.getUserNotifications
);

// Marcar una notificación como leída
router.patch(
  "/:id/read",
  getCurrentUserFromSpotify,
  notificationController.markAsRead
);

export default router;

