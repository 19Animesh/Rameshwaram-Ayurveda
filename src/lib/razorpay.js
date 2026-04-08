import Razorpay from 'razorpay';

// ⚠️  Server-side only — never import this in client components
// RAZORPAY_KEY_SECRET must NEVER have the NEXT_PUBLIC_ prefix
export const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});
