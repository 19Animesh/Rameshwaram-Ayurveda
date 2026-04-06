import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  emailOrPhone: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.OTP || mongoose.model('OTP', otpSchema);
