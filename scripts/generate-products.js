/**
 * ============================================================
 * PRODUCT GENERATOR SCRIPT
 * ============================================================
 * Run with: node scripts/generate-products.js
 *
 * This script generates products.json from the compact catalog
 * defined in src/data/product-catalog.js
 *
 * It auto-fills: id, image path, stock, expiry date,
 * rating, reviewCount, reviews, howToConsume, sideEffects
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

// ── Load the compact catalog ──
const catalog = require('../src/data/product-catalog.js');

// ── Seeded random for deterministic output ──
let seed = 42;
function rand() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function randRating() { return +(3.8 + rand() * 1.1).toFixed(1); }

// ── Sample review templates (used to auto-generate reviews) ──
const REVIEW_NAMES = [
  'Rahul S.', 'Priya M.', 'Amit K.', 'Sneha R.', 'Vikram P.', 'Anita D.',
  'Sunita G.', 'Rajesh T.', 'Meera K.', 'Divya S.', 'Karan M.', 'Neha P.',
  'Suresh B.', 'Lakshmi N.', 'Deepa R.', 'Arun S.', 'Pooja V.', 'Rohit K.',
  'Kavita J.', 'Rina P.', 'Manish G.', 'Anjali M.', 'Dr. Sharma', 'Anand L.',
  'Sapna T.', 'Vikas R.', 'Ritu A.', 'Sandeep G.', 'Tarun D.', 'Shweta P.'
];

const REVIEW_TEMPLATES = {
  immunity: ['Great immunity booster!', 'Noticed fewer sick days.', 'Effective natural supplement.', 'Good for seasonal protection.'],
  digestion: ['Improved my digestion significantly.', 'No more bloating issues.', 'Works gently and effectively.', 'Great for gut health.'],
  skincare: ['Skin is glowing now!', 'Visible improvement in 2 weeks.', 'Natural and effective.', 'Best skincare product I\'ve used.'],
  'brain-health': ['Better focus and memory.', 'Helps with concentration.', 'Noticed mental clarity improvement.', 'Great for students.'],
  'pain-relief': ['Excellent for joint pain.', 'Soothing and effective.', 'Quick relief from body pain.', 'Very helpful for arthritis.'],
  'womens-health': ['Helpful for hormonal balance.', 'Feeling more energetic.', 'Great for overall wellness.', 'Recommended by my doctor.'],
  'heart-health': ['Good for heart health.', 'Cholesterol levels improved.', 'Doctor approved supplement.', 'Taking it regularly now.'],
  respiratory: ['Cleared my congestion.', 'Works great for cough.', 'Natural cold remedy.', 'Very effective for breathing.'],
  'weight-management': ['Slow but steady results.', 'Metabolism improved.', 'Helpful with regular exercise.', 'Good natural approach.'],
  'eye-health': ['Eye strain reduced.', 'Vision feels clearer.', 'Good for screen workers.', 'Recommended for IT professionals.'],
  'kidney-health': ['Very effective for urinary health.', 'Taking on doctor\'s advice.', 'Good detoxifier.', 'Noticed improvement in kidney function.'],
  'hair-care': ['Hair fall reduced!', 'Hair feels thicker now.', 'Best hair product.', 'Visible results in 4 weeks.'],
};

// ── Default howToConsume and sideEffects by category ──
const DEFAULTS = {
  immunity: {
    howToConsume: 'Take as directed on the label with warm water or milk after meals.',
    sideEffects: 'Generally safe. Consult physician if pregnant or on medication.'
  },
  digestion: {
    howToConsume: 'Take after meals with warm water. Use consistently for best results.',
    sideEffects: 'May cause mild stomach upset initially. Reduce dosage if needed.'
  },
  skincare: {
    howToConsume: 'Apply as directed or take orally as specified. Patch test for topical products.',
    sideEffects: 'Patch test recommended for sensitive skin. Discontinue if irritation occurs.'
  },
  'brain-health': {
    howToConsume: 'Take with warm milk or honey after meals for best absorption.',
    sideEffects: 'Generally safe. May cause mild drowsiness. Consult physician if on medication.'
  },
  'pain-relief': {
    howToConsume: 'Apply externally or take orally as directed. Massage gently for topical products.',
    sideEffects: 'For external products: do not apply on broken skin. Internal: take after meals only.'
  },
  'womens-health': {
    howToConsume: 'Take with warm milk after meals. Consult practitioner for personalized dosage.',
    sideEffects: 'Consult doctor during pregnancy and lactation. Generally safe for most women.'
  },
  'heart-health': {
    howToConsume: 'Take with water after meals. Shake well if liquid formulation.',
    sideEffects: 'May interact with cardiac medications. Inform your doctor if using supplements.'
  },
  respiratory: {
    howToConsume: 'Mix with honey or warm water. Take 2-3 times daily during cold/cough.',
    sideEffects: 'Safe for most age groups. Reduce dosage for children. Consult if symptoms persist.'
  },
  'weight-management': {
    howToConsume: 'Take 30 minutes before meals with warm water. Combine with exercise.',
    sideEffects: 'Not for pregnant or lactating women. May cause mild stomach upset initially.'
  },
  'eye-health': {
    howToConsume: 'Take with milk or honey after meals. Use consistently for 3-6 months.',
    sideEffects: 'May contain iron — consult practitioner. Not for self-medication.'
  },
  'kidney-health': {
    howToConsume: 'Take with warm water or milk after meals. Use consistently for 2-3 months.',
    sideEffects: 'May interact with diabetes medications. Consult physician before use.'
  },
  'hair-care': {
    howToConsume: 'Apply on scalp, massage gently, leave for 1 hour before washing.',
    sideEffects: 'For external use only. Patch test before first use.'
  },
};

// ── Generate reviews for a product ──
function generateReviews(category, count) {
  const reviews = [];
  const templates = REVIEW_TEMPLATES[category] || REVIEW_TEMPLATES.immunity;
  for (let i = 0; i < count; i++) {
    reviews.push({
      user: pick(REVIEW_NAMES),
      rating: randInt(4, 5),
      comment: pick(templates),
      date: `2026-0${randInt(1,3)}-${String(randInt(1,28)).padStart(2,'0')}`
    });
  }
  return reviews;
}

// ── Build the full products array ──
const products = catalog.map((item, index) => {
  const id = `prod_${String(index + 1).padStart(3, '0')}`;
  const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/,'');
  const rating = item.rating || randRating();
  const reviewCount = item.reviewCount || randInt(20, 250);
  const defaults = DEFAULTS[item.category] || DEFAULTS.immunity;

  return {
    id,
    name: item.name,
    brand: item.brand,
    description: item.desc,
    price: item.price,
    originalPrice: item.originalPrice,
    category: item.category,
    ingredients: item.ingredients,
    dosage: item.dosage,
    howToConsume: item.howToConsume || defaults.howToConsume,
    sideEffects: item.sideEffects || defaults.sideEffects,
    expiryDate: `202${randInt(7,8)}-${String(randInt(1,12)).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`,
    stock: randInt(20, 500),
    image: `/images/${slug}.jpg`,
    rating,
    reviewCount,
    featured: item.featured || false,
    reviews: generateReviews(item.category, Math.min(randInt(1, 3), reviewCount)),
  };
});

// ── Write output ──
const outPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
fs.writeFileSync(outPath, JSON.stringify(products, null, 2));

console.log(`✅ Generated ${products.length} products → src/data/products.json`);
console.log(`   Categories: ${[...new Set(products.map(p => p.category))].join(', ')}`);
console.log(`   Brands: ${[...new Set(products.map(p => p.brand))].length} unique brands`);
