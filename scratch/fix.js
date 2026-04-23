const fs = require('fs');
let c = fs.readFileSync('src/app/checkout/page.js', 'utf8');

c = c.replace(/ðŸ› ï¸  Items Ordered/, '<ShoppingBagIcon size={16} color="currentColor" /> Items Ordered');
c = c.replace(/ðŸ“  Delivery Address/, '<MapPinIcon size={24} color="currentColor" /> Delivery Address');
c = c.replace(/<h2>ðŸ’³ Payment Method<\/h2>/, '<h2 style={{ display: "flex", alignItems: "center", gap: 8 }}><CreditCardIcon size={24} color="currentColor" /> Payment Method</h2>');
c = c.replace(/icon: 'ðŸ“±'/g, 'icon: <SmartphoneIcon size={24} color="currentColor" />');
c = c.replace(/icon: 'ðŸ’³'/g, 'icon: <CreditCardIcon size={24} color="currentColor" />');
c = c.replace(/icon: 'ðŸ ›ï¸ '/g, 'icon: <BuildingIcon size={24} color="currentColor" />');
c = c.replace(/<span className="payment-option-icon">\{method\.icon\}<\/span>/g, '<span className="payment-option-icon" style={{ display: "flex", alignItems: "center" }}>{method.icon}</span>');

fs.writeFileSync('src/app/checkout/page.js', c);
console.log('Fixed checkout icons');
