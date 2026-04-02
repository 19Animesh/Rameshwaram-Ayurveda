const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, image: true },
      take: 10
    });
    console.table(products);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}
run();
