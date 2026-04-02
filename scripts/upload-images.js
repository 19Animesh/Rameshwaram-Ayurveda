// scripts/upload-images.js
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// We must manually import cloudinary since ES module might conflict in a node script
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

const BRAND_MAPPING = {
  "01": "ARYA VAIDYA SALA",
  "02": "AVN AYURVEDA",
  "03": "AVP",
  "04": "BAIDYANATH",
  "05": "BIORESURGE",
  "06": "DHOOTAPAPESHWAR", // Merged uppercase
  "07": "Flora",
  "08": "HIMALAYA",
  "09": "KOTTAKKAL",
  "10": "MAHARISHI",
  "11": "NAGARJUNA",
  "12": "SDM",
  "13": "SHREE DHANWANTRI",
  "14": "SKM SIDDHA",
  "15": "SOLUMIKS",
  "16": "TYNOR",
  "17": "TYNOR ORTHOTICS",
  "18": "VASU HEALTHCARE",
  "19": "Vaidya Ratnam",
  "20": "DABUR",
  "21": "ZANDU",
  "22": "ZOETIC",
  "23": "PATANJALI",
  "24": "DIVYA PHARMACY",
  "25": "SG PYTHO PHARMA",
  "26": "CHARAK PHARMA",
  "27": "Others"
};

async function uploadImages() {
  const imagesDir = path.join(__dirname, '../public/images/product');

  if (!fs.existsSync(imagesDir)) {
    console.log('❌ Directory does not exist:', imagesDir);
    return;
  }

  const files = fs.readdirSync(imagesDir);
  console.log(`📂 Found ${files.length} images in folder. Starting sync...\n`);

  let successCount = 0;
  let skipCount = 0;

  for (const file of files) {
    // Only process images
    if (!file.match(/\.(jpg|jpeg|png|webp|avif)$/i)) continue;

    const ext = path.extname(file);
    const basename = path.basename(file, ext); // e.g., "BRAHMI-VATI_04"

    let searchName = '';
    let brand = null;
    let products = [];

    // 1. Did the user provide a Company ID tag? (e.g. BRAHMI-VATI_04)
    const parts = basename.split('_');
    if (parts.length >= 2) {
      const companyId = parts.pop();
      searchName = parts.join('_').replace(/-/g, ' ');
      brand = BRAND_MAPPING[companyId];
      
      if (!brand) {
        console.log(`⚠️ Skipping ${file}: Invalid Company ID '${companyId}'`);
        skipCount++;
        continue;
      }

      console.log(`\n🔍 Searching DB via Tag: [${searchName}] by [${brand}]`);
      products = await prisma.product.findMany({
        where: {
          name: { equals: searchName, mode: 'insensitive' },
          brand: { equals: brand, mode: 'insensitive' }
        }
      });
    } else {
      // 2. No ID tag provided? SMART FALLBACK!
      searchName = basename.replace(/-/g, ' ');
      console.log(`\n🔍 Smart Fallback Search: [${searchName}] (No ID Tag)`);
      
      products = await prisma.product.findMany({
        where: {
          name: { equals: searchName, mode: 'insensitive' }
        }
      });
    }

    if (products.length === 0) {
      console.log(`❌ Not Found: Could not find any product matching '${searchName}'`);
      skipCount++;
      continue;
    }

    if (products.length > 1) {
      console.log(`⚠️ Ambiguous Match for ${file}: Found ${products.length} different companies selling '${searchName}'. YOU MUST rename this file using a Company ID tag (e.g., _04)!`);
      skipCount++;
      continue;
    }

    const product = products[0];
    console.log(`✅ Safe Match Found: ${product.name} (${product.brand}). Uploading to Cloudinary...`);



    // 3. Upload to Cloudinary
    try {
      const filePath = path.join(imagesDir, file);
      const uploadResponse = await cloudinary.uploader.upload(filePath, {
        folder: 'ayurveda_products',
        resource_type: 'auto',
      });

      console.log(`☁️ Uploaded! New Cloudinary link: ${uploadResponse.secure_url}`);

      // 4. Update the Neon Database!
      await prisma.product.update({
        where: { id: product.id },
        data: { image: uploadResponse.secure_url }
      });

      console.log(`💾 Database Updated! ${file} successfully synchronized.`);
      successCount++;

    } catch (err) {
      console.log(`❌ Upload failed for ${file}:`, err.message);
    }
  }

  console.log(`\n🎉 Sync Complete! Successfully uploaded ${successCount} images. (Skipped ${skipCount})`);
}

uploadImages()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
