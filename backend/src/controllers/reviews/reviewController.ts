import { Request, Response } from "express";
import * as reviewService from "../../services/reviews/reviewService.js";
import { getUserBySpotifyId } from "../../services/users/userService.js";
import { getReviewsByUserId } from "../../services/reviews/reviewService.js";


export async function createReview(req: Request, res: Response) {
  try {
    // Obtener el usuario autenticado del middleware de Spotify
    const currentUser = (req as any).currentUser;
    if (!currentUser) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
    
    // Crear la reseña con el ID del usuario autenticado
    const reviewData = {
      ...req.body,
      user_id: currentUser._id || currentUser.id
    };
    
    const review = await reviewService.createReview(reviewData);
    res.status(201).json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error al crear la reseña" });
  }
}

export async function getReviews(req: Request, res: Response) {
  try {
    const { user_id, spotify_id, target_type, genre, page, limit } = req.query;
    const filters: any = {};
    
    if (user_id) filters.user_id = user_id;
    if (spotify_id) filters.spotify_id = spotify_id;
    if (target_type) filters.target_type = target_type;
    if (genre) filters.genre = genre;

    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 10;

    const result = await reviewService.getReviews(filters, pageNumber, limitNumber);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al obtener reseñas" });
  }
}

export async function getReviewById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id);
    res.json(review);
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Reseña no encontrada" });
  }
}

export async function updateReview(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const review = await reviewService.updateReview(id, req.body);
    res.json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error al actualizar la reseña" });
  }
}

export async function deleteReview(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await reviewService.deleteReview(id);
    res.json({ message: "Reseña eliminada exitosamente" });
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Error al eliminar la reseña" });
  }
}

export async function getReviewsByUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const reviews = await reviewService.getReviewsByUserId(userId);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al obtener reseñas del usuario" });
  }
}

export async function getReviewsBySpotifyId(req: Request, res: Response) {
  try {
    const { spotifyId } = req.params;
    const { target_type } = req.query;
    
    if (!target_type) {
      return res.status(400).json({ error: "El parámetro target_type es requerido" });
    }

    const reviews = await reviewService.getReviewsBySpotifyId(spotifyId, target_type as string);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al obtener reseñas por Spotify ID" });
  }
}

// GET /api/reviews/me
// Usa el access token de Spotify para encontrar el usuario en tu BDD
// y devuelve las reseñas cuyo user_id coincide con su _id.
export async function getMyReviews(req: any, res: any) {
  try {
    const authHeader =
      req.header("authorization") || req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Authorization: Bearer <spotify_token> required" });
    }

    const spotifyToken = authHeader.slice("Bearer ".length).trim();

    // 1) Obtener perfil de Spotify del usuario autenticado
    const meRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${spotifyToken}` },
    });

    if (!meRes.ok) {
      const txt = await meRes.text();
      console.error("Spotify /me failed:", meRes.status, txt);
      return res.status(401).json({ error: "Invalid Spotify token" });
    }

    const me = await meRes.json();
    const spotifyId = me?.id;
    if (!spotifyId) {
      return res
        .status(400)
        .json({ error: "Could not read Spotify user id from token" });
    }

    // 2) Buscar al usuario interno por spotify_id
    let user;
    try {
      user = await getUserBySpotifyId(spotifyId);
    } catch {
      // getUserBySpotifyId lanza si no existe -> tratamos como sin reseñas
      return res.json([]);
    }

    if (!user?._id) {
      return res.json([]);
    }

    const userId = String(user._id);

    // 3) Obtener reseñas de ese user_id
    const reviews = await getReviewsByUserId(userId);

    // 4) Responder directamente con el array de reseñas
    return res.json(reviews);
  } catch (err: any) {
    console.error("[getMyReviews] error:", err?.message || err);
    return res
      .status(500)
      .json({ error: "Error al obtener reseñas del usuario" });
  }
}
