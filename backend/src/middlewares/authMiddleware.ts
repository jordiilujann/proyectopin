import { Request, Response, NextFunction } from "express";
import * as userService from "../services/users/userService.js";

export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Buscar user_id en headers, query parameters o body
    const userId = req.headers['x-user-id'] || req.query.user_id || req.body.user_id;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({ error: "User ID no proporcionado en la sesión" });
    }

    const user = await userService.getUserById(userId);
    (req as any).currentUser = user;
    
    // Mostrar en consola el usuario que se ha autenticado
    console.log(`🔐 Usuario autenticado: ${user.name} (ID: ${user._id || user.id})`);
    
    next();
  } catch (error: any) {
    res.status(401).json({ error: "Usuario no autenticado o no encontrado" });
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] || req.query.user_id;
  
  if (!userId) {
    return res.status(401).json({ error: "Se requiere autenticación" });
  }
  
  next();
}