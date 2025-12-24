// prisma/migrate-passwords.js
import prisma from "../src/prismaClient.js";
import bcrypt from "bcryptjs";

async function migratePasswords() {
  const users = await prisma.user.findMany({
    select: { id: true, password: true },
  });

  for (const u of users) {
    if (!u.password) continue;

    const isBcrypt = u.password.startsWith("$2");

    if (!isBcrypt) {
      const hashed = await bcrypt.hash(u.password, 10);
      await prisma.user.update({
        where: { id: u.id },
        data: { password: hashed },
      });
      console.log(`✔ Migrated password for user ${u.id}`);
    }
  }

  console.log("✅ Password migration complete");
}

migratePasswords()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
