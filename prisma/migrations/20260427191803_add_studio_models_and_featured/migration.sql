-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "priceStudio" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "studioAvailable" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "StudioTariff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "details" TEXT,
    "pricePerHour" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "imageUrls" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioTariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tariffId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL,
    "tariffPriceAtBooking" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioBookingItem" (
    "id" TEXT NOT NULL,
    "studioBookingId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "priceAtBooking" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StudioBookingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioBookingPayment" (
    "id" TEXT NOT NULL,
    "studioBookingId" TEXT NOT NULL,
    "authorId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "PaymentType" NOT NULL DEFAULT 'PAYMENT',

    CONSTRAINT "StudioBookingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioBookingAuditLog" (
    "id" TEXT NOT NULL,
    "studioBookingId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "valueBefore" TEXT,
    "valueAfter" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioBookingAuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StudioBooking" ADD CONSTRAINT "StudioBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioBooking" ADD CONSTRAINT "StudioBooking_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "StudioTariff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioBookingItem" ADD CONSTRAINT "StudioBookingItem_studioBookingId_fkey" FOREIGN KEY ("studioBookingId") REFERENCES "StudioBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioBookingItem" ADD CONSTRAINT "StudioBookingItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioBookingPayment" ADD CONSTRAINT "StudioBookingPayment_studioBookingId_fkey" FOREIGN KEY ("studioBookingId") REFERENCES "StudioBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioBookingPayment" ADD CONSTRAINT "StudioBookingPayment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioBookingAuditLog" ADD CONSTRAINT "StudioBookingAuditLog_studioBookingId_fkey" FOREIGN KEY ("studioBookingId") REFERENCES "StudioBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioBookingAuditLog" ADD CONSTRAINT "StudioBookingAuditLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
