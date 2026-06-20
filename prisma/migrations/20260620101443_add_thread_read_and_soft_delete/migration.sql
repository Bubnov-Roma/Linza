-- AlterTable
ALTER TABLE "SupportThread" ADD COLUMN     "clientReadAt" TIMESTAMP(3),
ADD COLUMN     "deletedByAdminAt" TIMESTAMP(3),
ADD COLUMN     "deletedByClientAt" TIMESTAMP(3);
