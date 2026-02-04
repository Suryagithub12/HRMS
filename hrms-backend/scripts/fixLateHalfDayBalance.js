import prisma from "../src/prismaClient.js";

async function fixLateHalfDayBalance() {
  console.log("🔍 Finding Late Check-in Half Days...\n");

  // Find all late check-in half days
  const lateHalfDays = await prisma.leave.findMany({
    where: {
      type: "HALF_DAY",
      status: "APPROVED",
      reason: "Late check-in"
    },
    include: {
      user: {
        select: { id: true, firstName: true, email: true, leaveBalance: true }
      }
    }
  });

  // Group by user
  const userMap = {};
  lateHalfDays.forEach(leave => {
    const uid = leave.userId;
    if (!userMap[uid]) {
      userMap[uid] = {
        user: leave.user,
        count: 0
      };
    }
    userMap[uid].count++;
  });

  console.log(`📊 Found ${Object.keys(userMap).length} affected users\n`);

  // Process each user
  for (const uid of Object.keys(userMap)) {
    const { user, count } = userMap[uid];
    const deduction = count * 0.5;
    const newBalance = user.leaveBalance - deduction;

    console.log(`👤 ${user.firstName} (${user.email})`);
    console.log(`   Late Half Days: ${count}`);
    console.log(`   Current Balance: ${user.leaveBalance}`);
    console.log(`   Deduction: -${deduction}`);
    console.log(`   New Balance: ${newBalance}`);

    await prisma.user.update({
      where: { id: uid },
      data: { leaveBalance: { decrement: deduction } }
    });

    console.log(`   ✅ Updated!\n`);
  }

  console.log("🎉 All balances fixed!");
}

fixLateHalfDayBalance()
  .catch(console.error)
  .finally(() => prisma.$disconnect());