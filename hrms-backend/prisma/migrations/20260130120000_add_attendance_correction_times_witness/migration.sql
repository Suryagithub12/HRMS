-- AlterTable: add checkIn, checkOut, witness for Cancel Leave (Missed Check-in)
ALTER TABLE "AttendanceCorrection" ADD COLUMN "checkIn" TIMESTAMP(3);
ALTER TABLE "AttendanceCorrection" ADD COLUMN "checkOut" TIMESTAMP(3);
ALTER TABLE "AttendanceCorrection" ADD COLUMN "witness" TEXT;
