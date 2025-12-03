// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPw = await bcrypt.hash('admin123', 10);
  const agilityPw = await bcrypt.hash('agility123', 10);
  const lyfPw = await bcrypt.hash('lyf123', 10);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: adminPw,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Agility employee
  await prisma.user.upsert({
    where: { email: 'raj@agility.ai' },
    update: {},
    create: {
      email: 'raj@agility.ai',
      password: agilityPw,
      firstName: 'Raj',
      lastName: 'Sharma',
      role: 'AGILITY_EMPLOYEE',
      isActive: true,
    },
  });

  // Lyfshilp employee
  await prisma.user.upsert({
    where: { email: 'ajay@lyfshilp.com' },
    update: {},
    create: {
      email: 'ajay@lyfshilp.com',
      password: lyfPw,
      firstName: 'Ajay',
      lastName: 'Kumar',
      role: 'LYF_EMPLOYEE',
      isActive: true,
    },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
