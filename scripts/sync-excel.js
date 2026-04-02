const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

const BRAND_MAPPING = {
  "ARYA VAIDYA SALA": "01",
  "AVN AYURVEDA": "02",
  "AVP": "03",
  "BAIDYANATH": "04",
  "BIORESURGE": "05",
  "DHOOTAPAPESHWAR": "06",
  "FLORA": "07",
  "HIMALAYA": "08",
  "KOTTAKKAL": "09",
  "MAHARISHI": "10",
  "NAGARJUNA": "11",
  "SDM": "12",
  "SHREE DHANWANTRI": "13",
  "SKM SIDDHA": "14",
  "SOLUMIKS": "15",
  "TYNOR": "16",
  "TYNOR ORTHOTICS": "17",
  "VASU HEALTHCARE": "18",
  "VAIDYA RATNAM": "19",
  "DABUR": "20",
  "ZANDU": "21",
  "ZOETIC": "22",
  "PATANJALI": "23",
  "DIVYA PHARMACY": "24",
  "SG PYTHO PHARMA": "25",
  "CHARAK PHARMA": "26",
  "OTHERS": "27"
};

function getBrandId(brandName) {
  if (!brandName) return "99";
  const upper = brandName.toString().trim().toUpperCase();
  return BRAND_MAPPING[upper] || "99";
}

async function syncExcel() {
  console.log("🚀 Starting Bulk Excel Synchronization...");

  // 1. Memory Backup
  const existingProducts = await prisma.product.findMany();
  console.log(`📦 Found ${existingProducts.length} existing products in DB.`);

  const imageMap = new Map();
  for (const p of existingProducts) {
    if (p.image && !p.image.includes('placeholder.jpg') && p.image !== '') {
      // Normalize name for robust matching
      const key = p.name.trim().toLowerCase();
      imageMap.set(key, p.image);
    }
  }
  console.log(`💾 Memorized ${imageMap.size} valid Cloudinary photo URLs.`);

  // 2. The Purge
  console.log("🚨 Wiping the existing Product catalog...");
  await prisma.product.deleteMany({});
  console.log("🗑️ Database wiped clean!");

  // 3. The Parse
  console.log("📂 Reading catalog.xlsx.xlsx...");
  const workbook = xlsx.readFile('catalog.xlsx.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);
  
  console.log(`📑 Found ${rows.length} rows to inject.`);

  // 4. The Injection
  let inserted = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const rawName = row['Product Name'] || 'Unknown Product';
      const rawBrand = row['Company Name'] || 'Unknown Brand';
      const rawPrice = Number(row['Price']) || 0;

      const normNameForImage = rawName.trim().toLowerCase();
      const preservedImage = imageMap.get(normNameForImage) || '';

      const baseIdName = rawName.toString().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15);
      const brandId = getBrandId(rawBrand);
      
      // Ensure completely unique IDs using a small random hash if necessary to avoid dupe collisions
      const randomSuffix = Math.floor(Math.random() * 9999);
      const newId = `${baseIdName}_${brandId}_${randomSuffix}`;

      await prisma.product.create({
        data: {
          id: newId,
          name: rawName.toString().trim(),
          brand: rawBrand.toString().trim(),
          price: rawPrice,
          originalPrice: rawPrice * 1.2, // Simulate modest MRP discount
          category: 'wellness', // Default category
          description: `${rawName} by ${rawBrand} is available on Rameshwaram Ayurveda.`,
          rating: 4.5,
          reviewCount: Math.floor(Math.random() * 50) + 5,
          stock: 50,
          expiryDate: '2028-01-01',
          dosage: 'As directed by physician',
          howToConsume: 'Take with warm water',
          sideEffects: 'None reported if taken correctly',
          image: preservedImage || '/images/placeholder.jpg'
        }
      });
      inserted++;
      process.stdout.write(`\r✅ Injected: ${inserted} / ${rows.length}`);
    } catch (err) {
      console.error(`\n❌ Error injecting row:`, row, err.message);
      errors++;
    }
  }

  console.log(`\n\n🎉 SYNCHRONIZATION COMPLETE!`);
  console.log(`✅ Successfully injected: ${inserted}`);
  if (errors > 0) console.log(`❌ Errors: ${errors}`);
  console.log(`🖼️ Photos successfully preserved from previous DB: ${imageMap.size}`);
}

syncExcel()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
