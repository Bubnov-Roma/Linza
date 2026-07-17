-- AlterTable
ALTER TABLE "SupportMessage" ALTER COLUMN "threadId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SupportThread" ALTER COLUMN "userId" DROP NOT NULL;
