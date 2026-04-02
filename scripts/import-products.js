/**
 * FAST Bulk import — uses createMany in batches of 50
 * Run: node scripts/import-products.js
 */
// Load .env manually
const fs = require('fs');
const path = require('path');

// Parse .env file manually
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^"|"$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
});

// Fix the connection URL — remove channel_binding which breaks standalone node
const rawUrl = process.env.DATABASE_URL || '';
process.env.DATABASE_URL = rawUrl.replace('&channel_binding=require', '').replace('?channel_binding=require&', '?');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '../src/data/products.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const products = JSON.parse(raw);

  console.log(`📦 Found ${products.length} products to import...`);

  // Step 1: Clear existing data (FK order: orderItems → variants → products)
  console.log('🗑️  Clearing existing data...');
  try { await prisma.orderItem.deleteMany({}); } catch {}
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  console.log('✅ Cleared.');

  // Step 2: Prepare product records
  const productRecords = products.map(p => {
    // expiryDate is a String field in schema — keep it as plain string
    let expiryDate = '2028-12-31';
    if (p.expiryDate) {
      const d = new Date(p.expiryDate);
      expiryDate = isNaN(d.getTime()) ? '2028-12-31' : p.expiryDate.slice(0, 10);
    }
    return {
      id: String(p.id),
      name: String(p.name || 'Unknown'),
      brand: String(p.brand || 'Unknown'),
      category: String(p.category || 'general-wellness'),
      description: String(p.description || ''),
      price: Number(p.price) || 0,
      originalPrice: Number(p.originalPrice) || Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      rating: Number(p.rating) || 4.0,
      reviewCount: Number(p.reviewCount) || 0,
      image: String(p.image || ''),
      featured: p.featured === true,
      dosage: String(p.dosage || ''),
      howToConsume: String(p.howToConsume || ''),
      sideEffects: String(p.sideEffects || ''),
      expiryDate,
    };
  });

  // Step 3: Insert products in batches of 50
  const BATCH = 50;
  for (let i = 0; i < productRecords.length; i += BATCH) {
    const batch = productRecords.slice(i, i + BATCH);
    await prisma.product.createMany({ data: batch, skipDuplicates: true });
    process.stdout.write(`\r📤 Products: ${Math.min(i + BATCH, productRecords.length)}/${productRecords.length}`);
  }
  console.log('\n✅ Products inserted.');

  // Step 4: Insert variants in batches
  const variantRecords = [];
  for (const p of products) {
    if (p.variants && p.variants.length > 0) {
      for (const v of p.variants) {
        variantRecords.push({
          productId: String(p.id),
          label: String(v.label || 'Standard'),
          price: Number(v.price) || Number(p.price) || 0,
          originalPrice: Number(v.originalPrice) || Number(p.originalPrice) || 0,
          stock: Number(v.stock) || 0,
        });
      }
    }
  }

  for (let i = 0; i < variantRecords.length; i += BATCH) {
    const batch = variantRecords.slice(i, i + BATCH);
    await prisma.productVariant.createMany({ data: batch, skipDuplicates: true });
    process.stdout.write(`\r📤 Variants: ${Math.min(i + BATCH, variantRecords.length)}/${variantRecords.length}`);
  }
  console.log('\n✅ Variants inserted.');

  // Verify
  const total = await prisma.product.count();
  const variantTotal = await prisma.productVariant.count();
  const featured = await prisma.product.count({ where: { featured: true } });
  console.log(`\n📊 Final DB count:`);
  console.log(`   Products: ${total}`);
  console.log(`   Variants: ${variantTotal}`);
  console.log(`   Featured: ${featured}`);
}

main()
  .catch(e => {
    console.error('\n💥 Import failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
