const rateLimit = new Map();

export function checkRateLimit(ip, limit = 50, windowMs = 60000) {
  const now = Date.now();
  const userData = rateLimit.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > userData.resetTime) {
    userData.count = 1;
    userData.resetTime = now + windowMs;
  } else {
    userData.count++;
  }

  rateLimit.set(ip, userData);

  // Periodic cleanup logic could be added, but since serverless instances reset often, it's generally okay.
  return userData.count <= limit;
}
