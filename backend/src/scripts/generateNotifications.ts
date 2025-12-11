import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/user.js';
import Notification from '../models/notification.js';
import { connectDB } from '../db/connection.js';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde .enviroment
const envPath = path.join(__dirname, '..', '..', '.enviroment');
dotenv.config({ path: envPath });

async function generateNotifications() {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log('✅ Conectado a la base de datos');

    // Buscar el usuario por email
    const user = await User.findOne({ email: 'outgoinghome@gmail.com' });
    
    if (!user) {
      console.error('❌ Usuario no encontrado con email: outgoinghome@gmail.com');
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${user.name} (ID: ${user._id})`);

    // Crear 5 notificaciones de ejemplo
    const notifications = [
      {
        user_id: user._id.toString(),
        type: 'follow',
        message: 'María empezó a seguirte',
        read: false,
        related_user_id: null,
      },
      {
        user_id: user._id.toString(),
        type: 'review',
        message: 'Juan publicó una nueva reseña: "Increíble álbum de Radiohead"',
        read: false,
        related_review_id: null,
        related_user_id: null,
      },
      {
        user_id: user._id.toString(),
        type: 'follow',
        message: 'Carlos empezó a seguirte',
        read: false,
        related_user_id: null,
      },
      {
        user_id: user._id.toString(),
        type: 'review',
        message: 'Ana publicó una nueva reseña: "Me encanta este artista"',
        read: false,
        related_review_id: null,
        related_user_id: null,
      },
      {
        user_id: user._id.toString(),
        type: 'like',
        message: 'Pedro le dio like a tu reseña',
        read: false,
        related_review_id: null,
        related_user_id: null,
      },
    ];

    // Insertar las notificaciones
    const created = await Notification.insertMany(notifications);
    
    console.log(`✅ ${created.length} notificaciones creadas exitosamente:`);
    created.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.message} (${notif.type})`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
generateNotifications();

