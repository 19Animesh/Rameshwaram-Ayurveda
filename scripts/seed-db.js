const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log("Reading products.json...");
  const dataPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log("Clearing existing products in DB to avoid duplicates...");
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  console.log(`Migrating ${products.length} products to SQLite DB...`);

  for (const p of products) {
    // Determine the main product specs (if it has variants, we use those, otherwise we just map what we have)
    const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
    
    // Create the Product record
    const createdProduct = await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        description: p.description || p.name,
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        originalPrice: p.originalPrice || 0,
        price: p.price || 0,
        stock: p.stock || 0,
        expiryDate: p.expiryDate || new Date().toISOString(),
        dosage: p.dosage || 'As directed by physician.',
        howToConsume: p.howToConsume || 'With warm water.',
        sideEffects: p.sideEffects || 'None reported.',
        image: p.image || `/images/${p.id}.jpg`
      }
    });

    // If there are variants (sizes), insert them
    if (hasVariants) {
      const variantData = p.variants.map((v) => ({
        productId: createdProduct.id,
        label: v.label,
        price: v.price || p.price,
        originalPrice: v.originalPrice || p.originalPrice,
        stock: v.stock || p.stock || 50
      }));

      await Promise.all(variantData.map(v => 
        prisma.productVariant.create({ data: v })
      ));
    }
  }

  console.log("✅ Seed completed successfully! All products migrated to SQLite.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
