const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const r = await prisma.product.findFirst({
        where: {
            name: { contains: 'test', mode: 'insensitive' }
        }
    });
    console.log(r);
  } catch(e) {
    console.error(e);
  }
}
test().finally(() => prisma.$disconnect());
