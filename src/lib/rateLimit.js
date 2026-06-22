import connectToDatabase from '@/lib/mongodb';
import RateLimit from '@/models/RateLimit';

/**
 * In-memory fallback rate limiter used when MongoDB is unavailable.
 * Prevents the rate limiter from "failing open" during DB outages.
 * Uses a simple Map with TTL — resets on server restart (acceptable trade-off).
 */
const memoryStore = new Map();

function memoryRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return true; // within limit
  }

  entry.count += 1;
  return entry.count <= limit;
}

export async function checkRateLimit(identifier, limit = 50, windowMs = 60000, action = 'general') {
  // Composite key: action + identifier (IP or phone)
  const key = `${action}:${identifier}`;

  try {
    await connectToDatabase();
    const now = new Date();

    let record = await RateLimit.findOne({ ip: identifier, action });

    if (!record || now > record.resetTime) {
      // Reset window or create new record
      record = await RateLimit.findOneAndUpdate(
        { ip: identifier, action },
        {
          $set: {
            count: 1,
            resetTime: new Date(now.getTime() + windowMs),
          },
        },
        { upsert: true, new: true }
      );
    } else {
      // Within window, increment count
      record = await RateLimit.findOneAndUpdate(
        { ip: identifier, action },
        { $inc: { count: 1 } },
        { new: true }
      );
    }

    return record.count <= limit;
  } catch (error) {
    console.error('[rateLimit] MongoDB unavailable — falling back to in-memory limiter:', error.message);
    // Fail CLOSED with in-memory limiter (not open) — prevents brute-force during DB outages
    return memoryRateLimit(key, limit, windowMs);
  }
}
