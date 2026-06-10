-- DropForeignKey
ALTER TABLE "StudioBooking" DROP CONSTRAINT "StudioBooking_userId_fkey";

-- AddForeignKey
ALTER TABLE "StudioBooking" ADD CONSTRAINT "StudioBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
