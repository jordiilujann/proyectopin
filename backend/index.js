// Carga variables de entorno desde .env (opcional)
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// 1) Configuración básica
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:4200';

// 2) Middlewares globales
app.use(express.json());                     // parsea JSON del body
app.use(cors({ origin: FRONTEND_ORIGIN }));  // permite peticiones desde el front

// 3) Rutas mínimas (probar que todo funciona)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'backend', ts: new Date().toISOString() });
});

// 4) Arranque del servidor
app.listen(PORT, () => {
  console.log(`✅ Backend escuchando en http://localhost:${PORT}`);
});
