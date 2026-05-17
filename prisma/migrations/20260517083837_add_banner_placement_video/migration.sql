-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "placement" TEXT NOT NULL DEFAULT 'both',
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "BannerImage" ADD COLUMN     "videoUrl" TEXT;
