import Comment from "../../models/comment.js";

export async function createComment(commentData: any) {
  try {
    const comment = new Comment(commentData);
    await comment.save();
    return comment;
  } catch (error) {
    throw new Error(`Error al crear el comentario: ${error}`);
  }
}

export async function getComments(filters: any = {}) {
  try {
    const comments = await Comment.find(filters).sort({ created_at: -1 });
    return comments;
  } catch (error) {
    throw new Error(`Error al obtener comentarios: ${error}`);
  }
}

export async function getCommentById(id: string) {
  try {
    const comment = await Comment.findById(id);
    if (!comment) {
      throw new Error("Comentario no encontrado");
    }
    return comment;
  } catch (error) {
    throw new Error(`Error al obtener el comentario: ${error}`);
  }
}

export async function updateComment(id: string, updateData: any) {
  try {
    const comment = await Comment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!comment) {
      throw new Error("Comentario no encontrado");
    }
    return comment;
  } catch (error) {
    throw new Error(`Error al actualizar el comentario: ${error}`);
  }
}

export async function deleteComment(id: string) {
  try {
    const comment = await Comment.findByIdAndDelete(id);
    if (!comment) {
      throw new Error("Comentario no encontrado");
    }
    return comment;
  } catch (error) {
    throw new Error(`Error al eliminar el comentario: ${error}`);
  }
}

export async function getCommentsByReviewId(reviewId: string) {
  try {
    const comments = await Comment.find({ review_id: reviewId }).sort({ created_at: -1 });
    return comments;
  } catch (error) {
    throw new Error(`Error al obtener comentarios de la reseña: ${error}`);
  }
}

export async function getCommentsByUserId(userId: string) {
  try {
    const comments = await Comment.find({ user_id: userId }).sort({ created_at: -1 });
    return comments;
  } catch (error) {
    throw new Error(`Error al obtener comentarios del usuario: ${error}`);
  }
}

