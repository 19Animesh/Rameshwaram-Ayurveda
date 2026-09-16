/**
 * src/lib/mongodb.js
 * Cached Mongoose connection for a serverless environment.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * 1. `bufferCommands: false` was removed. With it enabled, any query issued
 *    while the connection is still being established throws immediately rather
 *    than waiting. On Vercel every cold start is a race, which produced
 *    intermittent 500s that were impossible to reproduce locally.
 *
 * 2. Explicit timeouts were added. Without `serverSelectionTimeoutMS`, a DNS
 *    or network hiccup hangs for the driver default (30s) and the function
 *    times out with no error to read. The build log showed exactly this:
 *    `querySrv ENOTFOUND _mongodb._tcp.<cluster>.mongodb.net`.
 *
 * 3. A failed connection promise is now cleared AND the next call retries,
 *    so one transient DNS failure no longer poisons the whole warm instance.
 *
 * 4. Errors carry an actionable message naming the most common Atlas causes.
 */
import mongoose from 'mongoose';
import { reportEnvStatus } from '@/lib/env';

reportEnvStatus();

/** Reused across hot reloads in dev and across warm invocations in production. */
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/** Turns driver errors into something a human can act on. */
function describeConnectionError(err) {
  const code = err?.code || err?.codeName || '';
  const msg = err?.message || String(err);

  if (code === 'ENOTFOUND' || msg.includes('querySrv')) {
    return (
      'Could not resolve the MongoDB Atlas hostname. Usually one of: ' +
      'the cluster was renamed/deleted, MONGODB_URI has a typo, or the network ' +
      'blocks SRV (DNS) lookups. If SRV is blocked, use the non-SRV connection ' +
      'string (mongodb:// with explicit hosts) from Atlas -> Connect.'
    );
  }
  if (msg.includes('bad auth') || msg.includes('Authentication failed')) {
    return 'MongoDB rejected the credentials in MONGODB_URI. Check the database user and password (special characters must be URL-encoded).';
  }
  if (msg.includes('IP') || msg.includes('whitelist') || msg.includes('not allowed')) {
    return 'This server IP is not allowed by Atlas. Vercel uses rotating IPs, so Network Access must include 0.0.0.0/0.';
  }
  if (msg.includes('timed out') || msg.includes('ETIMEDOUT')) {
    return 'Timed out reaching MongoDB. The cluster may be paused (Atlas M0 auto-pauses when idle) or unreachable from this network.';
  }
  return msg;
}

async function connectToDatabase() {
  // Read per-call rather than at module load. If the variable is read once when
  // this file is first imported, a .env that Next.js loads slightly later (or a
  // dev server started before the file existed) leaves it permanently undefined
  // for the life of the process.
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Create a file named exactly `.env` in the same ' +
        'folder as package.json (on Windows, check it is not saved as `.env.txt`), ' +
        'add MONGODB_URI=..., then restart the dev server. In production, set it ' +
        'under Settings -> Environment Variables in Vercel and redeploy.'
    );
  }

  if (cached.conn && cached.conn.connection?.readyState === 1) {
    return cached.conn;
  }

  // A stale/disconnected cached connection should not be reused.
  if (cached.conn) {
    cached.conn = null;
    cached.promise = null;
  }

  // mongodb+srv://user:pass@host/<dbname>?opts — an empty <dbname> silently
  // routes every query to a database called "test", which is a confusing way
  // to find an empty catalogue.
  if (/mongodb(\+srv)?:\/\/[^/]+\/(\?|$)/.test(MONGODB_URI)) {
    console.warn(
      '[db] MONGODB_URI has no database name — Mongoose will use "test". ' +
        'Add the name before the "?", e.g. .../rameshwaram?retryWrites=true'
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        // Fail fast and visibly instead of hanging until the function times out.
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        // Serverless functions are single-request; a large pool wastes Atlas
        // connection slots, which matters a lot on the free (M0) tier.
        maxPoolSize: 10,
        minPoolSize: 0,
        maxIdleTimeMS: 30000,
        retryWrites: true,
      })
      .then((m) => {
        console.info('[db] MongoDB connected');
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    // Clear the failed promise so the next request gets a fresh attempt
    // rather than replaying the same rejection for the life of the instance.
    cached.promise = null;
    cached.conn = null;

    const detail = describeConnectionError(err);
    console.error('[db] MongoDB connection failed:', detail, err);

    const wrapped = new Error(`Database connection failed. ${detail}`);
    wrapped.cause = err;
    wrapped.isConnectionError = true;
    throw wrapped;
  }
}

export default connectToDatabase;
