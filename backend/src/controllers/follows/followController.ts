import { Request, Response } from "express";
import * as followService from "../../services/follows/followService.js";

interface UserPayload {
  _id: string;
  spotify_id?: string;
  [key: string]: any;
}

interface SpotifyRequest extends Request {
  user?: UserPayload;
}

// POST /api/follows  (body: { targetUserId })
export async function follow(req: SpotifyRequest, res: Response) {
  try {
    const currentUser = req.user;

    if (!currentUser?._id) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: "targetUserId es obligatorio" });
    }

    const follow = await followService.followUser(currentUser._id, targetUserId);
    return res.status(200).json(follow);
  } catch (err: any) {
    console.error("[followController.follow]", err);
    return res.status(500).json({ message: err.message ?? "Error al seguir al usuario" });
  }
}

// DELETE /api/follows  (body: { targetUserId })
export async function unfollow(req: SpotifyRequest, res: Response) {
  try {
    const currentUser = req.user;
    if (!currentUser?._id) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: "targetUserId es obligatorio" });
    }

    const result = await followService.unfollowUser(currentUser._id, targetUserId);
    return res.status(200).json({
      ok: true,
      unfollowed: !!result,
    });
  } catch (err: any) {
    console.error("[followController.unfollow]", err);
    return res.status(500).json({ message: err.message ?? "Error al dejar de seguir al usuario" });
  }
}

// GET /api/follows/followers/:userId
export async function getFollowers(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const users = await followService.getFollowers(userId);
    return res.status(200).json(users);
  } catch (err: any) {
    console.error("[followController.getFollowers]", err);
    return res.status(500).json({ message: err.message ?? "Error al obtener seguidores" });
  }
}

// GET /api/follows/following/:userId
export async function getFollowing(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const users = await followService.getFollowing(userId);
    return res.status(200).json(users);
  } catch (err: any) {
    console.error("[followController.getFollowing]", err);
    return res.status(500).json({ message: err.message ?? "Error al obtener seguidos" });
  }
}

// GET /api/follows/followers/:userId/count
export async function getFollowerCount(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const count = await followService.getFollowerCount(userId);
    return res.status(200).json({ userId, followers: count });
  } catch (err: any) {
    console.error("[followController.getFollowerCount]", err);
    return res.status(500).json({ message: err.message ?? "Error al contar seguidores" });
  }
}

// GET /api/follows/following/:userId/count
export async function getFollowingCount(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const count = await followService.getFollowingCount(userId);
    return res.status(200).json({ userId, following: count });
  } catch (err: any) {
    console.error("[followController.getFollowingCount]", err);
    return res.status(500).json({ message: err.message ?? "Error al contar seguidos" });
  }
}
