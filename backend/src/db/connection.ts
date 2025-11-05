import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI no definida en variables de entorno');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, {
      dbName: 'jarana', 
    });
    console.log('✅ Conectado a MongoDB Atlas');
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('❌ Error al conectar con MongoDB:', error.message);
    process.exit(1);
  }
}
}
