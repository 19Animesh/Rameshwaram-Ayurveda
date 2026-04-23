const fs = require('fs');
const lines = fs.readFileSync('src/app/checkout/page.js', 'utf8').split('\n');
lines[370] = '                    { id: "netbanking", name: "Net Banking",         desc: "All major banks supported",   icon: <BuildingIcon size={24} color="currentColor" /> },';
fs.writeFileSync('src/app/checkout/page.js', lines.join('\n'));
console.log('Fixed line 371');
