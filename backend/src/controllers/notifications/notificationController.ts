import { Request, Response } from "express";
import * as notificationService from "../../services/notifications/notificationService.js";

interface SpotifyRequest extends Request {
  currentUser?: any;
  user?: any;
}

/**
 * GET /api/notifications/user/:userId
 * Obtiene todas las notificaciones de un usuario
 */
export async function getUserNotifications(req: SpotifyRequest, res: Response) {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      return res.status(400).json({ error: "userId es requerido" });
    }

    // Verificar que el usuario solo pueda ver sus propias notificaciones
    const currentUser = req.currentUser || req.user;
    if (!currentUser) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
    if (currentUser._id !== userId && currentUser.id !== userId) {
      return res.status(403).json({ error: "No tienes permiso para ver estas notificaciones" });
    }

    const notifications = await notificationService.getUserNotifications(userId, limit);
    res.status(200).json(notifications);
  } catch (error: any) {
    console.error("[notificationController.getUserNotifications]", error);
    res.status(500).json({ error: error.message || "Error al obtener notificaciones" });
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marca una notificación como leída
 */
export async function markAsRead(req: SpotifyRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.currentUser || req.user;

    if (!id) {
      return res.status(400).json({ error: "id es requerido" });
    }

    if (!currentUser) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Verificar que la notificación pertenece al usuario
    const userId = currentUser._id || currentUser.id;
    const notification = await notificationService.getUserNotifications(userId, 1000);
    const userNotification = notification.find((n: any) => n._id === id);

    if (!userNotification) {
      return res.status(404).json({ error: "Notificación no encontrada" });
    }

    const updated = await notificationService.markAsRead(id);
    res.status(200).json(updated);
  } catch (error: any) {
    console.error("[notificationController.markAsRead]", error);
    res.status(500).json({ error: error.message || "Error al marcar notificación como leída" });
  }
}

/**
 * PATCH /api/notifications/user/:userId/read-all
 * Marca todas las notificaciones de un usuario como leídas
 */
export async function markAllAsRead(req: SpotifyRequest, res: Response) {
  try {
    const { userId } = req.params;
    const currentUser = req.currentUser || req.user;

    if (!userId) {
      return res.status(400).json({ error: "userId es requerido" });
    }

    if (!currentUser) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Verificar que el usuario solo pueda marcar sus propias notificaciones
    if (currentUser._id !== userId && currentUser.id !== userId) {
      return res.status(403).json({ error: "No tienes permiso para esta acción" });
    }

    const result = await notificationService.markAllAsRead(userId);
    res.status(200).json({ 
      message: "Todas las notificaciones marcadas como leídas",
      modifiedCount: result.modifiedCount 
    });
  } catch (error: any) {
    console.error("[notificationController.markAllAsRead]", error);
    res.status(500).json({ error: error.message || "Error al marcar todas como leídas" });
  }
}

/**
 * GET /api/notifications/user/:userId/unread-count
 * Obtiene el conteo de notificaciones no leídas
 */
export async function getUnreadCount(req: SpotifyRequest, res: Response) {
  try {
    const { userId } = req.params;
    const currentUser = req.currentUser || req.user;

    if (!userId) {
      return res.status(400).json({ error: "userId es requerido" });
    }

    if (!currentUser) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Verificar que el usuario solo pueda ver su propio conteo
    if (currentUser._id !== userId && currentUser.id !== userId) {
      return res.status(403).json({ error: "No tienes permiso para ver este conteo" });
    }

    const count = await notificationService.getUnreadCount(userId);
    res.status(200).json({ count });
  } catch (error: any) {
    console.error("[notificationController.getUnreadCount]", error);
    res.status(500).json({ error: error.message || "Error al obtener conteo" });
  }
}

/**
 * DELETE /api/notifications/:id
 * Elimina una notificación
 */
export async function deleteNotification(req: SpotifyRequest, res: Response) {
  try {
    const { id } = req.params;
    const currentUser = req.currentUser || req.user;

    if (!id) {
      return res.status(400).json({ error: "id es requerido" });
    }

    if (!currentUser) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userId = currentUser._id || currentUser.id;
    const deleted = await notificationService.deleteNotification(id, userId);
    res.status(200).json({ message: "Notificación eliminada", notification: deleted });
  } catch (error: any) {
    console.error("[notificationController.deleteNotification]", error);
    if (error.message?.includes("No tienes permiso")) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message?.includes("no encontrada")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || "Error al eliminar notificación" });
  }
}

