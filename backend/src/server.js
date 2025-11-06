import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno PRIMERO antes de cualquier otra cosa
const envPath = path.join(__dirname, '..', '.enviroment');
console.log('🔍 Cargando .enviroment desde:', envPath);
dotenv.config({ path: envPath });

const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API escuchando en http://localhost:${PORT}`));
