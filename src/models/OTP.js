import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  emailOrPhone: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  used: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.OTP || mongoose.model('OTP', otpSchema);
