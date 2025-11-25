import mongoose from 'mongoose';
import BaseSchema from './base.js';

const ReviewSchema = new mongoose.Schema({
  ...BaseSchema.obj,

  user_id: { 
    type: String, 
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  genre: { 
    type: String, 
    },
  
  target_type: { 
    type: String, 
    enum: [ 'track', 'album', 'artist', 'playlist' ],
    required: true 
  },

  spotify_id: { 
    type: String, 
  },

  content: { 
    type: String, 
    trim: true, 
    maxlength: 1000 
  },

  rating: {   
    type: Number, 
    min: 0,
    max: 5, 
    required: true 
  },
  timestamp_ms: {
    type: Number,
    min: 0,
    default: null,
    validate: {
        validator: function(value) {
            // Si es null, está permitido (para reseñas de álbumes, artistas, etc.)
            if (value === null || value === undefined) return true;
            // Debe ser un número positivo
            return value >= 0;
        },
        message: 'El momento exacto debe ser un número positivo en milisegundos'
    }
},

  likes: { 
    type: Number, 
    default: 0 
  }

}, {
  versionKey: false
});

ReviewSchema.index({ spotify_id: 1, target_type: 1 });
ReviewSchema.index({ user_id: 1 });

export default mongoose.model('Review', ReviewSchema);