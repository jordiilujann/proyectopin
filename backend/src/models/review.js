import mongoose from 'mongoose';
import BaseSchema from './base.model.js';

const ReviewSchema = new mongoose.Schema({
  ...BaseSchema.obj,

  user_id: { 
    type: String, 
    required: true,
    ref: 'User'
  },
  genre: { 
    type: String, 
      enum: [
        'pop', 'rock', 'hip-hop', 'r&b', 'electronic', 'country',
        'jazz', 'blues', 'reggae', 'folk', 'latin', 'metal',
        'classical', 'funk', 'indie'
    ], 
    required: true 
    },
  
  target_type: { 
    type: String, 
    enum: [ 'track', 'album', 'artist', 'playlist' ],
    required: true 
  },

  spotify_id: { 
    type: String, 
    required: true 
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