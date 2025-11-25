import { Request, Response } from "express";
import * as authService from "../../services/auth/authService.js";
import * as userService from "../../services/users/userService.js";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN!;

export async function login(_req: Request, res: Response) {
  try {
    const loginUrl = authService.getLoginUrl();
    res.redirect(loginUrl);
  } catch (error) {
    res.status(500).json({ error: "Failed to initiate login" });
  }
}

export async function callback(req: Request, res: Response) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${FRONTEND_ORIGIN}?error=no_code`);
    }

    const tokenData = await authService.exchangeCodeForTokens(code as string);

    // Obtener el perfil del usuario desde Spotify
    const profile = await authService.getUserProfile(tokenData.access_token);

    // Crear o devolver el usuario existente en la base de datos
    const user = await userService.createUser({
      spotify_id: profile.id,
      email: profile.email,
      country: profile.country,
      name: profile.display_name,
    });

    const userId = (user as any)?._id?.toString?.() ?? (user as any)?.id ?? "";
    const userName = user?.name || profile.display_name || "";
    const redirectUrl = `${FRONTEND_ORIGIN}?access_token=${tokenData.access_token}&refresh_token=${tokenData.refresh_token}${userId ? `&user_id=${encodeURIComponent(userId)}` : ""}${userName ? `&user_name=${encodeURIComponent(userName)}` : ""}`;
    res.redirect(redirectUrl);
  } catch (error) {
    res.redirect(`${FRONTEND_ORIGIN}?error=auth_failed`);
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const accessToken = authHeader.substring(7);
    const profile = await authService.getUserProfile(accessToken);

    let user = null;
    try {
      user = await userService.getUserBySpotifyId(profile.id);
    } catch (error) {
      // ignorar si no existe
    }

    return res.json({
      ...profile,
      user_id: user?._id?.toString() ?? null,
      user_name: user?.name ?? profile.display_name ?? null,
    });
  } catch (error: any) {
    if (error.message?.includes("expired") || error.message?.includes("401")) {
      return res.status(401).json({ 
        error: "Token expired", 
        code: "TOKEN_EXPIRED",
        message: "El token de acceso ha expirado. Por favor, inicia sesión nuevamente."
      });
    }
    res.status(401).json({ error: "Invalid token" });
  }
}

export async function logout(_req: Request, res: Response) {
  try {
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to logout" });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const tokenData = await authService.refreshAccessToken(refresh_token);
    
    res.json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type
    });
  } catch (error: any) {
    console.error('❌ Error al refrescar el token:', error);
    res.status(401).json({ 
      error: "Failed to refresh token",
      message: "El refresh token es inválido o ha expirado. Por favor, inicia sesión nuevamente."
    });
  }
}

