const { PrismaClient } = require('@prisma/client');

async function run() {
  const p = new PrismaClient({
    log: ['error'],
  });
  
  try {
    // Wake up Neon by trying a simple query with retry
    console.log('Attempting to connect to Neon database...');
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Attempt ${attempt}/3...`);
        const result = await p.$queryRaw`SELECT COUNT(*) as cnt FROM "User"`;
        console.log('DB CONNECTED! Users:', result[0].cnt.toString());
        
        const user = await p.user.findUnique({ where: { email: 'rameshwaram.owner2025@gmail.com' } });
        if (user) {
          console.log('\nADMIN USER FOUND:');
          console.log('  email:', user.email);
          console.log('  role:', user.role);
          console.log('  isEmailVerified:', user.isEmailVerified);
          console.log('  passwordHash:', user.passwordHash ? 'present' : 'MISSING');
        } else {
          console.log('\nADMIN USER NOT FOUND in database!');
        }

        const prodCount = await p.product.count();
        console.log('\nTotal products:', prodCount);
        
        if (prodCount > 0) {
          const sample = await p.product.findFirst({ select: { id: true, name: true, image: true } });
          console.log('Sample product:', sample);
        }
        break;
      } catch (err) {
        console.log(`  Attempt ${attempt} failed: ${err.message.split('\n')[0]}`);
        if (attempt < 3) {
          console.log('  Waiting 5s before retry (waking up Neon)...');
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }
  } catch(e) {
    console.error('Fatal error:', e.message);
  } finally {
    await p.$disconnect();
  }
}
run();
