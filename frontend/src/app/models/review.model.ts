export interface Review {
  _id: string;
  user_id: string;
  user_name?: string; // Para mostrar el nombre del usuario
  title: string; // Título de la reseña
  genre?: string;
  target_type: 'track' | 'album' | 'artist' | 'playlist' | 'concert';
  spotify_id: string;
  content: string;
  rating: number;
  likes: number;
  timestamp_ms?: number | null; // Momento exacto de la canción en milisegundos
  created_at: string;
  item_name?: string; // Nombre del item (canción, álbum, artista)
  item_cover_url?: string; // URL de la carátula
  item_artists?: string[]; // Artistas relacionados
  
  // Campos opcionales para conciertos
  venue?: string;
  concert_date?: string;
}

export interface ReviewResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
}

export interface LikeReviewResponse {
  success: boolean;
  likes: number;
  message?: string;
}