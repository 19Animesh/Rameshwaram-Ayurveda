/**
 * sync-images-to-db.js
 * Updates all Product rows in SQLite to use the image path from the JS catalog.
 */
const { PrismaClient } = require('@prisma/client');
const catalog = require('../src/data/product-catalog.js');

const prisma = new PrismaClient();

async function main() {
  // Build a quick lookup: product name (uppercase) -> image path
  // Also try brand+name for disambiguation
  const catalogMap = {};
  for (const item of catalog) {
    if (!item.image) continue;
    const key = item.name.toUpperCase();
    const keyWithBrand = `${item.brand.toUpperCase()}::${item.name.toUpperCase()}`;
    catalogMap[key] = item.image;
    catalogMap[keyWithBrand] = item.image;
  }

  // Fetch all products from DB
  const products = await prisma.product.findMany({ select: { id: true, name: true, brand: true, image: true } });
  console.log(`Total products in DB: ${products.length}`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const p of products) {
    const keyWithBrand = `${p.brand.toUpperCase()}::${p.name.toUpperCase()}`;
    const keyName = p.name.toUpperCase();
    const newImage = catalogMap[keyWithBrand] || catalogMap[keyName];

    if (newImage && newImage !== p.image) {
      await prisma.product.update({
        where: { id: p.id },
        data: { image: newImage }
      });
      updated++;
    } else if (newImage) {
      skipped++; // already up to date
    } else {
      notFound++;
      // Keep existing value (could be placeholder or already set)
    }
  }

  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Already correct: ${skipped}`);
  console.log(`❓ No match in catalog: ${notFound}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
