import "dotenv/config";
import app from "./app.js";
import { connectDB } from './config/db.js';

dotenv.config();
await connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API escuchando en http://localhost:${PORT}`));
