import mongoose from 'mongoose';
import BaseSchema from './base.js';

const UserSchema = new mongoose.Schema({
  ...BaseSchema.obj,

  spotify_id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
  },
  email: { 
    type: String 
  },
  avatar_url: { 
    type: String 
  },
  image: {
    type: String
  },
  genre_preferences: { 
    type: [String], 
    enum: [
      "pop",
      "rock",
      "hip-hop",
      "r&b",
      "electronic",
      "country",
      "jazz",
      "blues",
      "reggae",
      "folk",
      "latin",
      "metal",
      "classical",
      "funk",
      "indie"
    ]
  },
  country: { 
    type: String 
  },
  premium: { 
    type: Boolean, 
    default: false 
  },
});

export default mongoose.model('User', UserSchema);
