/**
 * fix-admin.js
 * Diagnoses and fixes:
 *  1. Admin account login issue (creates/updates the owner account)
 *  2. Reports image status for products
 * 
 * Run: node scripts/fix-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN_EMAIL    = 'rameshwaram.owner2025@gmail.com';
const ADMIN_PASSWORD = 'RA$Ayur#Owner@2025!';
const ADMIN_NAME     = 'Rameshwaram Owner';

async function main() {
  console.log('\n========================================');
  console.log('  RAMESHWARAM AYURVEDA - ADMIN FIXER');
  console.log('========================================\n');

  // ── 1. Check DB connection ──────────────────────────────────────────────
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection: OK');
  } catch (err) {
    console.error('❌ Database connection FAILED:', err.message);
    process.exit(1);
  }

  // ── 2. Check products count ─────────────────────────────────────────────
  const totalProducts = await prisma.product.count();
  console.log(`\n📦 Total products in DB: ${totalProducts}`);

  // ── 3. Check image status ───────────────────────────────────────────────
  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, image: true },
  });

  let noImage = 0, cloudinaryImg = 0, localImg = 0, blankImg = 0;
  for (const p of allProducts) {
    if (!p.image || p.image.trim() === '') {
      noImage++;
    } else if (p.image.includes('cloudinary')) {
      cloudinaryImg++;
    } else if (p.image.startsWith('/')) {
      localImg++;
    } else if (p.image === '/images/placeholder.jpg') {
      blankImg++;
    } else {
      localImg++;
    }
  }

  console.log('\n🖼️  Image Status:');
  console.log(`   Cloudinary URLs: ${cloudinaryImg}`);
  console.log(`   Local paths:     ${localImg}`);
  console.log(`   No image:        ${noImage}`);

  // ── 4. Look up existing admin account ──────────────────────────────────
  console.log('\n🔍 Looking up admin account...');
  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existingUser) {
    console.log(`   Found: ${existingUser.email} | role=${existingUser.role} | emailVerified=${existingUser.isEmailVerified}`);
    
    // Verify current password
    const passwordOk = await bcrypt.compare(ADMIN_PASSWORD, existingUser.passwordHash);
    console.log(`   Password match: ${passwordOk ? '✅ YES' : '❌ NO (will reset)'}`);

    // Fix any issues
    const newHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const updated = await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        role: 'admin',
        isEmailVerified: true,
        passwordHash: newHash, // always reset to be sure
        name: existingUser.name || ADMIN_NAME,
      },
    });
    console.log(`\n✅ Admin account FIXED:`);
    console.log(`   Email:    ${updated.email}`);
    console.log(`   Role:     ${updated.role}`);
    console.log(`   Verified: ${updated.isEmailVerified}`);

  } else {
    // Create new admin account
    console.log('   Not found — creating admin account...');
    const newHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const created = await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash: newHash,
        role: 'admin',
        isEmailVerified: true,
        isPhoneVerified: false,
      },
    });
    console.log(`\n✅ Admin account CREATED:`);
    console.log(`   Email: ${created.email}`);
    console.log(`   Role:  ${created.role}`);
  }

  // ── 5. List all admin/owner accounts ───────────────────────────────────
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, email: true, role: true, isEmailVerified: true },
  });
  console.log(`\n👑 All admin accounts (${admins.length}):`);
  admins.forEach(a => console.log(`   - ${a.email} | verified=${a.isEmailVerified}`));

  // ── 6. Summary ──────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('  DONE — Try logging in now!');
  console.log('  Email:    rameshwaram.owner2025@gmail.com');
  console.log('  Password: RA$Ayur#Owner@2025!');
  console.log('========================================\n');
}

main()
  .catch(err => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
