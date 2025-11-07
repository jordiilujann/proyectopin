import { Request, Response } from "express";
import * as authService from "../../services/auth/authService.js";
import {
  createUser,
  getUserBySpotifyId,
} from "../../services/users/userService.js";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://127.0.0.1:4200";

// GET /api/auth/login  (redirige a Spotify)
export async function login(_req: Request, res: Response) {
  try {
    const loginUrl = authService.getLoginUrl();
    return res.redirect(loginUrl);
  } catch (error) {
    console.error("[authController.login] error:", error);
    return res.status(500).json({ error: "Failed to initiate login" });
  }
}

// GET /api/auth/callback  (Spotify redirige aquí con ?code=)
export async function callback(req: Request, res: Response) {
  try {
    const { code, error } = req.query as { code?: string; error?: string };

    if (error) {
      console.error("[authController.callback] Spotify error:", error);
      return res.redirect(
        `${FRONTEND_ORIGIN}/login?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return res.redirect(
        `${FRONTEND_ORIGIN}/login?error=${encodeURIComponent(
          "missing_code"
        )}`
      );
    }

    // 1) Intercambiar code por tokens de Spotify
    const tokenData = await authService.exchangeCodeForTokens(code);

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    if (!accessToken) {
      throw new Error("No access token received from Spotify");
    }

    // 2) Obtener perfil de Spotify
    const spotifyProfile = await authService.getUserProfile(accessToken);

    // 3) Buscar o crear usuario local en Mongo usando spotify_id
    let user = await getUserBySpotifyId(spotifyProfile.id).catch(() => null);

    if (!user) {
      user = await createUser({
        spotify_id: spotifyProfile.id,
        name: spotifyProfile.display_name || "Usuario Spotify",
        email: spotifyProfile.email,
        country: spotifyProfile.country,
        avatar_url: spotifyProfile.images?.[0]?.url || null,
        premium: spotifyProfile.product === "premium",
      });
    }

    // 4) Redirigir al frontend con tokens + user_id en la URL
    const redirectUrl =
      `${FRONTEND_ORIGIN}/app/profile` +
      `?access_token=${encodeURIComponent(accessToken)}` +
      `&refresh_token=${encodeURIComponent(refreshToken ?? "")}` +
      `&user_id=${encodeURIComponent(user._id.toString())}`;

    return res.redirect(redirectUrl);
  } catch (err: any) {
    console.error("[authController.callback] error:", err?.message || err);
    return res.redirect(
      `${FRONTEND_ORIGIN}/login?error=${encodeURIComponent("callback_failed")}`
    );
  }
}

// POST /api/auth/logout
export async function logout(_req: Request, res: Response) {
  try {
    // Si usas cookies httpOnly en authService, aquí podrías limpiarlas:
    // authService.clearTokenCookies(res);

    return res.status(200).json({ message: "Logged out" });
  } catch (error) {
    console.error("[authController.logout] error:", error);
    return res.status(500).json({ error: "Failed to logout" });
  }
}

// POST /api/auth/refresh
export async function refreshToken(req: Request, res: Response) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res
        .status(400)
        .json({ error: "Missing refresh_token in request body" });
    }

    const tokenData = await authService.refreshAccessToken(refresh_token);

    return res.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
    });
  } catch (error: any) {
    console.error("[authController.refreshToken] error:", error);
    return res.status(401).json({
      error: "Failed to refresh token",
      message:
        "El refresh token es inválido o ha expirado. Por favor, inicia sesión nuevamente.",
    });
  }
}

// GET /api/me
// Devuelve el perfil del usuario en Spotify usando el access token
export async function getProfile(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const accessToken = authHeader.split(" ")[1];

    const profile = await authService.getUserProfile(accessToken);
    return res.json(profile);
  } catch (error: any) {
    console.error("[authController.getProfile] error:", error?.message || error);
    return res.status(401).json({
      error: "Failed to fetch profile",
      message: "Access token inválido o expirado",
    });
  }
}

