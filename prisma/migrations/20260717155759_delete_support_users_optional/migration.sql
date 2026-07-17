/*
  Warnings:

  - Made the column `threadId` on table `SupportMessage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `SupportThread` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SupportMessage" ALTER COLUMN "threadId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SupportThread" ALTER COLUMN "userId" SET NOT NULL;
