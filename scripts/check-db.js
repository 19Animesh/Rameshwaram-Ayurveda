const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const count = await p.product.count();
  const sample = await p.product.findFirst();
  console.log('Products in DB:', count);
  if (sample) {
    console.log('Sample product:', JSON.stringify({id: sample.id, name: sample.name, category: sample.category}, null, 2));
  }
  await p.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
