import mongoose from 'mongoose';
import BaseSchema from './base.js';

const LikeSchema = new mongoose.Schema({
  ...BaseSchema.obj,
  
  review_id: {
    type: String,
    required: true,
    ref: 'Review',
    index: true
  },
  
  user_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true
  }
}, {
  versionKey: false
});

// Índice compuesto para evitar likes duplicados
LikeSchema.index({ review_id: 1, user_id: 1 }, { unique: true });
LikeSchema.index({ review_id: 1 });
LikeSchema.index({ user_id: 1 });

export default mongoose.model('Like', LikeSchema);


