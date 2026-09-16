import mongoose from 'mongoose';

const rateLimitSchema = new mongoose.Schema({
  ip: { type: String, required: true, index: true },
  action: { type: String, required: true },
  count: { type: Number, default: 1 },
  // TTL index to automatically delete records after they expire.
  // We'll set the expires dynamically in the code by updating this field.
  resetTime: { type: Date, required: true, index: { expires: 0 } },
});

// Compound index for fast lookup
rateLimitSchema.index({ ip: 1, action: 1 }, { unique: true });

export default mongoose.models.RateLimit || mongoose.model('RateLimit', rateLimitSchema);
