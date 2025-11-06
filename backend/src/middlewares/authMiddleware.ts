import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth/authService.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    spotify_id: string;
    email: string;
  };
  accessToken?: string;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const accessToken = authHeader.substring(7);
    
    try {
      // Verificar si el token es válido intentando obtener el perfil
      const profile = await authService.getUserProfile(accessToken);
      
      // Agregar información del usuario a la request
      req.user = {
        id: profile.id,
        spotify_id: profile.id,
        email: profile.email
      };
      req.accessToken = accessToken;
      
      next();
    } catch (error: any) {
      // Si el token expiró, devolver error específico
      if (error.message?.includes("expired") || error.message?.includes("401")) {
        return res.status(401).json({ 
          error: "Token expired", 
          code: "TOKEN_EXPIRED",
          message: "El token de acceso ha expirado. Por favor, inicia sesión nuevamente."
        });
      }
      
      // Para otros errores de autenticación
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error('Error en auth middleware:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const accessToken = authHeader.substring(7);
    req.accessToken = accessToken;
    
    // Intentar obtener el perfil pero no fallar si hay error
    authService.getUserProfile(accessToken)
      .then(profile => {
        req.user = {
          id: profile.id,
          spotify_id: profile.id,
          email: profile.email
        };
        next();
      })
      .catch(() => {
        // Si falla, continuar sin información de usuario
        next();
      });
  } else {
    next();
  }
}