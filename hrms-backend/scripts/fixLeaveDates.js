import prisma from "../src/prismaClient.js";

async function fixLeaveDates() {
  console.log("Fixing leave dates...");

  const leaves = await prisma.leave.findMany();
  
  let fixed = 0;
  
  for (const leave of leaves) {
    const startISO = leave.startDate.toISOString().slice(0, 10);
    const endISO = leave.endDate.toISOString().slice(0, 10);
    
    // Create date-only values (UTC midnight)
    const newStart = new Date(startISO + "T00:00:00.000Z");
    const newEnd = new Date(endISO + "T00:00:00.000Z");
    
    // Check if update needed
    if (leave.startDate.getTime() !== newStart.getTime() || 
        leave.endDate.getTime() !== newEnd.getTime()) {
      
      await prisma.leave.update({
        where: { id: leave.id },
        data: {
          startDate: newStart,
          endDate: newEnd,
        },
      });
      
      fixed++;
      console.log(`Fixed leave ${leave.id}: ${startISO} to ${endISO}`);
    }
  }
  
  console.log(`\nTotal fixed: ${fixed} leaves`);
  await prisma.$disconnect();
}

fixLeaveDates().catch(console.error);