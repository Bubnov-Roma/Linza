-- CreateTable
CREATE TABLE "about_page_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "heroTitle" TEXT NOT NULL DEFAULT 'LINZA',
    "heroSub" TEXT NOT NULL DEFAULT 'Готовые решения для вашей съёмки',
    "description" TEXT NOT NULL DEFAULT 'Мы предоставляем передовое фото- и видеооборудование для профессионалов и любителей в Самаре. Наш приоритет — качество техники и безупречный сервис.',
    "imageUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_page_settings_pkey" PRIMARY KEY ("id")
);
