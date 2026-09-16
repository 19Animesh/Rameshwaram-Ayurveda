import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  // Optional: accounts are OTP-only. Older accounts may still have a hash.
  passwordHash: { type: String },
  role: { type: String, default: 'user' },
  isPhoneVerified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);
