import connectToDatabase from '@/lib/mongodb';
import RateLimit from '@/models/RateLimit';

export async function checkRateLimit(ip, limit = 50, windowMs = 60000, action = 'general') {
  try {
    await connectToDatabase();
    const now = new Date();
    
    let record = await RateLimit.findOne({ ip, action });
    
    if (!record || now > record.resetTime) {
      // Reset window or create new record
      record = await RateLimit.findOneAndUpdate(
        { ip, action },
        {
          $set: {
            count: 1,
            resetTime: new Date(now.getTime() + windowMs)
          }
        },
        { upsert: true, new: true }
      );
    } else {
      // Within window, increment count
      record = await RateLimit.findOneAndUpdate(
        { ip, action },
        { $inc: { count: 1 } },
        { new: true }
      );
    }

    return record.count <= limit;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open: if DB is down, allow the request to proceed
    return true;
  }
}
