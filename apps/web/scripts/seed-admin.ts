/**
 * Seed script to create admin user in database
 * Run this to set up initial RBAC data
 *
 * Usage: npx tsx scripts/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_ROLE = 'ADMIN';

async function seedAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: ADMIN_USERNAME },
    });

    if (existingAdmin) {
      // Update role if needed
      if (existingAdmin.role !== ADMIN_ROLE) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: ADMIN_ROLE },
        });
        console.log('✓ Admin user found and updated to ADMIN role');
      } else {
        console.log('✓ Admin user already exists with ADMIN role');
      }
      return;
    }

    // Create admin user with a unique invitation code
    const invitationCode = `ADMIN${Date.now().toString(36).toUpperCase()}`;

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const adminUser = await prisma.user.create({
      data: {
        username: ADMIN_USERNAME,
        password_hash: passwordHash,
        nickname: '系统管理员',
        role: ADMIN_ROLE,
        invitation_code: invitationCode,
        grade: null,
      },
    });

    console.log('✓ Created admin user:', {
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
    });
  } catch (error) {
    console.error('✗ Error seeding admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed
seedAdminUser()
  .then(() => {
    console.log('✓ Admin user seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Seed script failed:', error);
    process.exit(1);
  });
