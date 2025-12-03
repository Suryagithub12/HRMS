-- AlterTable
ALTER TABLE "Reimbursement" ADD COLUMN     "isAdminDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEmployeeDeleted" BOOLEAN NOT NULL DEFAULT false;
