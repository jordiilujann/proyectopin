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
    const redirectUrl = `${FRONTEND_ORIGIN}?access_token=${tokenData.access_token}&refresh_token=${tokenData.refresh_token}${userId ? `&user_id=${encodeURIComponent(userId)}` : ""}`;
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
    return res.json(profile);
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function logout(_req: Request, res: Response) {
  try {
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to logout" });
  }
}

