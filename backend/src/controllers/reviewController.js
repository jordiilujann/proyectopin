import * as reviewService from '../services/reviewService.js';


export const createReviewCtrl = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado.' });
    }

    const { spotify_id, target_type, rating, content, genre } = req.body;

    if (!spotify_id || !target_type || !rating || !genre) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: spotify_id, target_type, rating, y genre son requeridos.' });
    }
    
    const newReview = await reviewService.createReview(
      userId,
      spotify_id,
      target_type,
      rating,
      content,
      genre
    );

    res.status(201).json(newReview);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getReviewsCtrl = async (req, res) => {
  try {
    const { spotifyId } = req.params;

    const reviews = await reviewService.getReviewsBySpotifyId(spotifyId);
    res.status(200).json(reviews);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};