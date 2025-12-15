# Evidencias de validación NO funcional (AVD-PIN)

Este documento define **procedimientos reproducibles** para recoger evidencia **sin modificar código de producción**.  
Rellena los huecos marcados como `[INSERTAR ...]` con capturas y números reales tras ejecutar los pasos.

---

## RNF1 — Manejo de sesión/tokens (expiración 401 → refresh → retry; si falla → logout + redirect)

### 1) Evidencia de almacenamiento/limpieza de tokens (DevTools)
**Objetivo**: evidenciar que la app guarda y limpia tokens de sesión y datos de usuario.

**Código relevante**:
- `frontend/src/app/services/auth.service.ts` (claves en `localStorage` y `logout()`)
- `frontend/src/app/components/login/login.component.ts` (captura de `access_token`/`refresh_token` en query params)

**Pasos**:
1. Arranca frontend: desde `frontend/` ejecuta `npm run start`.
2. Abre `http://localhost:4200/login`.
3. Abre DevTools → Application → Local Storage → `http://localhost:4200`.
4. Simula retorno del login (sin backend) visitando:
   - `/login?access_token=AAA&refresh_token=RRR&user_id=U1&user_name=NAME1`
5. Comprueba que aparecen entradas:
   - `spotify_access_token`, `spotify_refresh_token`, `user_id`, `user_name`.
6. Ejecuta logout desde UI (Shell navbar si aplica) o navega a una acción de logout.
7. Comprueba que las claves anteriores desaparecen.

**Evidencia a capturar**:
- `[INSERTAR CAPTURA] LocalStorage con claves tras login simulado`
- `[INSERTAR CAPTURA] LocalStorage vacío tras logout`

### 2) Evidencia de flujo 401 → refresh → retry (sin red real, por test de integración)
**Objetivo**: aportar evidencia automatizada del comportamiento ante expiración.

**Código/test relevante**:
- Test: `frontend/src/app/services/auth.service.spec.ts`
  - “401/TOKEN_EXPIRED → POST refresh → retry GET /api/me”
  - “si refresh falla → handleExpiredToken() y error”

**Pasos**:
1. Ejecuta tests con cobertura (o sin cobertura):
   - `npm run test:cov` o `npm test`
2. Revisa en el output que pasan los tests de `AuthService`.

**Evidencia a capturar**:
- `[INSERTAR CAPTURA] salida de consola con tests AuthService passing`

**Nota**: esta evidencia valida la lógica de refresh/retry usando `HttpTestingController` (sin backend real).

---

## RNF2 — Rendimiento: evidencia del patrón N+1 en feed/perfil + medición reproducible

### 1) Evidencia automatizada del patrón N+1 (unit test)
**Objetivo**: demostrar (de forma reproducible) que el feed hace **1 llamada por reseña** para enriquecer datos.

**Código/test relevante**:
- Test: `frontend/src/app/components/feed/feed.component.spec.ts`
  - `enrichReviewsWithSpotifyInfo()` llama `getSpotifyItemInfo()` **N veces** para N reseñas.
- Código: `frontend/src/app/components/feed/feed.component.ts`

**Evidencia a capturar**:
- `[INSERTAR CAPTURA] salida de consola mostrando el test de N+1 pasando`

### 2) Medición manual (DevTools Network) en `/app/feed` y `/app/profile`
**Objetivo**: cuantificar requests y latencias con una sesión real (o semisimulada).

**Código relevante**:
- Feed: `frontend/src/app/components/feed/feed.component.ts`
- Perfil: `frontend/src/app/components/profile/profile.component.ts`

**Pasos (reproducibles)**:
1. Arranca frontend y backend si está disponible (opcional; si no, usa solo la parte reproducible).
2. Abre DevTools → Network:
   - Activa “Disable cache”.
   - Preserva log (“Preserve log”) si vas a navegar.
3. Navega a:
   - `/app/feed` (con sesión válida)
   - `/app/profile` (con sesión válida)
4. Filtra por `spotify` o por `reviews` y observa:
   - Número de requests totales durante el “primer render”.
   - Ráfagas (muchas requests en paralelo) asociadas a enriquecer items.
5. Registra:
   - `[INSERTAR MÉTRICA] total requests (feed inicial)`
   - `[INSERTAR MÉTRICA] total requests (profile inicial)`
   - `[INSERTAR MÉTRICA] tiempo hasta primer contenido visible (aprox.)`

**Evidencia a capturar**:
- `[INSERTAR CAPTURA] Network waterfall feed`
- `[INSERTAR CAPTURA] Network waterfall profile`

---

## RNF3 — Mantenibilidad/testabilidad: inconsistencias de endpoints + plan futuro (sin implementar)

### 1) Evidencia: endpoints inconsistentes (proxy `/api` vs hardcoded)
**Objetivo**: documentar inconsistencia real en el repositorio para justificar deuda técnica que afecta testabilidad.

**Proxy definido**:
- `frontend/proxy.conf.json` (mapea `/api` → `http://localhost:3000`)

**Ejemplos de uso relativo (pasa por proxy)**:
- `frontend/src/app/services/spotify.service.ts` usa `'/api/spotify'`
- `frontend/src/app/components/search/search.component.ts` usa rutas `'/api/users'`, `'/api/follows'`
- `frontend/src/app/components/review/review.component.ts` crea reseña con `POST '/api/reviews'`

**Ejemplos hardcodeados (no pasan por proxy)**:
- `frontend/src/app/services/auth.service.ts` usa `http://127.0.0.1:3000`
- `frontend/src/app/services/review.service.ts` usa `http://127.0.0.1:3000`
- `frontend/src/app/components/profile/profile.component.ts` usa `http://127.0.0.1:3000`
- `frontend/src/app/components/notifications/notifications.component.ts` usa `http://127.0.0.1:3000`

**Impacto (para AVD)**:
- Dificulta E2E e integración (doble origen / variabilidad por entorno).
- Aumenta el coste de mockeo/interceptación y rompe portabilidad a producción.

### 2) Plan futuro propuesto (sin implementar)
**Objetivo**: dejar claro cómo se corregiría en una siguiente iteración, sin tocar producción para la entrega.

Plan:
1. Introducir `environment.ts`/`environment.prod.ts` con `apiBaseUrl`.
2. Centralizar acceso HTTP en servicios (evitar `HttpClient` directo en componentes).
3. Implementar un `HttpInterceptor` para:
   - añadir `Authorization` automáticamente
   - manejar 401/refresh de forma central (si aplica)
4. Unificar estrategia de URLs: o todo relativo vía `/api` + proxy, o todo por `environment.apiBaseUrl`.

**Huecos para memoria**:
- `[INSERTAR] decisión tomada (relativo vs environment)`
- `[INSERTAR] riesgos y mitigaciones`

