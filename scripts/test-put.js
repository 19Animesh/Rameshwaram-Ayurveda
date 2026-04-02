async function test() {
  const req1 = await fetch('http://localhost:3000/api/products');
  const db1 = await req1.json();
  const product = db1.products[0];
  console.log('Testing PUT on:', product.id);

  const form = {
      name: product.name,
      brand: product.brand,
      description: product.description,
      price: String(product.price),
      originalPrice: String(product.originalPrice),
      category: product.category,
      stock: String(product.stock),
      dosage: product.dosage || '',
      howToConsume: product.howToConsume || '',
      sideEffects: product.sideEffects || '',
      expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
      image: product.image || '',
      featured: product.featured || false,
  };

  const payload = {
      ...form,
      price: Number(form.price),
      originalPrice: Number(form.originalPrice) || Number(form.price),
      stock: Number(form.stock),
  };
  
  const res = await fetch('http://localhost:3000/api/products/' + product.id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  console.log('Status HTTP:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}
test();
