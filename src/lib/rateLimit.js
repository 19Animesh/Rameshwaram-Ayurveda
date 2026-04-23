import connectToDatabase from '@/lib/mongodb';
import RateLimit from '@/models/RateLimit';

export async function checkRateLimit(ip, limit = 50, windowMs = 60000, action = 'general') {
  try {
    await connectToDatabase();
    const now = new Date();
    
    // Find or create the rate limit record for this IP and action
    const record = await RateLimit.findOneAndUpdate(
      { ip, action },
      {
        $setOnInsert: { resetTime: new Date(now.getTime() + windowMs) },
        $inc: { count: 1 }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // If the reset time has passed, reset the counter (failsafe if TTL lags)
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = new Date(now.getTime() + windowMs);
      await record.save();
    }

    return record.count <= limit;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open: if DB is down, allow the request to proceed
    return true;
  }
}
