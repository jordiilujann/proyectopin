import mongoose from 'mongoose';
import BaseSchema from './base.js';

const NotificationSchema = new mongoose.Schema({
  ...BaseSchema.obj,

  // Usuario que recibe la notificación
  user_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true,
  },

  // Tipo de notificación
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'review'],
    required: true,
  },

  // Mensaje de la notificación
  message: {
    type: String,
    required: true,
    trim: true,
  },

  // Si la notificación ha sido leída
  read: {
    type: Boolean,
    default: false,
    index: true,
  },

  // ID de la reseña relacionada (si aplica)
  related_review_id: {
    type: String,
    ref: 'Review',
    default: null,
  },

  // ID del usuario relacionado (quien hizo la acción)
  related_user_id: {
    type: String,
    ref: 'User',
    default: null,
  },
}, {
  versionKey: false,
});

// Índices para búsquedas eficientes
NotificationSchema.index({ user_id: 1, read: 1 });
NotificationSchema.index({ user_id: 1, created_at: -1 });

export default mongoose.model('Notification', NotificationSchema);

