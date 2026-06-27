-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "autoApplyTrigger" TEXT,
ADD COLUMN     "minOrderAmount" DOUBLE PRECISION,
ADD COLUMN     "perUserLimit" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "autoPromoCode" TEXT;

-- CreateTable
CREATE TABLE "PromoCodeEquipment" (
    "promoCodeId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,

    CONSTRAINT "PromoCodeEquipment_pkey" PRIMARY KEY ("promoCodeId","equipmentId")
);

-- AddForeignKey
ALTER TABLE "PromoCodeEquipment" ADD CONSTRAINT "PromoCodeEquipment_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCodeEquipment" ADD CONSTRAINT "PromoCodeEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
