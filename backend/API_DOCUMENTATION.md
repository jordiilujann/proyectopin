# 📚 Documentación de la API

## 🔌 Conexión con MongoDB

La aplicación se conecta automáticamente a MongoDB cuando se inicia. Las **colecciones se crean automáticamente** la primera vez que insertas datos usando los endpoints.

### Colecciones que se crearán automáticamente:
- `users` - Usuarios de la aplicación
- `reviews` - Reseñas de música
- `comments` - Comentarios en las reseñas

**No necesitas crear estas colecciones manualmente en MongoDB.**

## 🚀 Cómo iniciar el servidor

```bash
cd backend
npm install
npm run dev
```

El servidor se iniciará en `http://localhost:3000` y se conectará a tu base de datos MongoDB usando la variable de entorno `MONGO_URI`.

## 📋 Endpoints Disponibles

### 👥 USERS - `/api/users`

#### Crear Usuario
```http
POST /api/users
Content-Type: application/json

{
  "spotify_id": "test_user_123",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "avatar_url": "https://example.com/avatar.jpg",
  "genre_preferences": ["rock", "pop", "indie"],
  "country": "ES",
  "premium": true
}
```

#### Obtener Todos los Usuarios
```http
GET /api/users
```

**Query params opcionales:**
- `spotify_id` - Filtrar por Spotify ID
- `name` - Buscar por nombre (case insensitive)
- `country` - Filtrar por país
- `premium` - Filtrar por usuarios premium (true/false)

#### Obtener Usuario por ID
```http
GET /api/users/:id
```

#### Actualizar Usuario
```http
PUT /api/users/:id
Content-Type: application/json

{
  "name": "Juan Actualizado",
  "genre_preferences": ["rock", "metal"]
}
```

#### Eliminar Usuario
```http
DELETE /api/users/:id
```

---

### ⭐ REVIEWS - `/api/reviews`

#### Crear Reseña
```http
POST /api/reviews
Content-Type: application/json

{
  "user_id": "user_id_here",
  "genre": "rock",
  "target_type": "album",
  "spotify_id": "spotify_album_123",
  "content": "Excelente álbum",
  "rating": 5
}
```

**Campos requeridos:**
- `user_id` - ID del usuario que crea la reseña
- `genre` - Género musical (pop, rock, hip-hop, r&b, electronic, country, jazz, blues, reggae, folk, latin, metal, classical, funk, indie)
- `target_type` - Tipo de contenido (track, album, artist, playlist)
- `spotify_id` - ID del contenido en Spotify
- `rating` - Puntuación de 0 a 5

**Campos opcionales:**
- `content` - Texto de la reseña (máximo 1000 caracteres)

#### Obtener Todas las Reseñas
```http
GET /api/reviews
```

**Query params opcionales:**
- `user_id` - Filtrar por usuario
- `spotify_id` - Filtrar por contenido de Spotify
- `target_type` - Filtrar por tipo (track, album, artist, playlist)
- `genre` - Filtrar por género

#### Obtener Reseña por ID
```http
GET /api/reviews/:id
```

#### Actualizar Reseña
```http
PUT /api/reviews/:id
Content-Type: application/json

{
  "content": "Reseña actualizada",
  "rating": 4
}
```

#### Eliminar Reseña
```http
DELETE /api/reviews/:id
```

#### Obtener Reseñas de un Usuario
```http
GET /api/reviews/user/:userId
```

#### Obtener Reseñas de un Item de Spotify
```http
GET /api/reviews/spotify/:spotifyId?target_type=album
```

---

### 💬 COMMENTS - `/api/comments`

#### Crear Comentario
```http
POST /api/comments
Content-Type: application/json

{
  "review_id": "review_id_here",
  "user_id": "user_id_here",
  "content": "Estoy de acuerdo con esta reseña"
}
```

**Campos requeridos:**
- `review_id` - ID de la reseña
- `user_id` - ID del usuario que comenta
- `content` - Texto del comentario (máximo 1000 caracteres)

#### Obtener Todos los Comentarios
```http
GET /api/comments
```

**Query params opcionales:**
- `review_id` - Filtrar por reseña
- `user_id` - Filtrar por usuario

#### Obtener Comentario por ID
```http
GET /api/comments/:id
```

#### Actualizar Comentario
```http
PUT /api/comments/:id
Content-Type: application/json

{
  "content": "Comentario actualizado",
  "likes": 5
}
```

#### Eliminar Comentario
```http
DELETE /api/comments/:id
```

#### Obtener Comentarios de una Reseña
```http
GET /api/comments/review/:reviewId
```

#### Obtener Comentarios de un Usuario
```http
GET /api/comments/user/:userId
```

---

## 🧪 Cómo Probar los Endpoints

### Opción 1: REST Client (VS Code Extension)
1. Instala la extensión "REST Client" en VS Code
2. Abre el archivo `test-endpoints.http`
3. Haz clic en "Send Request" sobre cada petición

### Opción 2: cURL (Terminal)
```bash
# Crear un usuario
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"spotify_id":"test123","name":"Test User","email":"test@example.com"}'

# Obtener usuarios
curl http://localhost:3000/api/users
```

### Opción 3: Postman o Insomnia
Importa las peticiones del archivo `test-endpoints.http` o créalas manualmente.

---

## ✅ Verificar que Todo Funciona

1. **Inicia el servidor:**
```bash
npm run dev
```

2. **Verifica el health check:**
```bash
curl http://localhost:3000/api/health
# Respuesta esperada: {"ok":true}
```

3. **Crea tu primer usuario:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"spotify_id":"user1","name":"Mi Usuario","email":"usuario@example.com"}'
```

4. **Verifica en MongoDB:**
   - La colección `users` se habrá creado automáticamente
   - Verás tu primer usuario guardado

---

## 🔄 Flujo Típico de Uso

1. **Crear un usuario** → `POST /api/users`
2. **Crear una reseña** → `POST /api/reviews` (usando el `user_id`)
3. **Crear comentarios** → `POST /api/comments` (usando el `review_id` y `user_id`)
4. **Consultar datos** → `GET /api/reviews`, `GET /api/comments`, etc.
5. **Actualizar** → `PUT /api/users/:id`, `PUT /api/reviews/:id`, etc.

---

## 🎯 Respuestas de la API

### Éxito (200, 201)
```json
{
  "_id": "abc123...",
  "name": "Usuario",
  "created_at": "2025-11-05T..."
}
```

### Error (400, 404, 500)
```json
{
  "error": "Descripción del error"
}
```

---

## 📝 Notas Importantes

1. **IDs Automáticos**: Todos los documentos tienen un `_id` de 20 caracteres generado automáticamente
2. **Timestamps**: Se incluye `created_at` en todos los documentos
3. **Validaciones**: Los modelos tienen validaciones (required, enum, maxlength, etc.)
4. **Índices**: Los modelos tienen índices para optimizar consultas
5. **Colecciones Automáticas**: MongoDB crea las colecciones en el primer INSERT

