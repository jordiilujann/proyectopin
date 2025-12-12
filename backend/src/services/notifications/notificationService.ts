import Notification from "../../models/notification.js";
import User from "../../models/user.js";

/**
 * Crea una notificación
 */
export async function createNotification(notificationData: {
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'review';
  message: string;
  related_review_id?: string;
  related_user_id?: string;
}) {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error: any) {
    throw new Error(`Error al crear la notificación: ${error.message}`);
  }
}

/**
 * Obtiene todas las notificaciones de un usuario
 */
export async function getUserNotifications(userId: string, limit: number = 50) {
  try {
    const notifications = await Notification.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    // Enriquecer con información del usuario relacionado
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        if (notification.related_user_id) {
          try {
            const user = await User.findById(notification.related_user_id);
            if (user) {
              return {
                ...notification,
                related_user_name: user.name || 'Usuario'
              };
            }
          } catch (error) {
            console.error(`Error al obtener usuario ${notification.related_user_id}:`, error);
          }
        }
        return notification;
      })
    );

    return enrichedNotifications;
  } catch (error: any) {
    throw new Error(`Error al obtener notificaciones: ${error.message}`);
  }
}

/**
 * Marca una notificación como leída
 */
export async function markAsRead(notificationId: string) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    if (!notification) {
      throw new Error("Notificación no encontrada");
    }
    return notification;
  } catch (error: any) {
    throw new Error(`Error al marcar notificación como leída: ${error.message}`);
  }
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
export async function markAllAsRead(userId: string) {
  try {
    const result = await Notification.updateMany(
      { user_id: userId, read: false },
      { read: true }
    );
    return result;
  } catch (error: any) {
    throw new Error(`Error al marcar todas como leídas: ${error.message}`);
  }
}

/**
 * Obtiene el conteo de notificaciones no leídas
 */
export async function getUnreadCount(userId: string) {
  try {
    return await Notification.countDocuments({ user_id: userId, read: false });
  } catch (error: any) {
    throw new Error(`Error al obtener conteo de no leídas: ${error.message}`);
  }
}

/**
 * Elimina una notificación
 */
export async function deleteNotification(notificationId: string, userId: string) {
  try {
    // Verificar que la notificación pertenece al usuario antes de eliminar
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error("Notificación no encontrada");
    }
    if (notification.user_id !== userId) {
      throw new Error("No tienes permiso para eliminar esta notificación");
    }
    
    const deleted = await Notification.findByIdAndDelete(notificationId);
    if (!deleted) {
      throw new Error("Error al eliminar la notificación");
    }
    return deleted;
  } catch (error: any) {
    throw new Error(`Error al eliminar notificación: ${error.message}`);
  }
}

/**
 * Crea una notificación cuando alguien sigue a un usuario
 */
export async function notifyNewFollower(followerId: string, followingId: string) {
  try {
    // Obtener el nombre del seguidor
    const follower = await User.findById(followerId);
    const followerName = follower?.name || 'Alguien';

    return await createNotification({
      user_id: followingId, // El usuario que es seguido recibe la notificación
      type: 'follow',
      message: `${followerName} empezó a seguirte`,
      related_user_id: followerId,
    });
  } catch (error: any) {
    console.error('Error creando notificación de nuevo seguidor:', error);
    // No lanzamos error para no interrumpir el flujo de seguir
  }
}

/**
 * Crea notificaciones cuando un usuario crea una reseña
 * Notifica a todos sus seguidores
 */
export async function notifyFollowersNewReview(reviewId: string, userId: string, reviewTitle: string) {
  try {
    // Obtener todos los seguidores del usuario
    const { getFollowers } = await import('../follows/followService.js');
    const followers = await getFollowers(userId);

    if (followers.length === 0) {
      return; // No hay seguidores, no hay notificaciones que crear
    }

    // Obtener el nombre del usuario que creó la reseña
    const user = await User.findById(userId);
    const userName = user?.name || 'Un usuario';

    // Truncar el título si es muy largo
    const shortTitle = reviewTitle.length > 50 
      ? reviewTitle.substring(0, 47) + '...' 
      : reviewTitle;

    // Crear notificaciones para cada seguidor
    const notificationPromises = followers.map(follower =>
      createNotification({
        user_id: follower._id.toString(),
        type: 'review',
        message: `${userName} publicó una nueva reseña: "${shortTitle}"`,
        related_review_id: reviewId,
        related_user_id: userId,
      })
    );

    await Promise.all(notificationPromises);
  } catch (error: any) {
    console.error('Error creando notificaciones de nueva reseña:', error);
    // No lanzamos error para no interrumpir el flujo de crear reseña
  }
}

