const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function count() {
  const all = await prisma.product.findMany();
  
  let withImage = 0;
  let withoutImage = 0;

  for (const p of all) {
    if (p.image && p.image !== '' && !p.image.includes('placeholder.jpg') && p.image.includes('res.cloudinary')) {
      withImage++;
    } else {
      withoutImage++;
    }
  }

  console.log(`\n📊 DATABASE IMAGE STATUS`);
  console.log(`Total Products: ${all.length}`);
  console.log(`With Valid Images: ${withImage}`);
  console.log(`Without Images (Placeholders): ${withoutImage}`);
}

count().finally(() => prisma.$disconnect());
