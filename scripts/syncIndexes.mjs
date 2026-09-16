/**
 * scripts/syncIndexes.mjs — create the database indexes declared in the models.
 *
 * RUN ONCE after deploying (and again whenever a model gains a new index):
 *     npm run db:indexes
 *
 * WHY
 * ---
 * Product, Order and PendingOrder turn off automatic index creation in
 * production, so building indexes does not slow every serverless cold start.
 * Until this runs against the live database, those indexes do not exist:
 * duplicate products (same name + brand) are not blocked, catalogue and order
 * queries scan whole collections, and abandoned checkouts are never deleted.
 *
 * SAFE TO RE-RUN. It only creates indexes that are missing (createIndexes). It
 * never drops an index, unlike Mongoose's syncIndexes(), which removes any
 * index not declared in code, including ones you may have added in Atlas.
 *
 * Uses MONGODB_URI from .env. To target production from your computer, run it
 * with the production connection string in MONGODB_URI.
 */
import 'dotenv/config';
import mongoose from 'mongoose';

// Keep Mongoose from also building indexes in the background on connect;
// this script creates them explicitly and reports the result.
process.env.NODE_ENV = 'production';

const MODEL_FILES = ['Product', 'Order', 'PendingOrder', 'Address'];

async function loadModels() {
  const models = [];
  for (const name of MODEL_FILES) {
    try {
      const mod = await import(`../src/models/${name}.js`);
      models.push(mod.default);
    } catch (err) {
      if (/Cannot use import statement|Unexpected token 'export'/.test(err?.message || '')) {
        console.error(
          `\nThis script needs Node.js 20.19+ or 22.12+ (you have ${process.version}).\n` +
            'Update Node, or run:  node --experimental-detect-module scripts/syncIndexes.mjs\n'
        );
        process.exit(1);
      }
      throw err;
    }
  }
  return models;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Add it to .env (or your shell) and try again.');
    process.exit(1);
  }

  const models = await loadModels();

  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  }
  console.log(`Connected to database "${mongoose.connection.name}".\n`);

  let failures = 0;
  for (const Model of models) {
    try {
      await Model.createIndexes();
      const indexes = await Model.collection.indexes();
      console.log(`✓ ${Model.modelName}: ${indexes.map((i) => i.name).join(', ')}`);
    } catch (err) {
      failures += 1;
      console.error(`✗ ${Model.modelName}: ${err.message}`);
      if (err?.code === 11000 || /duplicate key/i.test(err?.message || '')) {
        console.error(
          '  Existing documents break a unique rule (for products: two with the same name and brand ID).\n' +
            '  Rename or remove the duplicates, then run this again.'
        );
      }
    }
  }

  await mongoose.disconnect();
  console.log(failures ? `\nFinished with ${failures} problem(s).` : '\nAll indexes are in place.');
  process.exit(failures ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
