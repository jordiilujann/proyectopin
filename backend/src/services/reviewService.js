import Review from '../models/review.js';
import User from '../models/user.js';

export const createReview = async (
  userId, 
  spotifyId, 
  targetType, 
  rating, 
  content, 
  genre
) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('El usuario no existe.');
    }

    const existingReview = await Review.findOne({ 
      user_id: userId, 
      spotify_id: spotifyId 
    });

    if (existingReview) {
      throw new Error('Ya has escrito una reseña para este ítem.');
    }

    const newReview = new Review({
      user_id: userId,
      spotify_id: spotifyId,
      target_type: targetType,
      rating: rating,
      content: content,
      genre: genre
    });

    await newReview.save();

    return newReview;

  } catch (error) {
    throw error;
  }
};

export const getReviewsBySpotifyId = async (spotifyId) => {
  try {
    const reviews = await Review.find({ spotify_id: spotifyId })
      .sort({ created_at: -1 })
      .populate('user_id', 'name avatar_url');
    return reviews;
      
  } catch (error) {
    throw error;
  }
};