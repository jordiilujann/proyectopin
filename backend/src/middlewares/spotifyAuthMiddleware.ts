import { Request, Response, NextFunction } from "express";
import * as userService from "../services/users/userService.js";
import * as authService from "../services/auth/authService.js";

export async function getCurrentUserFromSpotify(req: Request, res: Response, next: NextFunction) {
  try {
    // Obtener el token de acceso de Spotify de los headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Token de acceso de Spotify no proporcionado" });
    }

    const accessToken = authHeader.substring(7); // Remover 'Bearer '
    
    // Obtener el perfil del usuario desde Spotify
    const spotifyProfile = await authService.getUserProfile(accessToken);
    
    // Buscar el usuario en la base de datos por su spotify_id
    const user = await userService.getUserBySpotifyId(spotifyProfile.id);
    
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado en la base de datos" });
    }

    // Adjuntar el usuario autenticado al request
    (req as any).currentUser = user;
    (req as any).user = user;          // añadido para followController
    
    // Mostrar en consola el usuario que se ha autenticado
    console.log(`🔐 Usuario autenticado desde Spotify: ${user.name} (Spotify ID: ${user.spotify_id})`);
    
    next();
  } catch (error: any) {
    console.error('Error en autenticación con Spotify:', error);
    
    if (error.message?.includes('expired') || error.status === 401) {
      return res.status(401).json({ 
        error: "Token de Spotify expirado o inválido",
        code: "SPOTIFY_TOKEN_EXPIRED"
      });
    }
    
    res.status(401).json({ 
      error: "Error de autenticación con Spotify",
      message: error.message 
    });
  }
}

export function requireSpotifyAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Se requiere autenticación con Spotify" });
  }
  
  next();
}