-- AlterTable
ALTER TABLE "FaqItem" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "about_page_settings" ALTER COLUMN "heroSub" SET DEFAULT 'Это не просто прокат и студия.';

-- CreateTable
CREATE TABLE "FaqQuestion" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FaqQuestion_pkey" PRIMARY KEY ("id")
);
