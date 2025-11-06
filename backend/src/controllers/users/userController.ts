import { Request, Response } from "express";
import * as userService from "../../services/users/userService.js";

export async function createUser(req: Request, res: Response) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error al crear el usuario" });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const { spotify_id, name, country, premium } = req.query;
    const filters: any = {};
    
    if (spotify_id) filters.spotify_id = spotify_id;
    if (name) filters.name = new RegExp(name as string, 'i');
    if (country) filters.country = country;
    if (premium !== undefined) filters.premium = premium === 'true';

    const users = await userService.getUsers(filters);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al obtener usuarios" });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Usuario no encontrado" });
  }
}

export async function getUserBySpotifyId(req: Request, res: Response) {
  try {
    const { spotifyId } = req.params;
    const user = await userService.getUserBySpotifyId(spotifyId);
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Usuario no encontrado" });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error al actualizar el usuario" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Error al eliminar el usuario" });
  }
}

