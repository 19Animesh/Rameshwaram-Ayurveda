/**
 * DEFINITIVE image path fix:
 * 1. Gets all actual image files from public/images/product/
 * 2. For each product in DB, finds the best matching actual file
 * 3. Updates DB with /images/product/<ActualFile>
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const imgDir = path.join(__dirname, '..', 'public', 'images', 'product');

function norm(str) {
  return str
    .toLowerCase()
    .replace(/\.(jpg|jpeg|png|webp|gif|pngg)$/i, '')
    .replace(/[\s\-_\.]/g, '');
}

async function main() {
  const files = fs.readdirSync(imgDir);
  
  // Map: normalized → exact filename
  const fileNormMap = new Map();
  files.forEach(f => fileNormMap.set(norm(f), f));
  
  console.log(`Files available: ${files.length}`);

  const products = await prisma.product.findMany({
    select: { id: true, name: true, image: true }
  });

  let updated = 0;
  let noMatch = 0;
  const noMatchList = [];

  for (const prod of products) {
    const currentBase = path.basename(prod.image || '');
    const normCurrent = norm(currentBase);
    const normName = norm(prod.name);

    // Priority 1: exact match on current filename
    let found = fileNormMap.get(normCurrent);

    // Priority 2: match by product name
    if (!found) found = fileNormMap.get(normName);

    // Priority 3: partial prefix match (first 6–10 chars of product name)
    if (!found) {
      const prefix6 = normName.slice(0, 6);
      const prefix10 = normName.slice(0, 10);
      for (const [k, v] of fileNormMap.entries()) {
        if (k.startsWith(prefix10) || prefix10.startsWith(k.slice(0, 8))) {
          found = v;
          break;
        }
        if (!found && (k.startsWith(prefix6) || prefix6.startsWith(k.slice(0, 5)))) {
          found = v;
          // Don't break — keep looking for longer match
        }
      }
    }

    if (found) {
      const newPath = `/images/product/${found}`;
      if (newPath !== prod.image) {
        await prisma.product.update({ where: { id: prod.id }, data: { image: newPath } });
        updated++;
      }
    } else {
      noMatch++;
      noMatchList.push(prod.name);
    }
  }

  console.log(`\n✅ Updated: ${updated} products`);
  console.log(`⚠️  No match: ${noMatch} products`);
  if (noMatchList.length > 0) {
    console.log('\nProducts without matching image:');
    noMatchList.slice(0, 20).forEach(n => console.log(' -', n));
  }

  const samples = await prisma.product.findMany({ take: 8, select: { name: true, image: true } });
  console.log('\n📸 Sample paths after fix:');
  samples.forEach(s => console.log(`  ${s.name} → ${s.image}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
