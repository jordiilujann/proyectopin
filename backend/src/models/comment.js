// src/models/comment.model.js
import mongoose from 'mongoose';
import BaseSchema from './base.model.js';

const CommentSchema = new mongoose.Schema({
  ...BaseSchema.obj, // _id (20 chars) + created_at

  review_id: {
    type: String,
    required: true,
    index: true
  },

  user_id: {
    type: String,
    required: true,
    index: true
  },

  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },

  likes: {
    type: Number,
    default: 0
  }

}, { versionKey: false });

CommentSchema.index({ review_id: 1, created_at: 1 });

export default mongoose.model('Comment', CommentSchema);
