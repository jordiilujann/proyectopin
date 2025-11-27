import mongoose from 'mongoose';
import BaseSchema from './base.js';

const FollowSchema = new mongoose.Schema({
  ...BaseSchema.obj,

  // Usuario que sigue
  follower_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true,
  },

  // Usuario seguido
  following_id: {
    type: String,
    required: true,
    ref: 'User',
    index: true,
  },
}, {
  versionKey: false,
});

// Un usuario no puede seguir dos veces al mismo
FollowSchema.index(
  { follower_id: 1, following_id: 1 },
  { unique: true }
);

export default mongoose.model('Follow', FollowSchema);
