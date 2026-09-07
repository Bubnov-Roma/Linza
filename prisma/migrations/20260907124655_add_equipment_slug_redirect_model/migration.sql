-- CreateTable
CREATE TABLE "EquipmentSlugRedirect" (
    "id" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "newSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentSlugRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentSlugRedirect_oldSlug_key" ON "EquipmentSlugRedirect"("oldSlug");

-- CreateIndex
CREATE INDEX "EquipmentSlugRedirect_oldSlug_idx" ON "EquipmentSlugRedirect"("oldSlug");
