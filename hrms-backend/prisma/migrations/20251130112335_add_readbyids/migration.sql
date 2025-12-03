-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "readByIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
