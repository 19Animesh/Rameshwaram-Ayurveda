const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Ensure role column exists
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT "user"');
    console.log('✅ role column added');
  } catch {
    console.log('ℹ️  role column already exists');
  }

  const email = 'rameshwaram.owner2025@gmail.com';
  const password = 'RA$Ayur#Owner@2025!';
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        role: 'admin',
        isEmailVerified: true,
        name: 'Owner',
        passwordHash: passwordHash,
      }
    });
    console.log('✅ Admin credentials updated');
  } else {
    await prisma.user.create({
      data: {
        id: 'admin-owner-2025',
        name: 'Owner',
        email: email,
        passwordHash: passwordHash,
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: false,
      }
    });
    console.log('✅ Admin user created');
  }

  // Make sure the old generic admin cannot login as admin (downgrade role)
  try {
    await prisma.user.updateMany({
      where: { email: 'admin@rameshwaramayurveda.com' },
      data: { role: 'user' }
    });
    console.log('ℹ️  Old generic admin account demoted to regular user');
  } catch(e) {}

  console.log('\n🔐 ===================== ADMIN CREDENTIALS =====================');
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);
  console.log(`   URL      : http://localhost:3001/admin`);
  console.log('   ⚠️  Save these credentials securely. Do NOT share them.');
  console.log('===============================================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
