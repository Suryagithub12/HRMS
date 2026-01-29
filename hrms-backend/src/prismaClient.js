// src/prismaClient.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ensure generated client has AttendanceCorrection (avoids "reading 'create' of undefined")
if (typeof prisma.attendanceCorrection?.create !== "function") {
  throw new Error(
    "Prisma client missing attendanceCorrection model. Stop the server, run: npm run generate (in hrms-backend), then start the server again."
  );
}

export default prisma;
