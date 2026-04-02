/**
 * ============================================================
 * MERGE DUPLICATES SCRIPT
 * ============================================================
 * This script reads products.json, finds products with the same
 * base name but different sizes/quantities (e.g. "PIND TAILA 200ML"
 * and "PIND TAILA 1LTR"), and merges them into one product with
 * a "variants" array containing different sizes and prices.
 * 
 * Run with: node scripts/merge-duplicates.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// ── Extract base name by removing size/quantity suffixes ──
function getBaseName(name) {
  return name
    .replace(/\s*\d+\s*(ML|LTR|LITR?|GM|G|KG|CAP|TAB|TABLET|CAPSULE|PACK)\b/gi, '')
    .replace(/\s*\(\d+\s*(ML|G|GM|LTR)\)/gi, '')
    .replace(/\s*\d+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

// ── Extract quantity/size label from the name ──
function getQuantityLabel(name) {
  // Try "200ML", "1LTR", "100GM", "60TAB", "40CAP", "(10ML)", "450ML", etc.
  const patterns = [
    /(\d+\s*ML)/i,
    /(\d+\s*LTR?)/i,
    /(\d+\s*LITR?)/i,
    /(\d+\s*GM)/i,
    /(\d+\s*G)\b/i,
    /(\d+\s*KG)/i,
    /(\d+\s*TAB)/i,
    /(\d+\s*CAP)/i,
    /(\d+\s*CAPSULE)/i,
    /\((\d+\s*ML)\)/i,
    /\((\d+\s*G)\)/i,
    /(\d+\s*PACK)/i,
  ];
  
  for (const p of patterns) {
    const match = name.match(p);
    if (match) return match[1].toUpperCase().replace(/\s+/g, '');
  }
  return null;
}

// ── Group products by base name + brand ──
const groups = new Map();
for (const product of products) {
  const baseName = getBaseName(product.name);
  const key = `${baseName}|${product.brand.toUpperCase()}`;
  
  if (!groups.has(key)) {
    groups.set(key, []);
  }
  groups.get(key).push(product);
}

// ── Build merged product list ──
const merged = [];
let mergedCount = 0;

for (const [key, group] of groups) {
  if (group.length === 1) {
    // Single product — no variants needed, but still add variants array with one entry
    const p = group[0];
    const qty = getQuantityLabel(p.name);
    p.variants = [{
      label: qty || 'Standard',
      price: p.price,
      originalPrice: p.originalPrice,
      stock: p.stock,
    }];
    merged.push(p);
  } else {
    // Multiple products with same base name — merge into one with variants
    mergedCount += group.length - 1;
    
    // Sort by price (cheapest first)
    group.sort((a, b) => a.price - b.price);
    
    // Use the cheapest as the base product
    const base = { ...group[0] };
    
    // Clean up the base name (remove size suffix)
    const cleanName = getBaseName(base.name)
      .split(' ')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
    base.name = cleanName;
    
    // Build variants array from all sizes
    base.variants = group.map(p => {
      const qty = getQuantityLabel(p.name);
      return {
        label: qty || (p.price === base.price ? 'Small' : p.price > 500 ? 'Large' : 'Regular'),
        price: p.price,
        originalPrice: p.originalPrice,
        stock: p.stock,
      };
    });
    
    // Deduplicate variants by label (keep highest priced if same label)
    const variantMap = new Map();
    for (const v of base.variants) {
      const existingV = variantMap.get(v.label);
      if (!existingV || v.price > existingV.price) {
        variantMap.set(v.label, v);
      }
    }
    base.variants = [...variantMap.values()].sort((a, b) => a.price - b.price);
    
    // Use best rating from all variants
    base.rating = Math.max(...group.map(p => p.rating));
    base.reviewCount = group.reduce((sum, p) => sum + p.reviewCount, 0);
    
    // Merge reviews
    const allReviews = group.flatMap(p => p.reviews || []);
    base.reviews = allReviews.slice(0, 3);
    
    merged.push(base);
  }
}

// Re-assign IDs
merged.forEach((p, i) => {
  p.id = `prod_${String(i + 1).padStart(3, '0')}`;
});

// Write merged output
fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2));

console.log(`✅ Merged products:`);
console.log(`   Before: ${products.length} products`);
console.log(`   After:  ${merged.length} products (${mergedCount} duplicates merged)`);
console.log(`   Products with multiple variants: ${merged.filter(p => p.variants.length > 1).length}`);

// Show some examples of merged products
const multiVariant = merged.filter(p => p.variants.length > 1).slice(0, 5);
if (multiVariant.length > 0) {
  console.log(`\n   Examples of merged products:`);
  multiVariant.forEach(p => {
    console.log(`     ${p.name} (${p.brand}): ${p.variants.map(v => `${v.label}=₹${v.price}`).join(', ')}`);
  });
}
