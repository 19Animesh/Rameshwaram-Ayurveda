/**
 * sync-db-images.js
 * 
 * The DB stores image paths like: /images/product/BRAHMI-VATI.jpg
 * But the actual files are:        /images/product/BRAHMI-VATI_13.jpg
 * 
 * This script:
 * 1. Reads all real image files from public/images/product/
 * 2. Builds a lookup: base-name (no suffix) → real file path
 * 3. For each product in the DB, finds the matching real file
 * 4. Updates the DB with the correct path
 * 
 * Run: node scripts/sync-db-images.js
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const IMAGE_DIR = path.join(__dirname, '..', 'public', 'images', 'product');

// Strip quantity suffix: "BRAHMI-VATI_13.jpg" → "BRAHMI-VATI"
function getBaseName(filename) {
  const noExt = filename.replace(/\.[^.]+$/, ''); // remove extension
  return noExt.replace(/_\d+$/, '').toUpperCase(); // remove _12 / _03 etc and uppercase
}

async function connectWithRetry(maxAttempts = 5) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      console.log(`  DB attempt ${i}/${maxAttempts} — waking up Neon...`);
      if (i < maxAttempts) await new Promise(r => setTimeout(r, 3000));
    }
  }
  return false;
}

async function main() {
  console.log('\n============================================');
  console.log('  SYNC IMAGE PATHS TO DATABASE');
  console.log('============================================\n');

  // ── Step 1: Build real-file lookup ──────────────────────────────────
  const files = fs.readdirSync(IMAGE_DIR);
  console.log(`📁 Found ${files.length} image files in public/images/product/\n`);

  // Map: BASNAME → [ /images/product/FILENAME.ext, ... ]
  // Multiple files can share the same base name (e.g. different quantities)
  const fileMap = {};
  for (const file of files) {
    const base = getBaseName(file); // e.g. "BRAHMI-VATI"
    const webPath = `/images/product/${file}`;
    if (!fileMap[base]) fileMap[base] = [];
    fileMap[base].push(webPath);
  }

  // ── Step 2: Connect DB ───────────────────────────────────────────────
  console.log('⏳ Connecting to database...');
  const ok = await connectWithRetry();
  if (!ok) {
    console.error('❌ Could not connect to database. Check .env DATABASE_URL');
    process.exit(1);
  }
  console.log('✅ Connected!\n');

  // ── Step 3: Query all products ───────────────────────────────────────
  const products = await prisma.product.findMany({
    select: { id: true, name: true, image: true },
  });
  console.log(`📦 Products in DB: ${products.length}\n`);

  let updated = 0, alreadyGood = 0, noMatch = 0;
  const noMatchList = [];

  for (const p of products) {
    const currentImage = p.image || '';

    // If already a valid local path that exists, skip
    if (currentImage.startsWith('/images/product/')) {
      const filePath = path.join(__dirname, '..', 'public', currentImage);
      if (fs.existsSync(filePath)) {
        alreadyGood++;
        continue;
      }
    }

    // Try to find a matching real file
    // Extract base name from the stored image path
    const storedFilename = currentImage.split('/').pop(); // e.g. "BRAHMI-VATI.jpg"
    const storedBase = getBaseName(storedFilename);      // e.g. "BRAHMI-VATI"

    // Also try matching by product name directly
    const nameBase = p.name.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');

    let matched = fileMap[storedBase] || fileMap[nameBase] || null;

    if (!matched) {
      // Fuzzy: try partial match (first 8 chars)
      const prefix = storedBase.substring(0, 8);
      for (const key of Object.keys(fileMap)) {
        if (key.startsWith(prefix)) {
          matched = fileMap[key];
          break;
        }
      }
    }

    if (matched && matched[0] !== currentImage) {
      // Use first match (prefer .webp if available, else first)
      const preferred = matched.find(f => f.endsWith('.webp')) || matched[0];
      await prisma.product.update({
        where: { id: p.id },
        data: { image: preferred },
      });
      updated++;
    } else if (!matched) {
      noMatch++;
      noMatchList.push({ name: p.name, storedBase, nameBase });
    } else {
      alreadyGood++;
    }
  }

  console.log(`✅ Updated:      ${updated} products`);
  console.log(`⏭️  Already OK:  ${alreadyGood} products`);
  console.log(`❓ No match:    ${noMatch} products`);

  if (noMatchList.length > 0 && noMatchList.length <= 30) {
    console.log('\nProducts with no image match:');
    noMatchList.forEach(p => console.log(`  - ${p.name} (tried: ${p.storedBase}, ${p.nameBase})`));
  }

  console.log('\n============================================');
  console.log('  DONE! Restart your dev server to see changes.');
  console.log('============================================\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
