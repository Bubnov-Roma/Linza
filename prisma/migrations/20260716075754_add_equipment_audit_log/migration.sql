-- CreateTable
CREATE TABLE "EquipmentAuditLog" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "valueBefore" TEXT,
    "valueAfter" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentAuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EquipmentAuditLog" ADD CONSTRAINT "EquipmentAuditLog_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentAuditLog" ADD CONSTRAINT "EquipmentAuditLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
