/**
 * fix-admin.js — Fixes the admin account in Neon PostgreSQL
 * Handles Neon free-tier cold-start (retries connection)
 * Run: node scripts/fix-admin.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL    = 'rameshwaram.owner2025@gmail.com';
const ADMIN_PASSWORD = 'RA$Ayur#Owner@2025!';
const ADMIN_NAME     = 'Rameshwaram Owner';

async function connectWithRetry(prisma, maxAttempts = 5) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connected!\n');
      return true;
    } catch (err) {
      console.log(`   Attempt ${i}/${maxAttempts} failed — waking up Neon DB...`);
      if (i < maxAttempts) await new Promise(r => setTimeout(r, 3000));
    }
  }
  return false;
}

async function main() {
  console.log('\n========================================');
  console.log('  RAMESHWARAM AYURVEDA — ADMIN FIXER');
  console.log('========================================\n');

  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  // ── 1. Connect (with retry for Neon cold-start) ──────────────────────
  console.log('⏳ Connecting to Neon database (may take up to 15s)...');
  const connected = await connectWithRetry(prisma, 5);
  if (!connected) {
    console.error('❌ Could not connect to the database after 5 attempts.');
    console.error('   Check your DATABASE_URL in .env and Neon console.');
    await prisma.$disconnect();
    process.exit(1);
  }

  // ── 2. Count products ────────────────────────────────────────────────
  const totalProducts = await prisma.product.count();
  console.log(`📦 Products in database: ${totalProducts}`);

  // ── 3. Image stats ───────────────────────────────────────────────────
  const allProducts = await prisma.product.findMany({
    select: { image: true },
  });
  let cloudinary = 0, local = 0, none = 0;
  for (const p of allProducts) {
    if (!p.image || p.image.trim() === '') none++;
    else if (p.image.includes('cloudinary')) cloudinary++;
    else local++;
  }
  console.log(`🖼️  Images: ${cloudinary} Cloudinary | ${local} local/other | ${none} missing\n`);

  // ── 4. Find or create admin ──────────────────────────────────────────
  console.log(`🔍 Looking up admin: ${ADMIN_EMAIL}`);
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  const newHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  if (existing) {
    const pwOk = await bcrypt.compare(ADMIN_PASSWORD, existing.passwordHash);
    console.log(`   Found user | role=${existing.role} | verified=${existing.isEmailVerified} | password match=${pwOk}`);

    // Update to ensure role=admin, verified=true, and correct password hash
    const updated = await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: {
        role: 'admin',
        isEmailVerified: true,
        passwordHash: newHash,
      },
    });
    console.log(`\n✅ Admin account UPDATED:`);
    console.log(`   Email:    ${updated.email}`);
    console.log(`   Role:     ${updated.role}`);
    console.log(`   Verified: ${updated.isEmailVerified}`);
  } else {
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

  // ── 5. List all admins ───────────────────────────────────────────────
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { email: true, role: true, isEmailVerified: true },
  });
  console.log(`\n👑 All admin accounts (${admins.length}):`);
  admins.forEach(a => console.log(`   ✓ ${a.email} — verified: ${a.isEmailVerified}`));

  console.log('\n========================================');
  console.log('  DONE!');
  console.log('  Login: rameshwaram.owner2025@gmail.com');
  console.log('  Pass:  RA$Ayur#Owner@2025!');
  console.log('  URL:   /admin');
  console.log('========================================\n');

  await prisma.$disconnect();
}

main().catch(async err => {
  console.error('\n❌ Script failed:', err.message);
  process.exit(1);
});
