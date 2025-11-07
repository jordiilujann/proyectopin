import Review from "../../models/review.js";
import User from "../../models/user.js";

export async function createReview(reviewData: any) {
  try {
    const review = new Review(reviewData);
    await review.save();
    return review;
  } catch (error: any) {
    // Mostrar detalles específicos del error de validación
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      throw new Error(`Error de validación: ${errors.join(', ')}`);
    }
    throw new Error(`Error al crear la reseña: ${error.message}`);
  }
}

export async function getReviews(filters: any = {}, page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit;
    const reviews = await Review.find(filters)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    // Enriquecer las reseñas con información del usuario
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        try {
          const user = await User.findById(review.user_id);
          if (user) {
            return {
              ...review.toObject(),
              user_name: user.name || 'Usuario'
            };
          }
        } catch (error) {
          console.error(`Error al obtener usuario ${review.user_id}:`, error);
        }
        
        // Si no se puede obtener el usuario, mantener la reseña original
        return {
          ...review.toObject(),
          user_name: 'Usuario'
        };
      })
    );
    
    const total = await Review.countDocuments(filters);
    
    return {
      reviews: enrichedReviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    throw new Error(`Error al obtener reseñas: ${error}`);
  }
}

export async function getReviewById(id: string) {
  try {
    const review = await Review.findById(id);
    if (!review) {
      throw new Error("Reseña no encontrada");
    }
    
    // Enriquecer la reseña con información del usuario
    const user = await User.findById(review.user_id);
    const enrichedReview = {
      ...review.toObject(),
      user_name: user?.name || 'Usuario'
    };
    
    return enrichedReview;
  } catch (error) {
    throw new Error(`Error al obtener la reseña: ${error}`);
  }
}

export async function updateReview(id: string, updateData: any) {
  try {
    const review = await Review.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!review) {
      throw new Error("Reseña no encontrada");
    }
    return review;
  } catch (error) {
    throw new Error(`Error al actualizar la reseña: ${error}`);
  }
}

export async function deleteReview(id: string) {
  try {
    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      throw new Error("Reseña no encontrada");
    }
    return review;
  } catch (error) {
    throw new Error(`Error al eliminar la reseña: ${error}`);
  }
}

export async function getReviewsByUserId(userId: string) {
  try {
    const reviews = await Review.find({ user_id: userId }).sort({ created_at: -1 });
    
    // Enriquecer las reseñas con información del usuario
    const user = await User.findById(userId);
    const userName = user?.name || 'Usuario';
    
    const enrichedReviews = reviews.map(review => ({
      ...review.toObject(),
      user_name: userName
    }));
    
    return enrichedReviews;
  } catch (error) {
    throw new Error(`Error al obtener reseñas del usuario: ${error}`);
  }
}

export async function getReviewsBySpotifyId(spotifyId: string, targetType: string) {
  try {
    const reviews = await Review.find({ 
      spotify_id: spotifyId,
      target_type: targetType 
    }).sort({ created_at: -1 });
    
    // Enriquecer las reseñas con información del usuario
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        try {
          const user = await User.findById(review.user_id);
          if (user) {
            return {
              ...review.toObject(),
              user_name: user.name || 'Usuario'
            };
          }
        } catch (error) {
          console.error(`Error al obtener usuario ${review.user_id}:`, error);
        }
        
        // Si no se puede obtener el usuario, mantener la reseña original
        return {
          ...review.toObject(),
          user_name: 'Usuario'
        };
      })
    );
    
    return enrichedReviews;
  } catch (error) {
    throw new Error(`Error al obtener reseñas por Spotify ID: ${error}`);
  }
}

