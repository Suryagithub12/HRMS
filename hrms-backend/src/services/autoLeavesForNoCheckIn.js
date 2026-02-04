import cron from "node-cron";
import prisma from "../prismaClient.js";

const toLocalISO = (date) => {
  const d = new Date(
    new Date(date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
};

// AFTER:
const toDateOnly = (dateISO) => {
  // Returns date at UTC midnight - Prisma will store as DATE only
  const d = new Date(dateISO);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export async function markAutoLeavesForDate(dateISO) {
  const dateOnly = toDateOnly(dateISO);

 // REMOVE these lines (or change to):
console.log("date:", dateOnly);

  //  All active, non-admin users
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { not: "ADMIN" },
    },
    select: { id: true },
  });

  console.log(`[AUTO-LEAVE] Running for ${dateISO}, users: ${users.length}`);

  for (const user of users) {
    //  Skip if holiday (match by whole day range, not exact timestamp)
    const holiday = await prisma.holiday.findFirst({
      where: {
        date: dateOnly,   // Direct comparison with @db.Date
      },
    });
    if (holiday) continue;

    // Skip if weekly off for this user (fixed or roster)
    const dayName = new Date(dateOnly).toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });

    const weeklyOff = await prisma.weeklyOff.findFirst({
      where: {
        userId: user.id,
        OR: [
          {
            isFixed: true,
            offDay: dayName,
          },
          {
            isFixed: false,
            offDate: dateOnly,   // Direct comparison
          },
        ],
      },
    });

    if (weeklyOff) continue;

    // Skip if already has APPROVED leave that covers this date
// AFTER:
const existingLeave = await prisma.leave.findFirst({
  where: {
    userId: user.id,
    status: "APPROVED",
    startDate: { lte: dateOnly },
    endDate: { gte: dateOnly },
    isAdminDeleted: false,
    isEmployeeDeleted: false,
  },
});
    if (existingLeave) continue;

    // Skip if there is any attendance row for this date
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: dateOnly,   // Direct comparison
      },
    });
    if (attendance) continue;

    // UNPAID leave for that date
// AFTER:
await prisma.leave.create({
  data: {
    userId: user.id,
    type: "UNPAID",
    startDate: dateOnly,
    endDate: dateOnly,      // Same date for single day leave
    status: "APPROVED",
    reason: "Auto-marked: no attendance recorded for this day",
  },
});

    console.log(
      `[AUTO-LEAVE] UNPAID leave created for user=${user.id} on ${dateISO}`,
    );
  }

  console.log(`[AUTO-LEAVE] Completed for ${dateISO}`);
}

cron.schedule(
  "3 18 * * *",
  async () => {
    console.log("[AUTO-LEAVE] Cron triggered at", new Date().toISOString());
    const now = new Date();
    const todayISO = toLocalISO(now);
    await markAutoLeavesForDate(todayISO);
  },
  {
    timezone: "Asia/Kolkata",
  },
);
