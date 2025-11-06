import mongoose from 'mongoose';
import crypto from 'crypto';

function generateRandomId(length = 20) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

// Schema base
const BaseSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => generateRandomId(20),
    },
    created_at: {
      type: Date,
      default: () => new Date()
    },
  },
  {
    _id: false,        
    versionKey: false,   
    timestamps: false,   
  }
);

export default BaseSchema;
