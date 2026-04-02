const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../src/data/product-catalog.js');
const imageDir = path.join(__dirname, '../public/images/product');
const outputLog = path.join(__dirname, '../tmp-image-match-log.txt');

// Read all image files
const imageFiles = fs.readdirSync(imageDir);

// Normalize: uppercase, remove all non-alpha chars 
function norm(str) {
  return str.toUpperCase().replace(/[^A-Z]/g, '');
}

// Build image lookup: normalized -> filename
const imageByNorm = {};
for (const file of imageFiles) {
  const ext = path.extname(file);
  const base = path.basename(file, ext);
  const key = norm(base);
  // keep shortest match (prefer more specific)
  if (!imageByNorm[key] || file.length < imageByNorm[key].length) {
    imageByNorm[key] = file;
  }
}

// Read catalog
const products = require(catalogPath);

let matched = 0;
const unmatched = [];
const matchLog = [];

for (const product of products) {
  const pNorm = norm(product.name);
  
  // 1. Exact match
  let imageFile = imageByNorm[pNorm];
  let method = 'exact';

  // 2. Image norm starts with product norm (product name is prefix of image)
  if (!imageFile) {
    for (const [imgNorm, file] of Object.entries(imageByNorm)) {
      if (imgNorm.startsWith(pNorm) && pNorm.length >= 6) {
        imageFile = file;
        method = 'imgStartsWith-product';
        break;
      }
    }
  }

  // 3. Product norm starts with image norm (image name is prefix of product)
  if (!imageFile) {
    for (const [imgNorm, file] of Object.entries(imageByNorm)) {
      if (pNorm.startsWith(imgNorm) && imgNorm.length >= 6) {
        imageFile = file;
        method = 'productStartsWith-img';
        break;
      }
    }
  }

  // 4. Longest common prefix >= 8 chars
  if (!imageFile) {
    let bestLen = 7;
    let bestFile = null;
    for (const [imgNorm, file] of Object.entries(imageByNorm)) {
      let len = 0;
      while (len < pNorm.length && len < imgNorm.length && pNorm[len] === imgNorm[len]) len++;
      if (len > bestLen) {
        bestLen = len;
        bestFile = file;
      }
    }
    if (bestFile) {
      imageFile = bestFile;
      method = `prefix-${bestLen}`;
    }
  }

  if (imageFile) {
    product._matchedImage = `/images/product/${imageFile}`;
    product._matchMethod = method;
    matched++;
    matchLog.push(`✅ [${method}] "${product.name}" => ${imageFile}`);
  } else {
    unmatched.push(product.name);
    matchLog.push(`❌ UNMATCHED: "${product.name}"`);
  }
}

// Write log
fs.writeFileSync(outputLog, matchLog.join('\n'), 'utf8');

console.log(`Matched: ${matched}/${products.length}`);
console.log(`Unmatched: ${unmatched.length}`);
console.log(`Log written to tmp-image-match-log.txt`);

// Rewrite catalog
let newContent = '// Product catalog imported from Excel sheet\n';
newContent += '// To add more: add entries here, then run: node scripts/generate-products.js\n\n';
newContent += 'module.exports = [\n';

for (let i = 0; i < products.length; i++) {
  const p = products[i];
  const image = p._matchedImage || null;
  delete p._matchedImage;
  delete p._matchMethod;

  newContent += '  {\n';
  newContent += `    "name": ${JSON.stringify(p.name)},\n`;
  newContent += `    "brand": ${JSON.stringify(p.brand)},\n`;
  newContent += `    "category": ${JSON.stringify(p.category)},\n`;
  if (image) newContent += `    "image": ${JSON.stringify(image)},\n`;
  newContent += `    "price": ${p.price},\n`;
  newContent += `    "originalPrice": ${p.originalPrice},\n`;
  newContent += `    "desc": ${JSON.stringify(p.desc)},\n`;
  newContent += `    "ingredients": [\n`;
  for (let j = 0; j < p.ingredients.length; j++) {
    newContent += `      ${JSON.stringify(p.ingredients[j])}${j < p.ingredients.length - 1 ? ',' : ''}\n`;
  }
  newContent += `    ],\n`;
  newContent += `    "dosage": ${JSON.stringify(p.dosage)},\n`;
  newContent += `    "featured": ${p.featured}\n`;
  newContent += '  }';
  if (i < products.length - 1) newContent += ',';
  newContent += '\n';
}

newContent += '];\n';

fs.writeFileSync(catalogPath, newContent, 'utf8');
console.log('✅ product-catalog.js updated!');
