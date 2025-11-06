import { Request, Response } from "express";
import * as commentService from "../../services/comments/commentService.js";

export async function createComment(req: Request, res: Response) {
  try {
    const comment = await commentService.createComment(req.body);
    res.status(201).json(comment);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error al crear el comentario" });
  }
}

export async function getComments(req: Request, res: Response) {
  try {
    const { review_id, user_id } = req.query;
    const filters: any = {};
    
    if (review_id) filters.review_id = review_id;
    if (user_id) filters.user_id = user_id;

    const comments = await commentService.getComments(filters);
    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al obtener comentarios" });
  }
}

export async function getCommentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const comment = await commentService.getCommentById(id);
    res.json(comment);
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Comentario no encontrado" });
  }
}

export async function updateComment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const comment = await commentService.updateComment(id, req.body);
    res.json(comment);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Error al actualizar el comentario" });
  }
}

export async function deleteComment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await commentService.deleteComment(id);
    res.json({ message: "Comentario eliminado exitosamente" });
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Error al eliminar el comentario" });
  }
}

export async function getCommentsByReview(req: Request, res: Response) {
  try {
    const { reviewId } = req.params;
    const comments = await commentService.getCommentsByReviewId(reviewId);
    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al obtener comentarios de la reseña" });
  }
}

export async function getCommentsByUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const comments = await commentService.getCommentsByUserId(userId);
    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Error al obtener comentarios del usuario" });
  }
}

