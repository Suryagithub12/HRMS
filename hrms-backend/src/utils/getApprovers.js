import prisma from "../prismaClient.js";

export const getAdminAndManagers = async (employeeId) => {
  /* ================= ADMINS ================= */
  const admins = await prisma.user.findMany({
    where: {
      role: "ADMIN",
      isActive: true,
    },
    select: { email: true },
  });

  /* ================= MANAGERS (FIXED) ================= */
  const managers = await prisma.user.findMany({
    where: {
      managedDepartments: {
        some: {
          members: {              // ✅ Department.members
            some: {
              userId: employeeId, // ✅ UserDepartment.userId
            },
          },
        },
      },
      isActive: true,
    },
    select: { email: true },
  });

  /* ================= UNIQUE EMAILS ================= */
  const emails = [
    ...admins.map((a) => a.email),
    ...managers.map((m) => m.email),
  ];

  return [...new Set(emails)];
};
