const fs = require('fs');
const lines = fs.readFileSync('src/app/checkout/page.js', 'utf8').split('\n');

lines[245] = `            <div style={{ fontSize: 12, fontWeight: 700, color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><ShoppingBagIcon size={16} color="currentColor" /> Items Ordered</div>`;

lines[324] = `                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPinIcon size={24} color="currentColor" /> Delivery Address</h2>`;

fs.writeFileSync('src/app/checkout/page.js', lines.join('\n'));
console.log('Fixed final lines');
