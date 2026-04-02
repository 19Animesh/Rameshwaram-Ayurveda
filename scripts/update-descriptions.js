const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Helper to generate a 3-4 line description based on category and name
function generateSmartDescription(name, category, form) {
  const cures = {
    'immunity': 'builds robust natural immunity, fights recurring infections, and protects against seasonal seasonal health issues',
    'digestion': 'relieves bloating, gas, and acidity, while promoting healthy gut flora and smooth bowel movements',
    'skincare': 'purifies the blood, controls acne and blemishes, and promotes a natural glowing complexion from within',
    'brain-health': 'enhances memory, improves concentration, reduces mental fatigue, and calms the nervous system',
    'pain-relief': 'reduces joint inflammation, alleviates muscular pain, improves mobility, and soothes arthritis symptoms',
    'womens-health': 'regulates menstrual cycles, relieves cramps, balances hormones, and supports overall female reproductive health',
    'heart-health': 'strengthens cardiac muscles, promotes healthy blood pressure levels, and improves cardiovascular circulation',
    'respiratory': 'clears nasal passages, relieves chronic cough, expels excess mucus, and supports healthy lung function',
    'weight-management': 'boosts metabolic rate, aids in natural fat burning, reduces cravings, and supports healthy weight loss',
    'eye-health': 'soothes strained eyes, protects against blue light damage, and supports long-term optimal vision',
    'kidney-health': 'supports healthy kidney filtration, flushes out toxins, and maintains proper urinary tract function',
    'hair-care': 'strengthens hair roots, prevents premature graying, reduces hair fall, and promotes thick, healthy growth',
    'general-wellness': 'supports daily vitality, reduces stress, and promotes holistic well-being'
  };

  const formBenefits = {
    'tailam': 'As an authentic Ayurvedic oil, it penetrates deeply into tissues for fast relief and long-lasting nourishment.',
    'kashayam': 'This potent herbal decoction ensures rapid absorption and powerful systemic action in the body.',
    'guggulu': 'Formulated as a traditional resin tablet, it is highly effective at scraping away deeply seated toxins.',
    'arishtam': 'This naturally fermented liquid acts quickly while stimulating the digestive fire and increasing assimilation.',
    'vati': 'These concentrated herbal tablets offer an exact dosage for potent, consistent therapeutic benefits.',
    'churna': 'This fine herbal powder can be easily customized with honey or warm water for optimal absorption.',
    'lehyam': 'This sweet herbal jam acts as a powerful rejuvenative tonic that deeply nourishes all bodily tissues.',
    'ghritam': 'Medicated ghee carries the therapeutic properties of the herbs deep into the cell membranes.'
  };

  const defaultCure = cures[category] || cures['general-wellness'];
  
  // Try to determine form from name
  let medForm = 'vati'; // default
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('tail') || lowerName.includes('thail')) medForm = 'tailam';
  else if (lowerName.includes('kashay') || lowerName.includes('kwath')) medForm = 'kashayam';
  else if (lowerName.includes('guggul')) medForm = 'guggulu';
  else if (lowerName.includes('arisht') || lowerName.includes('asav')) medForm = 'arishtam';
  else if (lowerName.includes('churn') || lowerName.includes('choorn')) medForm = 'churna';
  else if (lowerName.includes('lehy') || lowerName.includes('prash') || lowerName.includes('gulam')) medForm = 'lehyam';
  else if (lowerName.includes('ghrit') || lowerName.includes('ghee')) medForm = 'ghritam';

  const formDesc = formBenefits[medForm];

  // Capitalize name nicely
  const formattedName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  return `${formattedName} is a premium Ayurvedic formulation specifically designed to target the root cause of imbalances. It effectively ${defaultCure}, providing safe and natural relief. ${formDesc} Regular use as prescribed helps restore the body's natural harmony and wellness.`;
}

// Ensure the function executes
if (products && Array.isArray(products)) {
  let updatedCount = 0;
  
  for (let p of products) {
    p.description = generateSmartDescription(p.name, p.category);
    // Remove ingredients array entirely as requested
    if (p.ingredients) {
      delete p.ingredients;
    }
    updatedCount++;
  }

  // Save back to products.json
  fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));

  console.log(`✅ Successfully updated descriptions and removed ingredients from ${updatedCount} products in products.json.`);
  console.log(`\nExample Description for ${products[0].name}:`);
  console.log(`"${products[0].description}"\n`);
} else {
  console.error("Failed to load products.json properly.");
}
