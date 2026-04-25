-- Converted from MySQL to PostgreSQL by mysql_to_pg.py
-- Linza rental system database

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- ─── PostgreSQL ENUM Types ───────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('GUEST', 'USER', 'PARTNER', 'MANAGER', 'ADMIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EntityType" AS ENUM ('INDIVIDUAL', 'INDIVIDUAL_PARTNER', 'LEGAL_ENTITY', 'LEGAL_PARTNER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BookingStatus" AS ENUM ('PENDING_REVIEW', 'WAIT_PAYMENT', 'READY_TO_RENT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'RENTED', 'RESERVED', 'MAINTENANCE', 'BROKEN', 'RETIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "OwnershipType" AS ENUM ('INTERNAL', 'SUBLEASE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED', 'PROMO'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "ApplicationStatus" AS ENUM ('LOADING', 'NO_APPLICATION', 'DRAFT', 'PENDING', 'REVIEWING', 'CLARIFICATION', 'STANDARD', 'APPROVED', 'REJECTED', 'BLOCKED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "HistoryAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CategoryEntityType" AS ENUM ('CATEGORY', 'SUBCATEGORY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DocumentTemplateType" AS ENUM ('CONTRACT_INDIVIDUAL', 'CONTRACT_LEGAL', 'ACT', 'INVOICE', 'RECEIPT', 'CUSTOM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "BalanceTxType" AS ENUM ('REFUND', 'CREDIT', 'DEBIT', 'MANUAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'BALANCE', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PaymentType" AS ENUM ('PAYMENT', 'DEPOSIT', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Хост: localhost
-- Время создания: Апр 23 2026 г., 13:28
-- Версия сервера: 8.0.34-26-beget-1-1
-- Версия PHP: 5.6.40
--
-- База данных: "linza_db"
--
-- --------------------------------------------------------
--
-- Структура таблицы `Account`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "Account" CASCADE;
CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT DEFAULT NULL,
  "access_token" TEXT DEFAULT NULL,
  "expires_at" INTEGER DEFAULT NULL,
  "token_type" TEXT DEFAULT NULL,
  "scope" TEXT DEFAULT NULL,
  "id_token" TEXT DEFAULT NULL,
  "session_state" TEXT DEFAULT NULL
);
--
-- Дамп данных таблицы `Account`
--
INSERT INTO "Account" ("id", "userId", "type", "provider", "providerAccountId", "refresh_token", "access_token", "expires_at", "token_type", "scope", "id_token", "session_state") VALUES
('097099b8-ac9d-40b4-bd34-aeed54def2ea', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'oauth', 'yandex', '9055092', '2:AAA:AAAAAACKK3Q:1:uqhMVulUGd0UWztT:JJeAd1MQSReu1CaUiHacqICgOsLCi75xUQBeej_-zXO90u9m31pFQfrCbVqZlwn523po:Mxq-AUPg8fgqxSLGs11PDw', 'y0__xD01qgEGK2-PyC3qdj3FlcMCqiWKBDH3vVypk1eaE8QEj4G', 1806508994, 'bearer', NULL, NULL, NULL),
('920d3e6c-c08c-4bab-8e35-ee65c5940769', 'db3ae213-c165-453e-bf62-d48f6198449c', 'oauth', 'yandex', '2351286122', '2:AAA:AAAAAIwlx2o:1:0FZnUdT6-Q1Goruc:GVb5hNWDPGEjoKy1Y2HMqRPcNuGWMySfpqXAPJGiCqT-ic8WYtxPPbUZC-o0R3qP57WDgzMcYMSoYvk05g:ZOjfqi3Z1QtrY0PlItCYcA', 'y0__xDqjpfhCBitvj8giIef8BYwzYq48we2U_luooDUu0vT8reqtnTwCnANSw', 1806050221, 'bearer', NULL, NULL, NULL),
('ed94b788-b8fb-4e98-8895-e673fc9a4eac', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'oidc', 'google', '102593032364185429912', NULL, 'ya29.a0ATkoCc4HcAwicYJYCe6MfjCVg0mHIZpQAHOjnubpHmI7Ro2TTDQJFKvMLwl9mFd1s5j-PeOrGJH2cYUhJXlTzfnwky-L-543rfFUfr1EeV-4GVUqQGY2S7mY2O9BSM7ovTOrQKLwxwi3n7kAoCkC4mfAUxgrE7MhE9JjHnEagkjvwiRK14zSe2gH', 1774417992, 'bearer', 'https://www.googleapis.com/auth/userinfo.email openid https://www.googleapis.com/auth/userinfo.profile', 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImExMGU1OGRmNTVlNzI4NTY2ZWM1NmJkYTZlYjNiZDQ1NDM5ZjM1ZDciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3Mjc3MjM5MDUwMjgtbWppcTZlZGli', NULL);
-- --------------------------------------------------------
--
-- Структура таблицы `AdminNotification`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "AdminNotification" CASCADE;
CREATE TABLE IF NOT EXISTS "AdminNotification" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "userId" TEXT DEFAULT NULL,
  "payload" JSONB NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--
-- Дамп данных таблицы `AdminNotification`
--
INSERT INTO "AdminNotification" ("id", "type", "userId", "payload", "isRead", "createdAt") VALUES
('00049990-f710-418f-9adb-9ccbf192337d', 'booking_items_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "itemCount": 2, "totalAmount": 400}', FALSE, '2026-04-06 06:06:54.510'),
('071c33da-b0da-43d3-8bd7-a26650597156', 'booking_status_changed', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', '{"booking_id": "8fd232a3-fe32-4577-82b5-2098c306daa9", "new_status": "WAIT_PAYMENT"}', FALSE, '2026-04-06 18:40:03.247'),
('0b1b8a64-5642-465e-955f-0f2293ac8774', 'booking_status_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"booking_id": "eed3e1f1-1e4b-4330-b0e2-c448948a35fc", "new_status": "WAIT_PAYMENT"}', FALSE, '2026-03-29 13:42:39.779'),
('0babe627-08b1-454e-b2ba-3ebdb5fb3c32', 'booking_items_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "itemCount": 2, "totalAmount": 13800}', FALSE, '2026-04-06 15:45:01.831'),
('0d7bba50-f568-4178-bc5b-52b5de0f55c4', 'booking_status_changed', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', '{"booking_id": "8fd232a3-fe32-4577-82b5-2098c306daa9", "new_status": "ACTIVE"}', FALSE, '2026-04-06 18:40:54.863'),
('0f91a024-e5d1-4aa0-9bc1-a4b139b6064f', 'booking_status_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"booking_id": "ff59d135-5108-4eee-900e-f7ba84e007e0", "new_status": "CANCELLED"}', FALSE, '2026-04-03 05:31:54.055'),
('1192d274-d318-4e72-ac03-dc762b11994e', 'booking_status_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"booking_id": "48b2300a-f22b-4d0b-a1eb-5af9792d47a7", "new_status": "WAIT_PAYMENT"}', FALSE, '2026-03-28 08:35:24.061'),
('35bf86aa-4c78-4f46-9cd1-9be6f8d1cc83', 'booking_client_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "newUserId": "3f1ab5b9-bc03-4840-bbe4-2daeedf8f8bf", "oldUserId": "e3b42108-8e30-4bbe-bc2a-963f3636134a", "newUserName": null}', FALSE, '2026-04-06 14:32:08.831'),
('3bf67896-5d6d-4028-b48e-50bad4c4b6ba', 'booking_items_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "itemCount": 2, "totalAmount": 1000}', FALSE, '2026-04-06 06:07:19.045'),
('3f29964a-5f41-4cef-8922-6d54714a7f79', 'booking_status_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"booking_id": "c9ca1a08-812e-4dd4-9d06-b33b107a43cf", "new_status": "CANCELLED"}', FALSE, '2026-04-03 05:31:56.459'),
('41c21e2e-a91c-49f9-9d1d-c2d68bbb09ef', 'booking_client_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "newUserId": "e3b42108-8e30-4bbe-bc2a-963f3636134a", "oldUserId": "e3b42108-8e30-4bbe-bc2a-963f3636134a", "newUserName": "Roma Bubnov"}', FALSE, '2026-04-05 16:27:45.287'),
('44f2d3ae-1e78-4cc7-9dbe-68c8868aa40c', 'booking_client_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "newUserId": "e3b42108-8e30-4bbe-bc2a-963f3636134a", "oldUserId": "3f1ab5b9-bc03-4840-bbe4-2daeedf8f8bf", "newUserName": "Roma Bubnov"}', FALSE, '2026-04-06 17:20:15.731'),
('4a7f6ee3-ed23-4b15-99be-b4571a9fa5c9', 'booking_client_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "newUserId": "e3b42108-8e30-4bbe-bc2a-963f3636134a", "oldUserId": "3f1ab5b9-bc03-4840-bbe4-2daeedf8f8bf", "newUserName": "Roma Bubnov"}', FALSE, '2026-04-05 17:14:24.775'),
('4e1be514-1825-4f13-a9a2-8520f22c1ea7', 'booking_items_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "itemCount": 2, "totalAmount": 800}', FALSE, '2026-04-06 06:06:02.145'),
('52129544-3af3-435d-a987-3406b58578dd', 'booking_status_changed', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', '{"booking_id": "8fd232a3-fe32-4577-82b5-2098c306daa9", "new_status": "READY_TO_RENT"}', FALSE, '2026-04-06 18:40:37.582'),
('54ff9e5d-95d5-470e-afee-adea9bcfd61d', 'booking_items_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "itemCount": 2, "totalAmount": 600}', FALSE, '2026-04-06 15:43:37.084'),
('55d42dae-2deb-4da8-8337-601340e3c5c4', 'booking_items_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "itemCount": 2, "totalAmount": 1700}', FALSE, '2026-04-06 17:19:08.421'),
('5a4c3111-8df6-4779-9544-c8d78535be72', 'booking_client_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "newUserId": "e3b42108-8e30-4bbe-bc2a-963f3636134a", "oldUserId": "e3b42108-8e30-4bbe-bc2a-963f3636134a", "newUserName": "Roma Bubnov"}', FALSE, '2026-04-05 16:28:44.667'),
('6170ea8e-cafd-4598-8cd0-eb1913a367f1', 'booking_status_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"booking_id": "48b2300a-f22b-4d0b-a1eb-5af9792d47a7", "new_status": "ACTIVE"}', FALSE, '2026-03-28 08:37:41.801'),
('65ad239a-6143-4205-8114-e3cf5084f997', 'booking_items_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "itemCount": 4, "totalAmount": 940}', FALSE, '2026-04-05 16:25:48.149'),
('8b189f48-1fc0-4e87-8046-29b1a4250076', 'booking_pricing_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"newTotal": 900, "oldTotal": 1000, "bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "adjustments": [{"_id": "220e06b3-fb4d-4a54-85fa-359869c60675", "type": "percent", "value": 10, "promoCode": "", "description": ""}]}', FALSE, '2026-04-06 14:31:40.367'),
('98719a05-d545-439e-8da2-989cbf07d0cd', 'booking_client_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "newUserId": "3f1ab5b9-bc03-4840-bbe4-2daeedf8f8bf", "oldUserId": "e3b42108-8e30-4bbe-bc2a-963f3636134a", "newUserName": null}', FALSE, '2026-04-05 17:12:51.652'),
('a1ca14ff-c0a9-48f4-9cd3-d37fdb30e2e4', 'booking_client_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "newUserId": "e3b42108-8e30-4bbe-bc2a-963f3636134a", "oldUserId": "e3b42108-8e30-4bbe-bc2a-963f3636134a", "newUserName": "Roma Bubnov"}', FALSE, '2026-04-05 16:28:12.983'),
('ad44965b-453c-4b45-836b-8d4500e01d60', 'booking_status_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"booking_id": "eed3e1f1-1e4b-4330-b0e2-c448948a35fc", "new_status": "CANCELLED"}', FALSE, '2026-04-05 12:43:44.053'),
('afedcd2c-a335-40db-99fb-3d47f9b0b339', 'booking_dates_changed', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', '{"end_date": "2026-04-19T11:40:00.000Z", "booking_id": "b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99", "start_date": "2026-04-18T11:40:00.000Z"}', FALSE, '2026-04-18 11:24:51.706'),
('b5b68555-f10c-47e9-a401-7c1907c0d656', 'booking_status_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"booking_id": "48b2300a-f22b-4d0b-a1eb-5af9792d47a7", "new_status": "READY_TO_RENT"}', FALSE, '2026-03-28 08:37:37.638'),
('c2c3bcfb-8824-4c75-bdcc-1aa133b73422', 'booking_status_changed', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', '{"booking_id": "8fd232a3-fe32-4577-82b5-2098c306daa9", "new_status": "COMPLETED"}', FALSE, '2026-04-06 18:41:50.530'),
('c4c51f46-c107-4208-b24d-5dd487de67b1', 'booking_items_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "itemCount": 2, "totalAmount": 1200}', FALSE, '2026-04-06 14:32:38.499'),
('c8ae9efd-c8b4-4b73-bcad-d77b94f92369', 'booking_status_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"booking_id": "48b2300a-f22b-4d0b-a1eb-5af9792d47a7", "new_status": "COMPLETED"}', FALSE, '2026-03-28 08:37:45.006'),
('eb4a1f35-596a-4c56-ac8d-946bf3c1f574', 'booking_status_changed', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', '{"booking_id": "8fd232a3-fe32-4577-82b5-2098c306daa9", "new_status": "WAIT_PAYMENT"}', FALSE, '2026-04-05 16:34:08.383'),
('f0d64ff7-f0f2-413b-9249-4c2ff9a7bf87', 'booking_dates_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"end_date": "2026-04-01T07:50:00.000Z", "booking_id": "8fd232a3-fe32-4577-82b5-2098c306daa9", "start_date": "2026-04-01T07:30:00.000Z"}', FALSE, '2026-04-05 12:48:52.047'),
('fd3f07af-7d12-4bbb-894a-6ca8108c6b36', 'booking_items_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "itemCount": 2, "totalAmount": 400}', FALSE, '2026-04-05 17:13:40.102'),
('ff46a4dd-0117-44f9-a621-fdd1fbdcc172', 'booking_client_changed', 'db3ae213-c165-453e-bf62-d48f6198449c', '{"bookingId": "8fd232a3-fe32-4577-82b5-2098c306daa9", "newUserId": "e3b42108-8e30-4bbe-bc2a-963f3636134a", "oldUserId": "db3ae213-c165-453e-bf62-d48f6198449c", "newUserName": "Roma Bubnov"}', FALSE, '2026-04-05 16:24:05.411');
-- --------------------------------------------------------
--
-- Структура таблицы `BalanceTransaction`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "BalanceTransaction" CASCADE;
CREATE TABLE IF NOT EXISTS "BalanceTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bookingId" TEXT DEFAULT NULL,
  "type" "BalanceTxType" NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT,
  "authorId" TEXT DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--
-- Дамп данных таблицы `BalanceTransaction`
--
INSERT INTO "BalanceTransaction" ("id", "userId", "bookingId", "type", "amount", "description", "authorId", "createdAt") VALUES
('0cdc4bbc-3b96-434c-8cb3-ec8bb442c0e4', 'db3ae213-c165-453e-bf62-d48f6198449c', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'REFUND'::"BalanceTxType", 8500, '', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-14 11:50:35.445'),
('66780b4a-6490-42d6-9cd3-302156b97cc9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'ff59d135-5108-4eee-900e-f7ba84e007e0', 'REFUND'::"BalanceTxType", 200, '', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-14 11:53:14.068'),
('945850c6-14a4-4db2-aba0-41760ba0dd13', 'db3ae213-c165-453e-bf62-d48f6198449c', 'ff59d135-5108-4eee-900e-f7ba84e007e0', 'REFUND'::"BalanceTxType", 200, '', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-14 11:59:23.084'),
('b37f99e8-50d7-40da-986d-df470027f634', 'db3ae213-c165-453e-bf62-d48f6198449c', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'REFUND'::"BalanceTxType", 8500, '', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-14 11:33:32.310'),
('c32df480-166e-438a-98b7-a99b942e427b', 'db3ae213-c165-453e-bf62-d48f6198449c', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'REFUND'::"BalanceTxType", 8500, '', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-14 11:34:08.431'),
('d2487e2e-482b-4bb4-8297-a5b428f47bad', 'db3ae213-c165-453e-bf62-d48f6198449c', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'REFUND'::"BalanceTxType", 8500, '', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-14 11:52:38.901'),
('e295a81f-7adf-41db-b28e-ac0f6fc3d40b', 'db3ae213-c165-453e-bf62-d48f6198449c', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'REFUND'::"BalanceTxType", 8500, '', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-14 11:24:47.292'),
('e7c63bde-1dea-4d3f-a633-d9bce3933799', 'db3ae213-c165-453e-bf62-d48f6198449c', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'REFUND'::"BalanceTxType", 8500, '', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-14 11:23:49.261'),
('e951c191-6c6c-4d3a-b4e1-2decd300b890', 'db3ae213-c165-453e-bf62-d48f6198449c', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'REFUND'::"BalanceTxType", 8500, '', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-14 12:02:03.510'),
('e985bc75-b2cd-498e-a76a-3618717b84d5', 'db3ae213-c165-453e-bf62-d48f6198449c', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'REFUND'::"BalanceTxType", 8000, '', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-14 11:14:12.088');
-- --------------------------------------------------------
--
-- Структура таблицы `Banner`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "Banner" CASCADE;
CREATE TABLE IF NOT EXISTS "Banner" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT DEFAULT NULL,
  "body" TEXT,
  "imageUrl" TEXT DEFAULT NULL,
  "linkUrl" TEXT DEFAULT NULL,
  "linkLabel" TEXT DEFAULT NULL,
  "type" TEXT NOT NULL DEFAULT 'info',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "eventDate" TIMESTAMPTZ DEFAULT NULL,
  "createdBy" TEXT DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL
);
--
-- Дамп данных таблицы `Banner`
--
INSERT INTO "Banner" ("id", "title", "subtitle", "body", "imageUrl", "linkUrl", "linkLabel", "type", "isActive", "sortOrder", "eventDate", "createdBy", "createdAt", "updatedAt") VALUES
('55f7a526-426e-438b-8245-d3659c6a9e4d', 'Контент день 3.0', '❗Запускаем Контент день 3.0❗', 'Предыдущий опыт показал - формат реально зашёл, поэтому делаем снова и для всех: ведущие, организаторы, блогеры, эксперты, бизнес\n\n### Приходите на 1,5 часа — уходите с готовым контентом на месяц\n\nМы берём на себя идею, продюсирование, съёмку и монтаж — вам нужно только прийти\n\n **С нами:**\n- студия [LINZA](https://vk.com/linza_samara) \n- фотограф [Александр Ненашев](https://vk.com/aleksandr_nenashev)\n- фотограф [Олеся Широнина](https://vk.com/wr.photo)\n\n По всем вопросам — [Яна Шмелькова](https://vk.com/yana_videovsamare)', 'https://i.ibb.co/p6YKzKbJ/o3uwjm-O2h-ITVI1-Y5tu-LI2-Rqk-O8kt-P-p8-Fal-Cj-Rf-FB3-Dj-Kwp-AXc1-Jmrn-Shcke-BXWHh-Ti6-Ug-Ai4-GH2-Bzs2-Au-H-L.jpg', 'https://vk.com/wall-229927392_66', 'Буду', 'info', TRUE, 1, '2026-04-06 00:00:00.000', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-03-29 20:50:43.316', '2026-03-31 16:18:44.934'),
('f54c1f58-4838-477b-b307-c054c8aff308', 'ОФФЕР', 'Контент-День', '## Начинаем 2026 год масштабно!\n\nА именно - с нашего нового продукта, созданного специально для ведущих любых мероприятий.\n\nПо всем вопросам - [Яна Шмелькова](https://vk.com/id140567734)\n\n**Наши партнеры:**\n* [LINZA](https://vk.com/club195519707)\n* [Олеся Широнина](https://vk.com/club189355091)', 'https://i.ibb.co/Df0sLZs9/c-Hw-Simv-X1t-SLp-N6peo-KKHak-MGQwd-Lq-QOn-YZH-jz-XKll-Egi3qd-Sz-Guwh8-Ef-H-7sr-FHjdv-Z4-NCU-UU0-XD1-Kn.jpg', 'https://vk.com/wall-229927392_63', 'Дайте два !', 'event', TRUE, 2, '2038-04-10 00:00:00.000', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-03-30 07:32:00.955', '2026-03-31 08:21:20.043');
-- --------------------------------------------------------
--
-- Структура таблицы `BannerImage`
--
-- Создание: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "BannerImage" CASCADE;
CREATE TABLE IF NOT EXISTS "BannerImage" (
  "id" TEXT NOT NULL,
  "bannerId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- --------------------------------------------------------
--
-- Структура таблицы `Booking`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "Booking" CASCADE;
CREATE TABLE IF NOT EXISTS "Booking" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "totalReplacementValue" DOUBLE PRECISION DEFAULT 0,
  "insuranceIncluded" BOOLEAN DEFAULT TRUE,
  "cancellationReason" TEXT DEFAULT NULL,
  "cancelledAt" TIMESTAMPTZ DEFAULT NULL,
  "expiredAt" TIMESTAMPTZ DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL
);
--
-- Дамп данных таблицы `Booking`
--
INSERT INTO "Booking" ("id", "userId", "startDate", "endDate", "totalAmount", "status", "totalReplacementValue", "insuranceIncluded", "cancellationReason", "cancelledAt", "expiredAt", "createdAt", "updatedAt") VALUES
('46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-08 12:00:00.000', '2026-04-08 16:00:00.000', 11400, 'WAIT_PAYMENT'::"BookingStatus", 190000, TRUE, NULL, NULL, NULL, '2026-04-08 10:56:17.220', '2026-04-08 14:18:27.739'),
('48b2300a-f22b-4d0b-a1eb-5af9792d47a7', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-17 08:40:00.000', '2026-04-17 12:40:00.000', 800, 'EXPIRED'::"BookingStatus", 100500, TRUE, NULL, '2026-04-17 09:54:11.315', '2026-04-17 09:55:16.751', '2026-03-28 08:34:29.764', '2026-04-17 09:55:16.753'),
('4aaec1de-1523-4a22-bde7-22645ab081d4', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', '2026-04-17 09:50:00.000', '2026-04-17 13:50:00.000', 900, 'READY_TO_RENT'::"BookingStatus", 15000, TRUE, NULL, NULL, NULL, '2026-04-17 09:44:01.662', '2026-04-18 11:32:51.098'),
('53e6b7f7-65e3-468b-aa85-3aae65b1b78c', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', '2026-04-19 13:20:00.000', '2026-04-19 16:50:00.000', 9000, 'PENDING_REVIEW'::"BookingStatus", 150000, TRUE, NULL, NULL, NULL, '2026-04-18 13:14:26.859', '2026-04-18 13:14:26.859'),
('720afd07-a54f-4daa-9041-80900c8c1561', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', '2026-04-09 07:00:00.000', '2026-04-11 09:00:00.000', 19900, 'READY_TO_RENT'::"BookingStatus", 0, TRUE, NULL, NULL, NULL, '2026-04-08 14:58:21.046', '2026-04-14 06:40:27.584'),
('8fd232a3-fe32-4577-82b5-2098c306daa9', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', '2026-04-01 07:30:00.000', '2026-04-02 07:50:00.000', 1700, 'EXPIRED'::"BookingStatus", 0, TRUE, NULL, '2026-04-17 10:21:28.389', '2026-04-17 10:22:03.599', '2026-04-05 12:45:29.169', '2026-04-17 10:22:03.600'),
('a7e2adce-e5d0-4f62-81a6-eabe14c1a38a', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', '2026-04-17 11:30:00.000', '2026-04-17 15:30:00.000', 900, 'COMPLETED'::"BookingStatus", 15000, TRUE, NULL, '2026-04-17 11:34:02.276', NULL, '2026-04-17 11:29:37.525', '2026-04-18 15:06:58.776'),
('b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', '2026-04-18 11:40:00.000', '2026-04-19 11:40:00.000', 3000, 'PENDING_REVIEW'::"BookingStatus", 0, TRUE, NULL, NULL, NULL, '2026-04-17 11:35:05.604', '2026-04-18 11:45:33.158'),
('c9ca1a08-812e-4dd4-9d06-b33b107a43cf', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-06 12:30:00.000', '2026-04-07 16:00:00.000', 4900, 'CANCELLED'::"BookingStatus", 100500, TRUE, NULL, '2026-04-03 05:31:56.112', NULL, '2026-03-31 15:16:28.028', '2026-04-03 05:31:56.113'),
('eed3e1f1-1e4b-4330-b0e2-c448948a35fc', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-03-29 07:00:00.000', '2026-03-31 07:20:00.000', 9000, 'CANCELLED'::"BookingStatus", 100500, TRUE, NULL, '2026-04-05 12:43:43.700', NULL, '2026-03-28 17:23:38.554', '2026-04-05 12:43:43.710'),
('ff59d135-5108-4eee-900e-f7ba84e007e0', 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-01 09:30:00.000', '2026-04-01 13:30:00.000', 800, 'CANCELLED'::"BookingStatus", 100500, TRUE, NULL, '2026-04-03 05:31:53.652', NULL, '2026-04-01 09:22:29.593', '2026-04-14 11:57:00.374');
-- --------------------------------------------------------
--
-- Структура таблицы `BookingAdminNote`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "BookingAdminNote" CASCADE;
CREATE TABLE IF NOT EXISTS "BookingAdminNote" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "authorId" TEXT DEFAULT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--
-- Дамп данных таблицы `BookingAdminNote`
--
INSERT INTO "BookingAdminNote" ("id", "bookingId", "authorId", "note", "createdAt") VALUES
('9d9fe26a-7624-4352-b5d1-52d18c8f280d', '720afd07-a54f-4daa-9041-80900c8c1561', 'db3ae213-c165-453e-bf62-d48f6198449c', 'wowowowowow', '2026-04-14 07:13:10.775'),
('edfa5f26-44b7-42b0-b76f-e0732cb4d283', '720afd07-a54f-4daa-9041-80900c8c1561', 'db3ae213-c165-453e-bf62-d48f6198449c', 'ddfdfdfdfd', '2026-04-14 07:31:31.744'),
('f77e6627-f27e-4818-a095-b4adf624ebc9', '720afd07-a54f-4daa-9041-80900c8c1561', 'db3ae213-c165-453e-bf62-d48f6198449c', 'xnj-nj', '2026-04-14 07:13:05.649');
-- --------------------------------------------------------
--
-- Структура таблицы `BookingAuditLog`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "BookingAuditLog" CASCADE;
CREATE TABLE IF NOT EXISTS "BookingAuditLog" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "authorId" TEXT DEFAULT NULL,
  "authorName" TEXT DEFAULT NULL,
  "action" TEXT NOT NULL,
  "fieldName" TEXT DEFAULT NULL,
  "valueBefore" TEXT,
  "valueAfter" TEXT,
  "meta" JSONB DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--
-- Дамп данных таблицы `BookingAuditLog`
--
INSERT INTO "BookingAuditLog" ("id", "bookingId", "authorId", "authorName", "action", "fieldName", "valueBefore", "valueAfter", "meta", "createdAt") VALUES
('006b4c6a-9142-43a7-9964-cba4828906f9', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Платёж зафиксирован', 'payments', 'Оплачено: 0 ₽', 'Оплачено: 5 700 ₽ (+5 700 ₽ · Наличные)', '{"method": "CASH", "paymentStatus": "PARTIAL"}', '2026-04-08 13:44:30.278'),
('054f3e2f-d6c8-4bbd-a37b-affb364ef1ae', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Платёж зафиксирован', 'payments', 'Оплачено: 9 400 ₽', 'Оплачено: 19 400 ₽ (+10 000 ₽ · Наличные)', '{"method": "CASH", "paymentStatus": "OVERPAID"}', '2026-04-14 08:18:53.666'),
('0eba30f8-4f08-4ebd-9c72-2cee6768574b', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Платёж зафиксирован', 'payments', 'Оплачено: 0 ₽', 'Оплачено: 1 700 ₽ (+1 700 ₽ · С баланса)', '{"method": "BALANCE", "paymentStatus": "PAID"}', '2026-04-14 11:25:14.745'),
('134580ee-2303-40b5-abff-acfe79cfab9f', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Возврат переплаты', 'payments', NULL, 'Переведено на баланс: 8500 ₽', '{}', '2026-04-14 11:50:35.639'),
('172b8737-7684-4cfa-9e62-726fa1c43c2a', '720afd07-a54f-4daa-9041-80900c8c1561', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'PENDING_REVIEW', 'WAIT_PAYMENT', '{}', '2026-04-14 06:40:23.591'),
('1ebc8428-1632-4892-8bf2-037a94c9d139', 'ff59d135-5108-4eee-900e-f7ba84e007e0', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Возврат переплаты', 'payments', NULL, 'Переведено на баланс: 200 ₽', '{}', '2026-04-14 11:53:14.259'),
('30d8f4d4-12d6-44b8-ab69-1bbb268e02cc', 'a7e2adce-e5d0-4f62-81a6-eabe14c1a38a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'PENDING_REVIEW', 'CANCELLED', '{}', '2026-04-17 11:34:02.661'),
('31528118-32ec-4993-b1b4-ac3888ba2b7d', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'CANCELLED', 'EXPIRED', '{}', '2026-04-17 10:22:03.892'),
('31bca4ba-8cc3-4eaf-975d-c1488baff589', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Состав заказа изменён', 'bookingItems', '2 позиций: Микрофон конденсаторный Sony ECM 674 S/2000, Ноутбук Acer Nitro 5 · 600 ₽', '2 позиций: Объектив Nikon 24-70mm f/2.8E ED VR AF-S Nikkor байонет F, Объектив Canon 24-105mm f/4L IS II USM (RC) · 13800 ₽', '{}', '2026-04-06 15:45:01.931'),
('3910c41b-3dd5-4c62-94fe-8a830c7ccff5', 'b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'PENDING_REVIEW', 'WAIT_PAYMENT', '{}', '2026-04-17 11:49:08.284'),
('4092bd90-6929-448c-84b9-df3259a85faf', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'READY_TO_RENT', 'WAIT_PAYMENT', '{}', '2026-04-08 14:18:28.055'),
('415aa202-2070-433f-9817-c18847ae24b6', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Возврат переплаты', 'payments', NULL, 'Переведено на баланс: 8500 ₽', '{}', '2026-04-14 12:02:03.852'),
('492cc69a-733b-45b0-9dd3-e8418bde4225', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Стоимость скорректирована', 'totalAmount', '1000 ₽', '900 ₽', '{"adjustments": "−10%"}', '2026-04-06 14:31:40.540'),
('4be586c2-4b1e-41f0-b784-4718b8d20aa1', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Состав заказа изменён', 'bookingItems', '2 позиций: Объектив Canon 24-105mm f/4L IS II USM (RC), Объектив Nikon 24-70mm f/2.8E ED VR AF-S Nikkor байонет F · 36800 ₽', '2 позиций: Объектив Canon 24-105mm f/4L IS II USM (RC), Объектив Nikon 24-70mm f/2.8E ED VR AF-S Nikkor байонет F · 1700 ₽', '{}', '2026-04-06 17:19:08.624'),
('4c4d7b21-0bfd-4133-be4d-0949e42dfc8b', 'b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'WAIT_PAYMENT', 'READY_TO_RENT', '{}', '2026-04-17 11:49:47.358'),
('4e9b023b-7bda-40a5-ba73-94f5c04844e9', '4aaec1de-1523-4a22-bde7-22645ab081d4', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'WAIT_PAYMENT', 'READY_TO_RENT', '{}', '2026-04-18 11:32:51.811'),
('5197e931-2a91-4ab5-978d-ffe894ffa94d', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Возврат переплаты', 'payments', NULL, 'Переведено на баланс: 8500 ₽', '{}', '2026-04-14 11:52:39.106'),
('54e7be95-0750-4dfe-9902-5fafa3322da4', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Состав заказа изменён', 'bookingItems', '2 позиций: Микрофон конденсаторный Sony ECM 674 S/2000, Ноутбук Acer Nitro 5 · 900 ₽', '2 позиций: Микрофон конденсаторный Sony ECM 674 S/2000, Ноутбук Acer Nitro 5 · 1200 ₽', '{}', '2026-04-06 14:32:38.682'),
('6108032a-4eaf-435b-a013-11cbd66930b9', '720afd07-a54f-4daa-9041-80900c8c1561', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'WAIT_PAYMENT', 'READY_TO_RENT', '{}', '2026-04-14 06:40:27.827'),
('68effc3a-e582-4b4b-96bd-fbe0aa0f3f88', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'COMPLETED', 'ACTIVE', '{}', '2026-04-17 10:20:16.267'),
('731f9183-acc1-4c44-ade0-639c4de68cee', 'b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'PENDING_REVIEW', 'WAIT_PAYMENT', '{}', '2026-04-18 11:30:32.494'),
('73ff6df9-51e8-415b-bf09-2fe90ae71d09', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Метка добавлена', 'labels', NULL, 'новая метка', '{}', '2026-04-06 14:34:43.187'),
('79abe608-184c-498e-be47-b9b175152916', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'COMPLETED', 'CANCELLED', '{}', '2026-04-17 10:21:28.697'),
('79c5d11b-cd81-4a47-8d74-70232a0f972c', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Период аренды изменён', 'startDate/endDate', 'Сумма: 13800 ₽', 'Сумма: 36800 ₽', '{}', '2026-04-06 17:18:45.591'),
('7a56eb5c-dd1e-4c35-8524-347065fe0801', '720afd07-a54f-4daa-9041-80900c8c1561', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Заказ создан администратором', 'status', '', 'PENDING_REVIEW', '{"note": "", "items": "Canon EOS R6 Mark II (ЦМ), Объектив Canon 24-70 2.8 ii L байонет EF", "total": "6840 ₽", "client": "Roma Bubnov (roman.bubnov.1989@gmail.com)", "createdBy": "linzarental"}', '2026-04-08 14:58:21.357'),
('7cb27d92-6605-428a-8d35-9626ced59693', 'a7e2adce-e5d0-4f62-81a6-eabe14c1a38a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'CANCELLED', 'COMPLETED', '{}', '2026-04-18 15:06:59.546'),
('80593151-15a8-4555-95eb-fa950aec94a5', '48b2300a-f22b-4d0b-a1eb-5af9792d47a7', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'PENDING_REVIEW', 'COMPLETED', '{}', '2026-04-17 09:55:09.249'),
('86bdecd1-c00e-4fb9-8e1c-bf363a421262', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Метка добавлена', 'labels', NULL, 'зеленая метка !!!', '{}', '2026-04-06 17:21:36.079'),
('874a1e96-9124-4906-84c0-55886c6ca910', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'PENDING_REVIEW', 'READY_TO_RENT', '{}', '2026-04-08 13:44:52.612'),
('88866417-e6d2-482b-85da-ab77deedec26', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Платёж зафиксирован', 'payments', 'Оплачено: 5 700 ₽', 'Оплачено: 9 400 ₽ (+3 700 ₽ · Карта / терминал)', '{"method": "CARD", "paymentStatus": "PARTIAL"}', '2026-04-08 14:19:54.818'),
('892f2e90-b303-4d08-93d8-d096cbd37b30', 'ff59d135-5108-4eee-900e-f7ba84e007e0', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Возврат переплаты', 'payments', NULL, 'Переведено на баланс: 200 ₽', '{}', '2026-04-14 11:59:23.428'),
('9144079e-a8d2-4516-b9a5-9aad31b365fe', 'b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Состав заказа изменён', 'bookingItems', '1 позиций: Стойка Manfrotto 052B (280мм) · 500 ₽', '6 позиций: Стойка Manfrotto 052B (280мм) ×6 · 3000 ₽', '{}', '2026-04-17 11:50:31.242'),
('9617c8a6-d641-4e56-8518-879863488ed5', '720afd07-a54f-4daa-9041-80900c8c1561', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Состав заказа изменён', 'bookingItems', '2 позиций: Объектив Canon 24-70 2.8 ii L байонет EF, Canon EOS R6 Mark II (ЦМ) · 6840 ₽', '2 позиций: Объектив Canon 24-70 2.8 ii L байонет EF, Canon EOS R6 Mark II (ЦМ) · 19900 ₽', '{}', '2026-04-10 10:01:03.650'),
('9cb03960-33cb-4919-b455-252f5325e674', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Приход оплаты', 'payments', 'Оплачено: 1 700 ₽', 'Оплачено: 2 700 ₽ (+1 000 ₽ · Наличные)', '{"note": "", "method": "CASH", "paymentStatus": "OVERPAID"}', '2026-04-14 19:52:25.746'),
('9d1e3d8e-be36-40ce-a7c3-c1b9e497440f', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Метка удалена', 'labels', 'sdsdsdsds', NULL, '{}', '2026-04-06 14:31:15.825'),
('a4cf6367-c9a8-4790-aba9-5567d7e74ff4', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Клиент заказа изменён', 'userId', '? (kilkun@mail.ru)', 'Roma Bubnov (roman.bubnov.1989@gmail.com)', '{}', '2026-04-06 17:20:15.919'),
('ab817cb5-139a-42a3-97ea-192a2062fa98', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Возврат залога', 'payments', 'Оплачено: 11 900 ₽', 'Оплачено: 11 400 ₽ (-500 ₽ · Перевод)', '{"note": "допустим это возврат залога", "method": "TRANSFER", "paymentStatus": "PAID"}', '2026-04-14 19:10:36.264'),
('c0b6f0e4-fc16-4d34-88f7-f341ebfd9ee6', '48b2300a-f22b-4d0b-a1eb-5af9792d47a7', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'COMPLETED', 'CANCELLED', '{}', '2026-04-17 09:54:11.638'),
('c7b92a50-9274-4cc9-87c1-d8e13f56ee85', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Платёж удалён', 'payments', '-500 ₽ · Перевод', NULL, '{}', '2026-04-14 19:11:48.728'),
('d3102c9f-0cc5-4ac1-90ec-94befc922f84', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Платёж зафиксирован', 'payments', 'Оплачено: 11 400 ₽', 'Оплачено: 11 900 ₽ (+500 ₽ · Наличные)', '{"method": "CASH", "paymentStatus": "OVERPAID"}', '2026-04-14 17:23:15.812'),
('d5d149d6-596d-4dec-9a71-888271d7a8a6', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Клиент заказа изменён', 'userId', 'Roma Bubnov (roman.bubnov.1989@gmail.com)', '? (kilkun@mail.ru)', '{}', '2026-04-06 14:32:09.015'),
('d886729e-e7c8-4d7a-ab27-e594e769f1e9', '48b2300a-f22b-4d0b-a1eb-5af9792d47a7', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'COMPLETED', 'EXPIRED', '{}', '2026-04-17 09:55:17.131'),
('e6b2486b-0084-460b-b7f5-cf20bc1892a8', 'b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'READY_TO_RENT', 'PENDING_REVIEW', '{}', '2026-04-18 11:45:33.901'),
('e6ed01d8-034d-44d0-84e4-64aac04a0a09', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Метка добавлена', 'labels', NULL, 'sdsdsdsds', '{}', '2026-04-06 14:30:47.218'),
('e7e1cf71-e242-4594-8d66-859a1de97403', 'ff59d135-5108-4eee-900e-f7ba84e007e0', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Платёж зафиксирован', 'payments', 'Оплачено: 0 ₽', 'Оплачено: 1 000 ₽ (+1 000 ₽ · Наличные)', '{"method": "CASH", "paymentStatus": "OVERPAID"}', '2026-04-14 11:53:07.806'),
('e81db471-b7c8-45f4-8b7c-b143eb047755', '720afd07-a54f-4daa-9041-80900c8c1561', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Метка добавлена', 'labels', NULL, 'новая желтая метка', '{}', '2026-04-14 06:44:56.672'),
('e956ef93-5c96-4a69-8ceb-1dc11d4a2cae', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'ACTIVE', 'COMPLETED', '{}', '2026-04-17 10:21:20.709'),
('eb05d48c-5bc4-4d4c-9d85-e3d4a68b8631', '48b2300a-f22b-4d0b-a1eb-5af9792d47a7', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'CANCELLED', 'PENDING_REVIEW', '{}', '2026-04-17 09:54:34.172'),
('f9a2653e-6487-4d37-a206-ef7f254cb343', '720afd07-a54f-4daa-9041-80900c8c1561', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Платёж зафиксирован', 'payments', 'Оплачено: 0 ₽', 'Оплачено: 1 000 ₽ (+1 000 ₽ · Наличные)', '{"method": "CASH", "paymentStatus": "PARTIAL"}', '2026-04-14 06:39:42.287'),
('fb3429b2-debe-4dfe-90e3-d88474539a7b', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Платёж зафиксирован', 'payments', 'Оплачено: 19 400 ₽', 'Оплачено: 19 900 ₽ (+500 ₽ · Наличные)', '{"method": "CASH", "paymentStatus": "OVERPAID"}', '2026-04-14 11:23:42.762'),
('fcc4487a-462e-4625-b8f1-aaa828ef35a1', '4aaec1de-1523-4a22-bde7-22645ab081d4', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'PENDING_REVIEW', 'WAIT_PAYMENT', '{}', '2026-04-17 09:45:00.763'),
('fddd8a9e-812b-4bd3-b233-610112a8e7e1', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Состав заказа изменён', 'bookingItems', '2 позиций: Микрофон конденсаторный Sony ECM 674 S/2000, Ноутбук Acer Nitro 5 · 1200 ₽', '2 позиций: Микрофон конденсаторный Sony ECM 674 S/2000, Ноутбук Acer Nitro 5 · 600 ₽', '{}', '2026-04-06 15:43:37.255'),
('fff69942-a80a-4af2-87cb-eee377633862', 'b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Статус изменён вручную', 'status', 'WAIT_PAYMENT', 'READY_TO_RENT', '{}', '2026-04-18 11:30:55.186');
-- --------------------------------------------------------
--
-- Структура таблицы `BookingItem`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "BookingItem" CASCADE;
CREATE TABLE IF NOT EXISTS "BookingItem" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "priceAtBooking" DOUBLE PRECISION NOT NULL,
  "depositAtBooking" DOUBLE PRECISION DEFAULT 0,
  "replacementValueAtBooking" DOUBLE PRECISION DEFAULT 0
);
--
-- Дамп данных таблицы `BookingItem`
--
INSERT INTO "BookingItem" ("id", "bookingId", "equipmentId", "priceAtBooking", "depositAtBooking", "replacementValueAtBooking") VALUES
('09512af9-5dd9-4134-8c8c-552afa17f8b3', 'b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', '221def50-e968-45ea-bf07-b9aa5ac94b6e', 500, 0, 0),
('462e7520-57ff-41b0-8b95-70c80a125608', '4aaec1de-1523-4a22-bde7-22645ab081d4', 'ff9faa6b-edc3-4a81-9cc1-33b25281cb65', 900, 0, 0),
('46dcd71c-d1f9-4f24-9bbd-ba3473a0f779', 'b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', '221def50-e968-45ea-bf07-b9aa5ac94b6e', 500, 0, 0),
('56dde0a2-b986-4697-8fba-9bc0192853dd', '720afd07-a54f-4daa-9041-80900c8c1561', '156acbe5-c6a3-4792-a894-89c1cd6aa5aa', 17000, 0, 170000),
('653b1a62-da14-460c-8b4e-8f3c853f2947', '48b2300a-f22b-4d0b-a1eb-5af9792d47a7', '35f7435b-3a62-43a8-8d92-5e2292916821', 800, 0, 0),
('6b3cc862-9c6b-42cd-8499-1bec3afe501a', '46dca1ff-3302-4762-9f42-1f2237dfcd67', '0101d0f5-67b3-45fd-8a12-90bf550f4503', 2400, 0, 0),
('80a8d824-9591-431f-86f6-83c2d2b9f6d7', 'eed3e1f1-1e4b-4330-b0e2-c448948a35fc', '35f7435b-3a62-43a8-8d92-5e2292916821', 9000, 0, 0),
('97cce8e6-d684-424b-b892-f61361eb8f2b', '46dca1ff-3302-4762-9f42-1f2237dfcd67', '17896b6d-70c9-462d-ae6e-c36d5f0ae671', 1800, 0, 0),
('9e474606-a95e-4e80-b879-cad8a1964d8c', '46dca1ff-3302-4762-9f42-1f2237dfcd67', '02590486-a46a-4ed7-96bd-865eedae4343', 7200, 0, 0),
('9e9c1104-2a9e-4040-a77f-3439a5706db0', 'b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', '221def50-e968-45ea-bf07-b9aa5ac94b6e', 500, 0, 0),
('a3794b7e-43a2-4f1a-9af4-993a0c4257ef', 'b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', '221def50-e968-45ea-bf07-b9aa5ac94b6e', 500, 0, 0),
('a449ae5b-54f1-4a7b-92f6-444ea29a8450', '8fd232a3-fe32-4577-82b5-2098c306daa9', '722de942-7420-4287-91f9-5b3bf21331ba', 800, 0, 0),
('aa1470d3-fa40-49bb-a0d3-09332682b549', '8fd232a3-fe32-4577-82b5-2098c306daa9', '02793c8a-1d7a-4b53-baff-4c7e39fe5e05', 900, 0, 0),
('ba7bd8d8-960a-4074-93ec-0c2abd33c028', 'ff59d135-5108-4eee-900e-f7ba84e007e0', '35f7435b-3a62-43a8-8d92-5e2292916821', 800, 0, 0),
('c548f4c7-82de-4ee8-9f06-112ebf6b56a1', 'b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', '221def50-e968-45ea-bf07-b9aa5ac94b6e', 500, 0, 0),
('cdedea7f-4769-4959-9adf-1afaed6d9dee', 'c9ca1a08-812e-4dd4-9d06-b33b107a43cf', '35f7435b-3a62-43a8-8d92-5e2292916821', 4900, 0, 0),
('e81d9fcd-1941-4dc2-b15d-676195bf6768', '53e6b7f7-65e3-468b-aa85-3aae65b1b78c', '0342d983-ab60-4169-a9ba-9f9c803ad618', 9000, 0, 0),
('eefb5e4a-c73f-4e33-a12d-4ac01df56b4b', 'a7e2adce-e5d0-4f62-81a6-eabe14c1a38a', '221def50-e968-45ea-bf07-b9aa5ac94b6e', 900, 0, 0),
('f2f879ee-d062-47ae-9436-8d1a5b332199', '720afd07-a54f-4daa-9041-80900c8c1561', '955ad284-d586-46aa-9b7c-2e5e9fee0406', 2900, 0, 120000),
('fef278ba-963d-4791-b4bb-0cb442d1e1db', 'b71513fb-b4cb-4fec-bfb3-b4ff2fd23e99', '221def50-e968-45ea-bf07-b9aa5ac94b6e', 500, 0, 0);
-- --------------------------------------------------------
--
-- Структура таблицы `BookingLabel`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "BookingLabel" CASCADE;
CREATE TABLE IF NOT EXISTS "BookingLabel" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "authorId" TEXT DEFAULT NULL,
  "text" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT 'amber',
  "dueDate" TIMESTAMPTZ DEFAULT NULL,
  "shift" TEXT DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--
-- Дамп данных таблицы `BookingLabel`
--
INSERT INTO "BookingLabel" ("id", "bookingId", "authorId", "text", "color", "dueDate", "shift", "createdAt") VALUES
('0b65d3de-037d-49cd-ae89-c6062460c471', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'новая метка', 'purple', '2026-04-25 00:00:00.000', 'единственная', '2026-04-06 14:34:42.870'),
('5733f07f-0f8d-4190-abf4-a551f1c734d7', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'зеленая метка !!!', 'green', '2026-04-08 00:00:00.000', 'что-то тут можно написать ', '2026-04-06 17:21:35.782'),
('f29d14b6-721f-41f8-a53e-82c6d23344c7', '720afd07-a54f-4daa-9041-80900c8c1561', 'db3ae213-c165-453e-bf62-d48f6198449c', 'новая желтая метка', 'amber', '2026-04-15 00:00:00.000', '', '2026-04-14 06:44:56.356');
-- --------------------------------------------------------
--
-- Структура таблицы `BookingPayment`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "BookingPayment" CASCADE;
CREATE TABLE IF NOT EXISTS "BookingPayment" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "authorId" TEXT DEFAULT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "note" TEXT,
  "paidAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "type" "PaymentType" NOT NULL DEFAULT 'PAYMENT'
);
--
-- Дамп данных таблицы `BookingPayment`
--
INSERT INTO "BookingPayment" ("id", "bookingId", "authorId", "amount", "method", "note", "paidAt", "createdAt", "type") VALUES
('3042507b-a0c3-40d5-b97d-1d52447b1e84', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 1000, 'CASH'::"PaymentMethod", '', '2026-04-14 19:52:25.454', '2026-04-14 19:52:25.456', 'PAYMENT'::"PaymentType"),
('34b90154-a124-4cf8-baf4-16fb84430536', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 3700, 'CARD'::"PaymentMethod", NULL, '2026-04-08 11:19:00.000', '2026-04-08 14:19:54.555', 'PAYMENT'::"PaymentType"),
('577b316d-51f3-4e22-a74d-32290b9b34fd', '720afd07-a54f-4daa-9041-80900c8c1561', 'db3ae213-c165-453e-bf62-d48f6198449c', 1000, 'CASH'::"PaymentMethod", NULL, '2026-04-14 03:39:00.000', '2026-04-14 06:39:41.923', 'PAYMENT'::"PaymentType"),
('67a43210-70c2-4a6e-8f28-a0f325d05338', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 10000, 'CASH'::"PaymentMethod", NULL, '2026-04-14 05:18:00.000', '2026-04-14 08:18:53.307', 'PAYMENT'::"PaymentType"),
('6ac97e27-850a-4ba4-accb-c57671cd4f5b', 'ff59d135-5108-4eee-900e-f7ba84e007e0', 'db3ae213-c165-453e-bf62-d48f6198449c', -200, 'TRANSFER'::"PaymentMethod", 'Возврат переплаты на баланс клиента', '2026-04-14 11:59:22.804', '2026-04-14 11:59:23.228', 'PAYMENT'::"PaymentType"),
('7d5e2127-7a45-49f1-83f5-8c943bcf1efd', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 500, 'CASH'::"PaymentMethod", NULL, '2026-04-14 08:22:00.000', '2026-04-14 11:23:42.463', 'PAYMENT'::"PaymentType"),
('7fa33565-2b7b-46ca-8c5f-01dca83388e6', '8fd232a3-fe32-4577-82b5-2098c306daa9', 'db3ae213-c165-453e-bf62-d48f6198449c', 1700, 'BALANCE'::"PaymentMethod", NULL, '2026-04-14 08:24:00.000', '2026-04-14 11:25:14.384', 'PAYMENT'::"PaymentType"),
('9ed518be-9ec0-4334-af17-cb3e4c0f0533', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 5700, 'CASH'::"PaymentMethod", NULL, '2026-04-08 10:43:00.000', '2026-04-08 13:44:30.004', 'PAYMENT'::"PaymentType"),
('bb0704bf-7446-4d90-accb-ea36345f63ac', 'ff59d135-5108-4eee-900e-f7ba84e007e0', 'db3ae213-c165-453e-bf62-d48f6198449c', 1000, 'CASH'::"PaymentMethod", NULL, '2026-04-14 08:52:00.000', '2026-04-14 11:53:07.453', 'PAYMENT'::"PaymentType"),
('d4f2c228-dc7c-4761-8f99-f701b36d4a27', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', 500, 'CASH'::"PaymentMethod", NULL, '2026-04-14 14:22:00.000', '2026-04-14 17:23:15.459', 'PAYMENT'::"PaymentType"),
('f11c7d21-a497-458b-bca9-f87d083a6dfc', '46dca1ff-3302-4762-9f42-1f2237dfcd67', 'db3ae213-c165-453e-bf62-d48f6198449c', -8500, 'TRANSFER'::"PaymentMethod", 'Возврат переплаты на баланс клиента', '2026-04-14 12:02:03.219', '2026-04-14 12:02:03.656', 'PAYMENT'::"PaymentType");
-- --------------------------------------------------------
--
-- Структура таблицы `CartItem`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 18:31
--
DROP TABLE IF EXISTS "CartItem" CASCADE;
CREATE TABLE IF NOT EXISTS "CartItem" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "addedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "bookedAt" TIMESTAMPTZ DEFAULT NULL,
  "prepaidAt" TIMESTAMPTZ DEFAULT NULL,
  "fullyPaidAt" TIMESTAMPTZ DEFAULT NULL,
  "depositPaidAt" TIMESTAMPTZ DEFAULT NULL,
  "depositReturnedAt" TIMESTAMPTZ DEFAULT NULL,
  "depositAmount" DOUBLE PRECISION DEFAULT 0,
  "completedAt" TIMESTAMPTZ DEFAULT NULL,
  "cancelledAt" TIMESTAMPTZ DEFAULT NULL,
  "changeLog" JSONB NOT NULL
);
--
-- Дамп данных таблицы `CartItem`
--
INSERT INTO "CartItem" ("id", "userId", "equipmentId", "quantity", "addedAt", "bookedAt", "prepaidAt", "fullyPaidAt", "depositPaidAt", "depositReturnedAt", "depositAmount", "completedAt", "cancelledAt", "changeLog") VALUES
('c27d2137-2700-4b7e-9f8c-4be4fcbb37a1', 'db3ae213-c165-453e-bf62-d48f6198449c', '0036d878-fca5-4a95-a740-f6b9c3271e37', 1, '2026-04-22 18:31:08.327', NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '[]');
-- --------------------------------------------------------
--
-- Структура таблицы `Category`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "Category" CASCADE;
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "iconName" TEXT NOT NULL DEFAULT 'Package',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "adminNotes" TEXT DEFAULT NULL,
  "imageUrl" TEXT DEFAULT NULL,
  "isModular" BOOLEAN NOT NULL DEFAULT FALSE
);
--
-- Дамп данных таблицы `Category`
--
INSERT INTO "Category" ("id", "name", "slug", "iconName", "sortOrder", "adminNotes", "imageUrl", "isModular") VALUES
('00abe910-a81b-420b-85dd-13cee1fe90ae', 'Стойки и фоны', 'stands', 'FrameCorners', 14, NULL, NULL, false),
('18f91ba0-1ea3-46ba-8699-3eafd3547190', 'Камеры', 'kamery', 'Camera', 1, 'Общая категория для всех типов и брендов фото и видео камер', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/category_images/0c4de551-a9f3-41ad-ab30-d1b32b805c62.webp', false),
('1aed3cf4-e394-4e24-9557-89c1d840eb69', 'Электроника', 'electronics', 'DeviceLaptop', 15, NULL, NULL, false),
('36186632-cb84-46f2-b98c-7110e2ed5b16', 'Свет', 'svet', 'Lightbulb', 3, NULL, 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/category_images/54696fa4-c106-4609-ad3d-b7da8aac3be1.webp', false),
('367d21ef-fb13-40b9-ada3-f57e176b5b52', 'Стабилизация', 'stabilizacziya', 'Drone', 11, NULL, NULL, false),
('38a87130-eea3-4a01-8f39-7fcd77924758', 'Накамерный свет', 'on-camera-light', 'Video', 8, NULL, NULL, false),
('3e5f74c6-a021-4395-bd8d-c98cf13e4dbb', 'Штативы', 'tripods', 'ArrowsOutLineVertical', 10, NULL, NULL, false),
('7058f698-8db0-4bcb-92f3-cc2ae32d127b', 'Услуги', 'services', 'HandshakeSimple', 18, NULL, NULL, false),
('85f96900-25c9-48e6-9dce-9d34c0681232', 'Звук', 'zvuk', 'Microphone', 4, NULL, 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/category_images/815eff30-0282-48a0-a938-b7d4922d68e8.webp', false),
('8a37f010-db5f-41b1-a396-bedc69079104', 'Спецэффекты', 'special-effects', 'Sparkle', 13, NULL, NULL, false),
('9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'Прочее', 'other', 'Box', 17, NULL, NULL, false),
('b70659ef-a926-4624-aefe-a5977d2fca7e', 'Мобильный свет', 'mobile-light', 'Lightbulb', 9, NULL, NULL, false),
('be1782c3-b0f4-4df6-9984-6c1babc64595', 'Модификаторы света', 'light-modifiers', 'Umbrella', 7, NULL, NULL, false),
('c92c4d91-dd94-410e-b071-0e5eacb1244a', 'Импульсный свет', 'strobe', 'Lightning', 6, NULL, NULL, false),
('d7aabe3d-b739-44b3-94e4-804f7904d548', 'Постоянный свет', 'constant-light', 'Lightbulb', 5, NULL, NULL, false),
('d99b02ca-b401-4aa8-885c-f10f588aad79', 'Журавли и слайдеры', 'jibs', 'ArrowsOutLineVertical', 16, NULL, NULL, false),
('dc761cba-1e4b-4aaa-9435-5749a2afed31', 'Крепёж', 'krepezh', 'Wrench', 12, NULL, NULL, false),
('eea82e65-767e-4832-9809-3032e816a9eb', 'Объективы', 'obektivy', 'Aperture', 2, NULL, 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/category_images/4813d7c9-450b-4586-a561-ee7fd95ea7c1.webp', false);
-- --------------------------------------------------------
--
-- Структура таблицы `CategoryHistory`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "CategoryHistory" CASCADE;
CREATE TABLE IF NOT EXISTS "CategoryHistory" (
  "id" TEXT NOT NULL,
  "entityType" "CategoryEntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" "HistoryAction" NOT NULL,
  "changedBy" TEXT DEFAULT NULL,
  "changes" JSONB DEFAULT NULL,
  "changedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--
-- Дамп данных таблицы `CategoryHistory`
--
INSERT INTO "CategoryHistory" ("id", "entityType", "entityId", "action", "changedBy", "changes", "changedAt") VALUES
('00deeaf2-e788-41e6-ac3b-9ca7b868d4fa', 'SUBCATEGORY'::"CategoryEntityType", 'abfc7365-ee2c-424b-bdbe-d8888415c11a', 'CREATED'::"HistoryAction", NULL, 'null', '2026-03-27 21:30:55.118'),
('26f4b0d5-f8cb-41ae-8edb-e0a7d89e492b', 'CATEGORY'::"CategoryEntityType", '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'UPDATED'::"HistoryAction", NULL, '{}', '2026-03-31 08:06:13.556'),
('2a83e382-cf01-4014-bfab-b1c7cdd93c2b', 'CATEGORY'::"CategoryEntityType", '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'UPDATED'::"HistoryAction", NULL, '{}', '2026-03-31 07:47:36.183'),
('314bd713-a34f-45b0-9ec2-52b1f2ac9f4c', 'CATEGORY'::"CategoryEntityType", '367d21ef-fb13-40b9-ada3-f57e176b5b52', 'UPDATED'::"HistoryAction", NULL, '{"name": ["Стабилизаторы", "Стабилизация"], "slug": ["stabilizers", "stabilizacziya"]}', '2026-03-27 21:32:28.722'),
('320b0e08-f515-45ed-b9d9-c1d1561dc9c9', 'CATEGORY'::"CategoryEntityType", '85f96900-25c9-48e6-9dce-9d34c0681232', 'UPDATED'::"HistoryAction", NULL, '{"slug": ["audio", "zvuk"]}', '2026-03-31 08:57:09.195'),
('5d03bbb0-e77f-4d81-a775-ca8fff1012c0', 'CATEGORY'::"CategoryEntityType", '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'UPDATED'::"HistoryAction", NULL, '{}', '2026-03-30 19:53:16.230'),
('83557eff-ef28-4193-a94d-54fd54308347', 'CATEGORY'::"CategoryEntityType", '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'UPDATED'::"HistoryAction", NULL, '{}', '2026-03-27 21:34:37.170'),
('858e0998-0526-4263-83da-ace8b951fd4b', 'SUBCATEGORY'::"CategoryEntityType", 'd52fab08-fc51-42a5-9eda-20432ef5d49c', 'CREATED'::"HistoryAction", NULL, 'null', '2026-03-27 19:24:17.622'),
('8ec0f46a-99b1-4aa9-92fe-881eb77cc22e', 'CATEGORY'::"CategoryEntityType", '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'UPDATED'::"HistoryAction", NULL, '{}', '2026-03-31 08:00:51.243'),
('9261f0ed-5364-4c0a-9399-7f57edb515f7', 'CATEGORY'::"CategoryEntityType", '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'UPDATED'::"HistoryAction", NULL, '{}', '2026-03-31 08:52:03.985'),
('9afeb6c6-77bf-4bb6-8c25-f1984f7ab93d', 'CATEGORY'::"CategoryEntityType", '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'UPDATED'::"HistoryAction", NULL, '{}', '2026-03-27 21:33:41.303'),
('b7ca7ccb-a751-4a45-8a7b-406b4ff96a8f', 'SUBCATEGORY'::"CategoryEntityType", '01e05ea6-a04d-4f3f-bafc-958500b82bb3', 'CREATED'::"HistoryAction", NULL, 'null', '2026-03-27 19:22:28.018'),
('c1e32576-01c8-4cdb-a08c-bc07cc5c2b8c', 'CATEGORY'::"CategoryEntityType", 'eea82e65-767e-4832-9809-3032e816a9eb', 'UPDATED'::"HistoryAction", NULL, '{"slug": ["lenses", "obektivy"]}', '2026-03-31 08:02:03.082'),
('c49c6bbf-6a95-409a-ac3c-10d871280999', 'CATEGORY'::"CategoryEntityType", '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'UPDATED'::"HistoryAction", NULL, '{}', '2026-03-30 19:42:33.544'),
('c9a2ffd5-eca9-497e-9c56-4e1527f19f08', 'CATEGORY'::"CategoryEntityType", '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'UPDATED'::"HistoryAction", NULL, '{}', '2026-03-27 21:34:15.755'),
('d68f3aee-6dd4-4c0c-a960-5f3f99d889cb', 'CATEGORY'::"CategoryEntityType", '36186632-cb84-46f2-b98c-7110e2ed5b16', 'UPDATED'::"HistoryAction", NULL, '{"slug": ["light", "svet"]}', '2026-03-31 08:41:05.136'),
('fe1e6fe7-f43f-4734-b9b7-10f1c74954f4', 'CATEGORY'::"CategoryEntityType", '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'UPDATED'::"HistoryAction", NULL, '{"isModular": [true, false], "adminNotes": [null, "Общая категория для всех типов и брендов фото и видео камер"]}', '2026-03-27 12:52:11.825');
-- --------------------------------------------------------
--
-- Структура таблицы `ClientApplication`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "ClientApplication" CASCADE;
CREATE TABLE IF NOT EXISTS "ClientApplication" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clientType" TEXT NOT NULL,
  "applicationData" JSONB NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  "rejectionReason" TEXT DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  "adminOverrides" JSONB NOT NULL
);
--
-- Дамп данных таблицы `ClientApplication`
--
INSERT INTO "ClientApplication" ("id", "userId", "clientType", "applicationData", "status", "rejectionReason", "createdAt", "updatedAt", "adminOverrides") VALUES
('3cf12e62-2271-4a29-98ea-9546e579296f', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'individual', '{"agreements": {"promoCode": "", "personalDataConsent": true}, "clientType": "individual", "applicationData": {"contacts": {"socials": [{"url": "@test_user"}]}, "passport": {"issuedBy": "6fc08e02d86015202f9fda4c:967f4f8af55b0848abbef1fa69881949:396e8bd085e12242c97fef7aba452a8df2466025", "issueDate": "21.06.1989", "seriesAndNumber": "dfef139d4ff408a774ea353e:9d26599e6b730293c31d25fdc58d186b:af9bc2ef9b47b2ec468126"}, "addresses": {"actual": {"city": "тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох)", "index": "187342", "region": "Ленинградская обл", "address": "Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия", "country": "Россия"}, "isSame": true, "registration": {"city": "тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох)", "index": "187342", "region": "Ленинградская обл", "address": "Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия", "country": "Россия"}}, "additional": {"labels": [{"id": "3529661f-fdb8-46ed-a6d8-62997c8833b3", "text": "для лучших", "color": "green"}, {"id": "c20c0650-e1a2-4a18-bba9-2310873a03bc", "text": "для интересненьких", "color": "purple"}, {"id": "743525f4-1478-48f1-969b-b8cda74af64c", "text": "ну и просто метка", "color": "gray"}], "recommendation": "фото кто-то", "referralSource": "other"}, "personalData": {"name": "Бубнов Роман Романович", "birth": "21.06.1989", "email": "roman.bubnov.1989@gmail.com", "phone": "+7(777)777-77-75"}}}', 'APPROVED'::"ApplicationStatus", NULL, '2026-04-09 09:02:13.450', '2026-04-18 14:41:10.592', '{"applicationData": {"contacts": {"email": "roman.bubnov.1989@gmail.com", "phone": "+7(777)777-77-75", "socials": [{"url": "@kilkun"}], "extraPhone": ""}, "passport": {"issuedAt": "21.06.1989", "issuedBy": "f5c29e8309e3e95dffa81dcd:d19db152d6dd3c91a4e8cb7c1e867bc4:2efba896ae0f18f9ffeb0aa366ac5e1907699a46", "seriesAndNumber": "667158f9a0f792a49144cd7c:900e65f8d0ce8a4986d8706f97d5a917:76f93f7d903722d6ddb2e529", "registrationAddress": "Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия "}, "addresses": {"actual": {"address": "Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия "}, "registration": {"address": "Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия"}}, "additional": {"labels": [{"id": "81fc52f1-9ed8-47a0-a779-5d4bdea78b95", "text": "это лучший клиент !!!!", "color": "gray"}, {"id": "0fbb7d42-30ec-47d3-b9ad-d1057c378511", "text": "желтую меточку подвезли", "color": "amber", "dueDate": ""}], "recommendation": "фото кто-то"}, "personalData": {"lastName": "Бубнов", "birthDate": "21.06.1989", "firstName": "Роман", "middleName": "Александрович"}}}'),
('436f6e91-5ce4-4a8d-b291-504548830544', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'individual', '{"clientType": "individual", "applicationData": {"passport": {"issuedBy": "Советским РУВД г.Самары\\n", "issueDate": "25.08.2004", "seriesAndNumber": "3604 997223"}, "addresses": {"actual": {"city": "", "index": "", "region": "", "address": "", "country": ""}, "isSame": false, "registration": {"city": "", "index": "", "region": "", "address": "Николаевский проспект", "country": ""}}, "personalData": {"name": "Ненашев Александр Викторович", "birth": "02.04.1984", "email": "volnd@yandex.ru", "phone": "+7(927)655-44-97"}}}', 'APPROVED'::"ApplicationStatus", NULL, '2026-03-31 16:03:29.042', '2026-04-02 20:05:36.991', 'null'),
('80c5c62b-0a1a-410e-9d0a-1faa87a58372', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'individual', '{"agreements": {"promoCode": "", "personalDataConsent": true}, "clientType": "individual", "applicationData": {"contacts": {"socials": [{"url": "@user"}]}, "passport": {"issuedBy": "что то тут тоже", "issueDate": "21.12.1981", "seriesAndNumber": "1111111111"}, "addresses": {"actual": {"city": "г Москва", "index": "111677", "region": "г Москва", "address": "г Москва, пр-кт Защитников Москвы", "country": "Россия"}, "isSame": true, "registration": {"city": "г Москва", "index": "111677", "region": "г Москва", "address": "г Москва, пр-кт Защитников Москвы", "country": "Россия"}}, "additional": {"referralSource": "vk"}, "personalData": {"name": "Иванов Иван Иванович", "birth": "21.12.1981", "email": "kilkun@icloud.com", "phone": "+7(927)147-98-65"}}}', 'REVIEWING'::"ApplicationStatus", NULL, '2026-03-23 11:49:22.880', '2026-04-18 18:42:56.008', '{"agreements": {"promoCode": "", "personalDataConsent": true}, "clientType": "individual", "applicationData": {"contacts": {"socials": [{"url": "@user"}]}, "passport": {"issuedBy": "что то тут тоже", "issueDate": "21.12.1981", "seriesAndNumber": "1111111111"}, "addresses": {"actual": {"city": "г Москва", "index": "111677", "region": "г Москва", "address": "г Москва, пр-кт Защитников Москвы", "country": "Россия"}, "isSame": true, "registration": {"city": "г Москва", "index": "111677", "region": "г Москва", "address": "г Москва, пр-кт Защитников Москвы", "country": "Россия"}}, "additional": {"referralSource": "vk"}, "personalData": {"name": "Иванов Иван Иванович", "birth": "21.12.1981", "email": "kilkun@icloud.com", "phone": "+7(927)147-98-65"}}}'),
('827595d9-903f-49b9-b0bb-b26fb6231689', 'db3ae213-c165-453e-bf62-d48f6198449c', 'individual', '{"agreements": {"promoCode": ""}, "clientType": "individual", "applicationData": {"contacts": {"socials": [{"url": "@kilkun"}, {"url": "https://www.youtube.com/"}]}, "passport": {"issuedBy": "укукукукукуууууууууу", "issueDate": "21.06.1989", "seriesAndNumber": "1234 123456"}, "addresses": {"actual": {"city": "", "index": "", "region": "", "address": "", "country": ""}, "isSame": true, "registration": {"city": "", "index": "", "region": "", "address": "", "country": ""}}, "additional": {"recommendation": "", "referralSource": "other"}, "personalData": {"name": "Администратор Николаевна Иванова", "birth": "21.06.1989", "email": "linzarental@yandex.ru", "phone": ""}}}', 'APPROVED'::"ApplicationStatus", NULL, '2026-03-26 08:43:20.464', '2026-04-13 18:22:02.034', '{"agreements": {"promoCode": ""}, "clientType": "individual", "applicationData": {"contacts": {"socials": [{"url": "@kilkun"}, {"url": "https://www.youtube.com/"}]}, "passport": {"issuedBy": "", "issueDate": "", "seriesAndNumber": ""}, "addresses": {"actual": {"city": "", "index": "", "region": "", "address": "", "country": ""}, "isSame": true, "registration": {"city": "", "index": "", "region": "", "address": "", "country": ""}}, "additional": {"recommendation": "", "referralSource": "other"}, "personalData": {"name": "аккаунт админов Linza", "birth": "", "email": "linzarental@yandex.ru", "phone": ""}}}'),
('b7a6cdf9-ef7d-4ffc-9aa0-67ecf5b307c5', '3f1ab5b9-bc03-4840-bbe4-2daeedf8f8bf', 'individual', '{"clientType": "individual", "applicationData": {"passport": {"issuedBy": "", "issueDate": "", "seriesAndNumber": ""}, "personalData": {"name": "", "birth": "", "email": "kilkun@mail.ru", "phone": ""}}}', 'CLARIFICATION'::"ApplicationStatus", NULL, '2026-03-23 11:42:45.984', '2026-04-13 14:36:15.455', 'null');
-- --------------------------------------------------------
--
-- Структура таблицы `DocumentGenerationLog`
--
-- Создание: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "DocumentGenerationLog" CASCADE;
CREATE TABLE IF NOT EXISTS "DocumentGenerationLog" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "generatedUrl" TEXT NOT NULL,
  "generatedBy" TEXT DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- --------------------------------------------------------
--
-- Структура таблицы `DocumentTemplate`
--
-- Создание: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "DocumentTemplate" CASCADE;
CREATE TABLE IF NOT EXISTS "DocumentTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "DocumentTemplateType" NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileFormat" TEXT NOT NULL,
  "variables" JSONB NOT NULL DEFAULT '[]',
  "description" TEXT DEFAULT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdBy" TEXT DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL
);
-- --------------------------------------------------------
--
-- Структура таблицы `Equipment`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "Equipment" CASCADE;
CREATE TABLE IF NOT EXISTS "Equipment" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "pricePerDay" DOUBLE PRECISION NOT NULL,
  "price4h" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "price8h" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "replacementValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "categoryId" TEXT NOT NULL,
  "subcategoryId" TEXT DEFAULT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT TRUE,
  "isPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
  "inventoryNumber" TEXT DEFAULT NULL,
  "defects" TEXT,
  "kit" TEXT,
  "kitDescription" TEXT,
  "ownershipType" "OwnershipType" NOT NULL DEFAULT 'INTERNAL',
  "partnerName" TEXT DEFAULT NULL,
  "specifications" JSONB NOT NULL,
  "comments" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  "videoUrls" JSONB NOT NULL
);
--
-- Дамп данных таблицы `Equipment`
--
INSERT INTO "Equipment" ("id", "title", "slug", "description", "pricePerDay", "price4h", "price8h", "deposit", "replacementValue", "categoryId", "subcategoryId", "isAvailable", "isPrimary", "status", "inventoryNumber", "defects", "kit", "kitDescription", "ownershipType", "partnerName", "specifications", "comments", "createdAt", "updatedAt", "videoUrls") VALUES
('0036d878-fca5-4a95-a740-f6b9c3271e37', 'Параболический софтбокс Godox QR-P 90 см быстроскладной', 'parabolicheskij-softboks-godox-qr-p-90-sm-bystroskladnoj', NULL, 1700, 1020, 1360, 0, 17000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '27909c1c-a781-477c-a420-583fe8465baf', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:58.202', '2026-03-27 23:24:58.202', '[]'),
('0101d0f5-67b3-45fd-8a12-90bf550f4503', 'Микрофон конденсаторный Sony ECM 674 S/2000', 'mikrofon-kondensatornyj-sony-ecm-674-s2000', 'комплектация:\r\n1. Мягкий чехол\r\n2.микрофон  \r\n3.xlr-xlr кабель \r\n4.силиконовый кожух\r\n5.мягкий тейп \r\n6.ветрозащита \r\n7.крепление под микрофон', 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fef135f8-8186-4192-b697-22c165b4e838', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:58.418', '2026-03-27 23:24:58.418', '[]'),
('02590486-a46a-4ed7-96bd-865eedae4343', 'Ноутбук Acer Nitro 5', 'noutbuk-acer-nitro-5', NULL, 12000, 7200, 9600, 0, 120000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:58.540', '2026-03-27 23:24:58.540', '[]'),
('02793c8a-1d7a-4b53-baff-4c7e39fe5e05', 'Объектив Nikon 24-70mm f/2.8E ED VR AF-S Nikkor байонет F', 'obektiv-nikon-24-70mm-f28e-ed-vr-af-s-nikkor-bajonet-f', NULL, 15000, 9000, 12000, 0, 150000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:58.661', '2026-03-27 23:24:58.661', '[]'),
('0324d986-2e70-484a-8b89-404ee21c1da2', 'Hoya защитный фильтр 67', 'hoya-zashhitnyj-filtr-67', NULL, 250, 150, 200, 0, 3000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:58.774', '2026-03-27 23:24:58.774', '[]'),
('0342d983-ab60-4169-a9ba-9f9c803ad618', 'Panasonic Lumix GH5 Body (V-LOG) English (Субаренда)', 'panasonic-lumix-gh5-body-v-log-english-subarenda', NULL, 15000, 9000, 12000, 140000, 150000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:58.895', '2026-03-27 23:24:58.895', '[]'),
('04e36ddc-0eae-4258-a376-a87fd7f883fa', 'Аккумулятор Sony NP-FM500H', 'akkumulyator-sony-np-fm500h', NULL, 650, 390, 520, 0, 8000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd989dfa9-6e2b-45b0-9dc0-4bb1f3e72b8a', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:59.012', '2026-03-27 23:24:59.012', '[]'),
('0668e322-1c11-432f-9515-9cbcaa65cad0', 'Крепление для отражателя', 'kreplenie-dlya-otrazhatelya', NULL, 500, 300, 400, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:59.239', '2026-03-27 23:24:59.239', '[]'),
('0744f3d1-8033-460d-8e18-eed8cd8aef70', 'Стрипбокс Godox SB-FW30120 120x30', 'stripboks-godox-sb-fw30120-120x30', 'Байонет Bowens', 700, 420, 560, 0, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:59.363', '2026-03-27 23:24:59.363', '[]'),
('0805f924-40a7-435d-b4a7-8a57610a890c', 'Зонт-октабокс 130 Photix', 'zont-oktaboks-130-photix', NULL, 400, 240, 320, 0, 4000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:59.508', '2026-03-27 23:24:59.508', '[]'),
('0811c32d-7000-41e2-a618-725baf9b08fd', 'Объектив Sony FE 24-70mm f/2.8 GM (RC)', 'obektiv-sony-fe-24-70mm-f28-gm-rc', NULL, 14000, 8400, 11200, 0, 140000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:59.631', '2026-03-27 23:24:59.631', '[]'),
('098b8246-b6c0-4098-a1b0-1ccb5dc0dd69', 'Софтбокс зонт. 90х60 Phottix', 'softboks-zont-90h60-phottix', NULL, 400, 240, 320, 0, 4000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:59.750', '2026-03-27 23:24:59.750', '[]'),
('0a764833-868a-42a3-b7e2-3008038febd5', 'Держатель для телефона на штатив (FUJIMI FJ-SMRC)', 'derzhatel-dlya-telefona-na-shtativ-fujimi-fj-smrc', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '38c9fec0-ed18-4a12-8385-ee14a84d2840', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:59.872', '2026-03-27 23:24:59.872', '[]'),
('0b52d7bc-2973-458f-92bf-48fafbd0adaa', 'Объектив Sony Zeiss 16-35 /4.0 (RC)', 'obektiv-sony-zeiss-16-35-40-rc', NULL, 8000, 4800, 6400, 0, 80000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:24:59.989', '2026-03-27 23:24:59.989', '[]'),
('0c0eab0b-617f-4c73-bac8-969709818d46', 'Конус с сотами на hensel', 'konus-s-sotami-na-hensel', NULL, 400, 240, 320, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '07e624c5-d2b1-4f43-a34c-3bf0e7392273', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:00.212', '2026-03-27 23:25:00.212', '[]'),
('0c26d0f4-b65d-4ea1-878d-dc81d633bc5f', 'Raylab 200', 'raylab-200', NULL, 1000, 600, 800, 0, 10000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd5c8de84-0ca0-416b-9bf6-09fe5f14dda7', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:00.329', '2026-03-27 23:25:00.329', '[]'),
('0c662e09-eec4-4628-aeb6-b415af1700cc', 'Помощь в доставке и установке оборудования', 'pomoshh-v-dostavke-i-ustanovke-oborudovaniya', 'Только установка оборудования, без выставления света.', 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '6603de92-9304-4431-b1a4-54d76ce063b5', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:00.451', '2026-03-27 23:25:00.451', '[]'),
('0c7e7c95-5b57-4a23-ac0b-3c4e958a6a42', 'Карта памяти CFexspress TypB 256GB', 'karta-pamyati-cfexspress-typb-256gb', NULL, 1600, 960, 1280, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:00.569', '2026-03-27 23:25:00.569', '[]'),
('0d6da18b-f0e1-4ec3-b667-5e642e84fa4e', 'Вспышка накамерная Godox TT600 4', 'vspyshka-nakamernaya-godox-tt600-4', NULL, 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '01c1d230-5aab-4e45-8c2e-3be9036117e9', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:00.686', '2026-03-27 23:25:00.686', '[]'),
('125b9805-f5a9-44b0-b92c-75332e09ebf6', 'Рефлектор на hensel 22см', 'reflektor-na-hensel-22sm', NULL, 400, 240, 320, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '07e624c5-d2b1-4f43-a34c-3bf0e7392273', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:00.807', '2026-03-27 23:25:00.807', '[]'),
('12d9fc65-97ba-4ac6-a105-7e210094e218', 'HDMI кабель 2', 'hdmi-kabel-2', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e69a50e6-352b-49dd-aa0f-1ddf2cf0f74a', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:00.923', '2026-03-27 23:25:00.923', '[]'),
('12dba31f-ea98-4299-8420-1f9db83c6eb9', 'Объектив Sony 18-105mm f/4 G OSS PZ E кроп (RC)', 'obektiv-sony-18-105mm-f4-g-oss-pz-e-krop-rc', NULL, 9000, 5400, 7200, 0, 90000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:01.044', '2026-03-27 23:25:01.044', '[]'),
('141e0f0b-76fe-4c50-be3e-63ad79726d19', 'Cинхронизатор Godox X pro - C', 'cinhronizator-godox-x-pro-c', NULL, 700, 420, 560, 3999, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:01.167', '2026-03-27 23:25:01.167', '[]'),
('152b0312-cc57-406f-97a1-217e78716f41', 'Sony a7 III', 'sony-a7-iii', 'Базовая версия третьего поколения беззеркальных фуллфреймов Sony позиционируется в качестве профи-инструмента, для которого практически не имеется невыполнимых задач. Внутри модели установлена обновлённая 24.3 МП матрица с обратной засветкой, благодаря чему камера демонстрирует более чистую от шумов картинку при съёмке на высоких значениях светочувствительности (рабочими считаются ISO вплоть до 12800-25600 единиц, а максимальная отметка ISO достигает цифры 204800). Система автоматической наводки на резкость у Sony A7 III body использует 693 точки фазового и 425 точек контрастного типа, покрывая 93 % площади кадра. Автофокусу под силу захватить объект съёмки чуть ли не в полной темноте, надёжно удерживая его в фокусе даже в режиме максимальной скорострельности (10 к/с). На стражу чёткости картинки при съёмке в условиях недостаточной освещённости поставлен 5-осевой матричный стаб, который способен компенсировать до 5 стопов экспозиции. Видеосъёмку беззеркалка производит в ультравысоком разрешении 4К со скоростью 24/30 к/с и битрейтом до 100 Мбит/с (8 бит 4:2:0 при записи на быструю карту памяти стандарта UHS-II и 8 bit 4:2:2 при передаче видеоряда через порт HDMI на внешний рекордер). Автономность камеры оценивается возможностью «отщёлкать» на одном заряде батареи свыше 600 фото.', 2900, 1740, 2320, 125000, 135000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'a694b2e9-c251-4dc1-a1cc-2e0a25263bd8', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:01.291', '2026-03-27 23:25:01.291', '[]'),
('156acbe5-c6a3-4792-a894-89c1cd6aa5aa', 'Canon EOS R6 Mark II (ЦМ)', 'canon-eos-r6-mark-ii-czm', NULL, 17000, 10200, 13600, 0, 170000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:01.408', '2026-03-27 23:25:01.408', '[]'),
('17896b6d-70c9-462d-ae6e-c36d5f0ae671', 'Проекционная насадка godox', 'proekczionnaya-nasadka-godox', NULL, 3000, 1800, 2400, 0, 30000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'bc2da058-c5f0-4b20-af1c-2d94f9b15f73', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:01.523', '2026-03-27 23:25:01.523', '[]'),
('1898118b-a187-45b8-8977-389db9373820', 'ND-фильтр 72мм fotga', 'nd-filtr-72mm-fotga', NULL, 400, 240, 320, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:01.641', '2026-03-27 23:25:01.641', '[]'),
('19ba2c0b-1705-4616-8465-e31f430b0b51', 'Nikon f75', 'nikon-f75', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '45e763b5-07b1-4561-bddc-a128ec7e2307', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:01.763', '2026-03-27 23:25:01.763', '[]'),
('1a1f4af1-bd7c-46c6-ba7e-0f972ae69c5c', 'Монитор Feelword F5 pro', 'monitor-feelword-f5-pro', NULL, 1500, 900, 1200, 0, 15000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '3148dc98-4cb7-4eb1-a6ff-aa6948c589d8', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:01.877', '2026-03-27 23:25:01.877', '[]'),
('1a31daa4-3fb0-4f2a-9d99-fdc40b45d0b6', 'YONGNUO YN-622N', 'yongnuo-yn-622n', NULL, 500, 300, 400, 0, 4800, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '34dc74c5-4710-4d6c-af2a-fda28b664812', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:01.998', '2026-03-27 23:25:01.998', '[]'),
('1a5656c6-5310-48a9-bcca-e77100909aff', 'Держатель для зонта (Phottix Varos II)', 'derzhatel-dlya-zonta-phottix-varos-ii', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '5b8299af-aea7-405d-9195-e3748e257930', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:02.365', '2026-03-27 23:25:02.365', '[]'),
('1b892614-b35a-40b6-94f1-b31b16adcb4b', 'Поляризационный фильтр 77mm', 'polyarizaczionnyj-filtr-77mm', NULL, 300, 180, 240, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '03be2f03-24bb-491c-ad34-bfb07a6f8079', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:02.614', '2026-03-27 23:25:02.614', '[]'),
('1bead0ba-a13f-4817-b188-1a723de3f9f8', 'Студия', 'studiya', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '6603de92-9304-4431-b1a4-54d76ce063b5', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:02.739', '2026-03-27 23:25:02.739', '[]'),
('1cf75905-b78d-4f68-971b-d329ae276e4e', 'HDMI кабель оптика', 'hdmi-kabel-optika', NULL, 250, 150, 200, 0, 3000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e69a50e6-352b-49dd-aa0f-1ddf2cf0f74a', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:02.962', '2026-03-27 23:25:02.962', '[]'),
('1d4c5c98-d546-4a55-962d-82cdf578163c', 'Дым-машина SINTEZ FOG MACHINE', 'dym-mashina-sintez-fog-machine', NULL, 1000, 600, 800, 0, 10000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:03.075', '2026-03-27 23:25:03.075', '[]'),
('1d9f48eb-49c9-4156-9602-567be3847d81', 'катушка удлинитель 50м', 'katushka-udlinitel-50m', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e10565bd-2004-4448-8c97-7f4c9b24741d', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:03.197', '2026-03-27 23:25:03.197', '[]'),
('1dc04855-b238-418f-b5e8-5df012fd36f0', 'Aputure Amaran 300C RGB', 'aputure-amaran-300c-rgb', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fa93058e-0c39-479a-8782-f175d62aa148', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:03.313', '2026-03-27 23:25:03.313', '[]'),
('1de48145-d13f-4e08-a394-08f60769a8e4', 'Объектив Sirui Sniper 23mm F1.2 AF Lens (байонет E, на кроп) (Делайт)', 'obektiv-sirui-sniper-23mm-f12-af-lens-bajonet-e-na-krop-delajt', NULL, 3000, 1800, 2400, 0, 30000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:03.433', '2026-03-27 23:25:03.433', '[]'),
('1e2ec39a-c751-4e37-9f69-d5c23d0db1dc', 'Jinbei EF-150 Led', 'jinbei-ef-150-led', NULL, 1500, 900, 1200, 0, 15000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:03.557', '2026-03-27 23:25:03.557', '[]'),
('1e343710-7853-44c8-a5a8-d0c05b8433ab', 'Радиосистема Ulanzi U-Mic AM18', 'radiosistema-ulanzi-u-mic-am18', 'Комплектация:\r\nприёмник\r\nпередатчик (2шт)\r\nзарядный кейс\r\nветрозащита ворсовая (2шт)\r\nаудиокабель mini Jack TRS\r\nзарядный кабель Type-C\r\nаудиокабель Lightning\r\nаудиокабель Type-C\r\nчехол', 800, 480, 640, 0, 12000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fef135f8-8186-4192-b697-22c165b4e838', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:03.675', '2026-03-27 23:25:03.675', '[]'),
('1f47952d-c410-4a6c-9087-5bb12bc833ec', 'Canon RF 35mm F1.8 MACRO IS STM (RC)', 'canon-rf-35mm-f18-macro-is-stm-rc', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:03.789', '2026-03-27 23:25:03.789', '[]'),
('1f4b9bab-5cee-4d40-b08c-31679a41dd57', 'Монопод для софтбокса (Godox AD-S13) 62-157 см', 'monopod-dlya-softboksa-godox-ad-s13-62-157-sm', NULL, 400, 240, 320, 0, 4000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:03.905', '2026-03-27 23:25:03.905', '[]'),
('221def50-e968-45ea-bf07-b9aa5ac94b6e', 'Стойка Manfrotto 052B (280мм)', 'stojka-manfrotto-052b-280mm-6', '', 300, 100, 150, 0, 15000, '36186632-cb84-46f2-b98c-7110e2ed5b16', 'd52fab08-fc51-42a5-9eda-20432ef5d49c', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", 'Стойка Manfrotto 052B (280мм) - 6', '', '', '', 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:04.032', '2026-04-18 15:06:59.323', '[]'),
('22c2487b-3e53-4e03-a5e0-7906a2ed6609', 'Hollyland lark max', 'hollyland-lark-max', NULL, 3500, 2100, 2800, 0, 35000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '45986e26-580e-44ae-b8bb-7f3efeac8651', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:04.152', '2026-03-27 23:25:04.152', '[]'),
('22e7d9e3-ce4d-4c58-8a94-7f0dd9ec1627', 'Black mist 1/4 77мм фильтр', 'black-mist-14-77mm-filtr', NULL, 400, 240, 320, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:04.324', '2026-03-27 23:25:04.324', '[]'),
('2354d900-3a5a-4eb0-91c9-47cb5458550a', 'Аккумулятор NP-FW50RC 2', 'akkumulyator-np-fw50rc-2', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:04.447', '2026-03-27 23:25:04.447', '[]'),
('23944f45-adec-40ac-a1a9-e13df982e8c1', 'Рефлектор на hensel 18см', 'reflektor-na-hensel-18sm', NULL, 300, 180, 240, 0, 4000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '07e624c5-d2b1-4f43-a34c-3bf0e7392273', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:04.569', '2026-03-27 23:25:04.569', '[]'),
('24921afc-e1e2-403f-894f-61fdbb4663ea', 'Переходник HDMI - miniHDMI', 'perehodnik-hdmi-minihdmi', NULL, 200, 120, 160, 0, 800, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '782c15ff-3437-4eb8-aa35-d209a5c56f78', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:04.688', '2026-03-27 23:25:04.688', '[]'),
('257f9117-cb75-435e-b11b-c0dd9f5a8fbc', 'Сумка-противовес для песка Manfrotto (мешок, sandbag)', 'sumka-protivoves-dlya-peska-manfrotto-meshok-sandbag', NULL, 700, 420, 560, 0, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '1937fcea-467d-4cb8-b0c5-5b7930bc9a99', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:04.803', '2026-03-27 23:25:04.803', '[]'),
('26814dbb-f9de-4961-803c-abc6d009f402', 'Шторы на raylab', 'shtory-na-raylab', NULL, 200, 120, 160, 0, 1500, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '07e624c5-d2b1-4f43-a34c-3bf0e7392273', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:04.919', '2026-03-27 23:25:04.919', '[]'),
('268a4639-8134-4435-8142-29983f5d532a', 'Шторы на hensel', 'shtory-na-hensel', NULL, 550, 330, 440, 0, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '07e624c5-d2b1-4f43-a34c-3bf0e7392273', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:05.135', '2026-03-27 23:25:05.135', '[]'),
('26da004f-521f-453f-bbf0-167a22205106', 'призма гало 77мм', 'prizma-galo-77mm', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:05.251', '2026-03-27 23:25:05.251', '[]'),
('279adb89-b4b5-476b-804c-883b40534127', 'Объектив Sony 35 1.4 Zeiss', 'obektiv-sony-35-14-zeiss', NULL, 9500, 5700, 7600, 83000, 93000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:05.364', '2026-03-27 23:25:05.364', '[]'),
('2831ecf9-a140-4197-8221-4d2aafaaf323', 'Кабель XLR', 'kabel-xlr', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '521c348b-ec82-4132-8751-5d5e6f188e98', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:05.507', '2026-03-27 23:25:05.507', '[]'),
('2852caac-5a98-47db-b266-f92a8d17800b', 'Вспышка аккумуляторная Godox Witstro AD300Pro', 'vspyshka-akkumulyatornaya-godox-witstro-ad300pro', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '01c1d230-5aab-4e45-8c2e-3be9036117e9', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:05.635', '2026-03-27 23:25:05.635', '[]'),
('287bbec3-c3a0-4809-943b-7ee7d05eeb4e', 'Canon 50mm 1.4', 'canon-50mm-14', NULL, 15000, 9000, 12000, 0, 150000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:05.755', '2026-03-27 23:25:05.755', '[]'),
('288514b0-63c9-4bcc-b0e8-e56fa14eeee2', 'Spyder4pro', 'spyder4pro', 'Калибратор дисплеев Datacolor Spyder4Pro c адаптацией под условия освещения, колориметр и программное обеспечение', 4000, 2400, 3200, 5000, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '3148dc98-4cb7-4eb1-a6ff-aa6948c589d8', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:05.979', '2026-03-27 23:25:05.979', '[]'),
('2a7e34ce-382b-4e36-9961-3864b812c5b2', 'синхронизатор Godox X1T-F', 'sinhronizator-godox-x1t-f', NULL, 700, 420, 560, 0, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '9efb339e-c09a-45e1-8056-081e645680f3', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:06.319', '2026-03-27 23:25:06.319', '[]'),
('2ac3929a-6021-46c7-9148-5b8b6f384b58', 'Объектив Tamron 28-75mm f/2.8 Di III Sony E', 'obektiv-tamron-28-75mm-f28-di-iii-sony-e', NULL, 9000, 5400, 7200, 78000, 88000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:06.439', '2026-03-27 23:25:06.439', '[]'),
('2b4d72d2-acc5-417c-91e8-63971d579a52', 'Вспышка накамерная Godox TT600 2', 'vspyshka-nakamernaya-godox-tt600-2', NULL, 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '01c1d230-5aab-4e45-8c2e-3be9036117e9', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:06.563', '2026-03-27 23:25:06.563', '[]'),
('2bf3b90e-8204-44fe-b3fb-a3a069da201b', 'Микрофон пушка Godox VS-Mic накамерный', 'mikrofon-pushka-godox-vs-mic-nakamernyj', NULL, 300, 180, 240, 0, 3000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fef135f8-8186-4192-b697-22c165b4e838', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:06.929', '2026-03-27 23:25:06.929', '[]'),
('2bf830e5-c261-4ce4-8a6d-117786242276', 'Хромакей большой', 'hromakej-bolshoj', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f8196d71-c99e-4bc2-a902-6cdaaf1352de', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:07.164', '2026-03-27 23:25:07.164', '[]'),
('2eeac028-adbe-492b-be15-8d4dd026fb20', 'Адаптер (переходник) METABONES EF-E MARK V (RC)', 'adapter-perehodnik-metabones-ef-e-mark-v-rc', 'позволяет устанавливать объективы с байонетом Canon EF и Canon EF-S на камеры Sony с байонетом Sony E.\r\nпри использовании такого адаптера сохраняются следующие функции объектива\r\nуправление диафрагмой\r\nавтоматическая фокусировка\r\nработа стабилизатора изображения Canon IS\r\nпередача EXIF данных\r\nподдержка многих других функций, присущих объективам Canon\r\nпереходник пустотелый, без дополнительных линз, никоим образом не влияет на исходное качество изображения объектива', 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '782c15ff-3437-4eb8-aa35-d209a5c56f78', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:07.291', '2026-03-27 23:25:07.291', '[]'),
('30d8b1e3-fb13-46f8-aeb9-3153bf8453ec', 'Вспышка студийная Raylab Axio III RX-300', 'vspyshka-studijnaya-raylab-axio-iii-rx-300', NULL, 1000, 600, 800, 0, 10000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '01c1d230-5aab-4e45-8c2e-3be9036117e9', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:07.425', '2026-03-27 23:25:07.425', '[]'),
('31a31710-642c-4aa3-8d12-3766196152d6', 'сендер SHIMBOL TP MINI,Беспроводная система передачи видео Dual-HDMI (RC)', 'sender-shimbol-tp-minibesprovodnaya-sistema-peredachi-video-dual-hdmi-rc', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fef135f8-8186-4192-b697-22c165b4e838', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:07.557', '2026-03-27 23:25:07.557', '[]'),
('31be3a29-620d-439d-b8cd-38592fd11daf', 'YONGNUO YN-300 III  (RC)', 'yongnuo-yn-300-iii-rc', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:07.698', '2026-03-27 23:25:07.698', '[]'),
('34a942a9-99fe-466a-aedc-5ae2b6cb6924', 'Карта памяти Samsung EVO Plus 128GB', 'karta-pamyati-samsung-evo-plus-128gb', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:07.819', '2026-03-27 23:25:07.819', '[]'),
('34ba0e9e-b22b-4b3d-be81-46a9f4eca155', 'Canon EOS R6 Mark II Body (с адаптером EF to RF) (Delight Rent Делайт Рент)', 'canon-eos-r6-mark-ii-body-s-adapterom-ef-to-rf-delight-rent-delajt-rent', NULL, 12000, 7200, 9600, 0, 150000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:07.944', '2026-03-27 23:25:07.944', '[]'),
('356f7806-06e7-4dd2-8983-5a64843b63cc', 'Карта памяти Samsung EVO Plus 128GB', 'karta-pamyati-samsung-evo-plus-128gb-1', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:08.076', '2026-03-27 23:25:08.076', '[]'),
('35a43ea0-99d7-46c0-a8d4-ea4c7a0d83af', 'Переходные кольца 49мм - 82мм', 'perehodnye-kolcza-49mm-82mm', 'Набор переходных колец от для объективов с диаметром передней линзы от 49 до 82 мм', 200, 120, 160, 0, 1000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '46b4ed09-c3ff-44ed-be1a-bf30a0c653e4', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:08.202', '2026-03-27 23:25:08.202', '[]'),
('35f7435b-3a62-43a8-8d92-5e2292916821', 'Sony a7 IV', 'sony-a7-iv', '## Новый стандарт гибридной съемки\nSony A7 IV — это четвертое поколение самой популярной полнокадровой серии камер в мире. Она окончательно стирает грань между профессиональной фотографией и высококлассным видеопроизводством.\n\nНовый уровень детализации: 33-мегапиксельная матрица обеспечивает идеальный баланс между разрешением, скоростью и качеством изображения в условиях низкой освещенности.\nИнтеллект в фокусе: Система автофокуса от флагмана Sony A1 мгновенно распознает глаза людей, животных и птиц даже в самых динамичных сценах.\nПрофессиональное видео: Запись в 10-битном формате 4:2:2 и профиль S-Cinetone позволяют получать «киношную» картинку с богатыми цветами прямо из камеры.\nСовременная эргономика: Полностью поворотный экран и новое двухслойное колесо режимов позволяют переключаться между фото и видео за доли секунды.\n\nЭто камера «без компромиссов». Она мощнее предыдущей модели (A7 III) практически в каждом аспекте: от разрешения и скорости процессора до удобства меню и надежности беспроводной связи.\n', 1800, 800, 1300, 0, 100500, '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'a694b2e9-c251-4dc1-a1cc-2e0a25263bd8', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", '101', '', '', '', 'INTERNAL'::"OwnershipType", NULL, '{"вес": "658 г (с батареей и картой памяти)", "модель": "Sony Alpha 7 IV (ILCE-7M4)", "байонет": "Sony E-mount", "дисплей": "3.0 дюйма, сенсорный, поворотный, 1.04 млн точек", "процессор": "BIONZ XR", "тип камеры": "Полнокадровая беззеркальная со сменной оптикой", "интерфейсы": "HDMI Type-A, USB-C (3.2 Gen 2), Микрофон, Наушники, Wi-Fi 5ГГц", "тип матрицы": "Full-frame Exmor R CMOS (35.9 x 23.9 мм)", "аккумулятор": "NP-FZ100 (до 580 снимков)", "слоты памяти": "Слот 1 (SD UHS-II / CFexpress Type A), Слот 2 (SD UHS-II)", "видоискатель": "OLED, 3.69 млн точек, 120 кадров/с", "стабилизация": "Встроенная 5-осевая (IBIS), до 5.5 стопов", "точки автофокуса": "759 точек фазовой детекции", "максимальное видео": "4K 60p (10-bit 4:2:2, All-I)", "оверсэмплинг видео": "7K (при съемке 4K 30p)", "разрешение матрицы": "33.0 Мп", "автофокус по глазам": "Люди, Животные, Птицы (фото и видео)", "чувствительность iso": "100–51200 (расширяется до 50–204800)", "профили изображения": "S-Cinetone, S-Log3, HLG", "скорость серийной съемки": "До 10 кадров/с"}', '[]', '2026-03-27 23:25:08.320', '2026-04-17 10:49:57.588', '["https://vkvideo.ru/video_ext.php?oid=-229460708&id=456239069&hd=4"]'),
('36b9e592-c9ca-44f1-ac61-88be647e40d0', 'Nikon Z6 II', 'nikon-z6-ii', 'Полнокадровая беззеркальная камера с байонетом Nikon Z\n- Full frame\n- 24,5 МП\n- быстрый автофокус\n- встроенная стабилизация изображения\n- два слота для карт памяти', 2900, 1800, 2400, 150000, 167000, '18f91ba0-1ea3-46ba-8699-3eafd3547190', '31d3c951-036d-42a9-9f75-4786aa7f65ef', TRUE, TRUE, 'AVAILABLE', '', 'Технически полностью исправен. Внешний дефект: на информационном дисплее небольшая трещина; крышка разъема для аксессуаров немного отходит. Царапины на корпусе видоискателя, плохое состояние резинки видоискателя.', '', '- камера \n- АКБ Nikon EN-EL15, 2 шт\n- зарядное устройство\n- сумка ', 'INTERNAL', NULL, '{"description": "В комплекте идет: \\n- АКБ Nikon EN-EL15, 2 шт\\n- зарядное устройство\\n- сумка. \\n\\nДополнительно к камере доступны в аренду карта памяти, фикс-объективы или зум-объективы. Уточняйте наличие у администратора. "}', '[]', '2026-03-27 23:25:09.087', '2026-03-27 23:25:09.087', '[]'),
('37a84169-5cd1-48ae-a187-6fa6c8e5ed75', 'Сетевой кабель LAN', 'setevoj-kabel-lan', NULL, 200, 120, 160, 0, 1000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e69a50e6-352b-49dd-aa0f-1ddf2cf0f74a',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:09.269', '2026-03-27 23:25:09.269', '[]'),
('38113a56-938a-43a4-a0b5-384eaf7765d9', 'Фотофон (2,75м)', 'fotofon-275m', NULL, 1200, 720, 960, 0, 12000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:09.398', '2026-03-27 23:25:09.398', '[]'),
('3876aff1-00df-4013-8ecb-2d79ad28491b', 'Конус на Bowens', 'konus-na-bowens', NULL, 300, 180, 240, 0, 4000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '07e624c5-d2b1-4f43-a34c-3bf0e7392273',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:09.518', '2026-03-27 23:25:09.518', '[]'),
('38d1fe54-bfef-4e68-b3b3-3d6353520457', 'Insta360 X5', 'insta360-x5', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:09.636', '2026-03-27 23:25:09.636', '[]'),
('3938b766-6de4-4969-b4e2-54840279dda7', 'Микрофон rode podmic', 'mikrofon-rode-podmic', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fef135f8-8186-4192-b697-22c165b4e838',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:09.768', '2026-03-27 23:25:09.768', '[]'),
('394603de-1c9e-4e88-9d22-6f1db45c26d8', 'Софтбокс Чайнабол Godox CS65D (RC)', 'softboks-chajnabol-godox-cs65d-rc', NULL, 1000, 600, 800, 0, 10000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:09.891', '2026-03-27 23:25:09.891', '[]'),
('3d496aab-c26d-4f44-b2e5-2e132d43801a', 'Карта памяти SD 128GB Kingston 128GB, UHS-II, U3, V90', 'karta-pamyati-sd-128gb-kingston-128gb-uhs-ii-u3-v90', NULL, 300, 180, 240, 0, 4000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e5752121-fef3-49f2-b29b-da8fc97ac613',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:10.023', '2026-03-27 23:25:10.023', '[]'),
('3ec3dae2-524f-4c5c-b770-90236efb63a2', 'Dji RONIN-SC2', 'dji-ronin-sc2', NULL, 9000, 5400, 7200, 0, 88000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:10.141', '2026-03-27 23:25:10.141', '[]'),
('3eeede93-720a-4541-aab7-69d1c34f96c0', 'Петличные микрофоны DJI MIC (RC)', 'petlichnye-mikrofony-dji-mic-rc', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fef135f8-8186-4192-b697-22c165b4e838',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:10.262', '2026-03-27 23:25:10.262', '[]'),
('3effbc95-babf-4fd8-b38b-d314cfe32501', 'Canon EOS R Body (в комплекте адаптер EF‑EOS R) (Цифровой мир)', 'canon-eos-r-body-v-komplekte-adapter-efeos-r-czifrovoj-mir', NULL, 12000, 7200, 9600, 0, 150000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '93a11a98-d8f9-4160-ae84-0c80d784799b',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:10.485', '2026-03-27 23:25:10.485', '[]'),
('3fa7f353-74eb-47bc-88c5-138e1c46fba5', 'Быстроскладной стрипбокс Raylab RL-SQ30140 30x140см', 'bystroskladnoj-stripboks-raylab-rl-sq30140-30x140sm', 'Байонет Bowens', 500, 300, 400, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:10.607', '2026-03-27 23:25:10.607', '[]'),
('3fc831d2-1c74-4885-b408-b5f329e244c6', 'Panasonic 12-35mm f/2.8 II ASPH. O.I.S. Lumix G X Vario', 'panasonic-12-35mm-f28-ii-asph-ois-lumix-g-x-vario', NULL, 7000, 4200, 5600, 60000, 70000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '03be2f03-24bb-491c-ad34-bfb07a6f8079',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:10.732', '2026-03-27 23:25:10.732', '[]'),
('401d3a8a-7a02-4519-9ad1-6c1b08b8999d', 'Презентер (кликер) R400', 'prezenter-kliker-r400', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f8196d71-c99e-4bc2-a902-6cdaaf1352de',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:10.857', '2026-03-27 23:25:10.857', '[]'),
('41db3def-ca8a-4c91-a71f-8c43e353a75f', 'Nikon d780', 'nikon-d780', NULL, 19000, 11400, 15200, 0, 190000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:10.981', '2026-03-27 23:25:10.981', '[]'),
('4252947e-1ed0-48a5-8683-21a1e3b5c56b', 'Кабель джек-XLR', 'kabel-dzhek-xlr', NULL, 200, 120, 160, 0, 800, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '521c348b-ec82-4132-8751-5d5e6f188e98',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:11.204', '2026-03-27 23:25:11.204', '[]'),
('44ca408a-1a66-442e-9fd7-e4682ea2dfde', 'Стойка manfrotto 111csu', 'stojka-manfrotto-111csu', NULL, 6000, 3600, 4800, 0, 60000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0f196350-24f0-483e-a7a8-17bcc017f0b0',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:11.612', '2026-03-27 23:25:11.612', '[]'),
('46583f40-de6f-46f1-87e9-1d813f152dd1', 'Поляризационный фильтр 58 digi care', 'polyarizaczionnyj-filtr-58-digi-care', NULL, 250, 150, 200, 0, 3000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:11.852', '2026-03-27 23:25:11.852', '[]'),
('48b5afc5-39ab-4a02-a3a0-5b401f1866d5', 'Объектив Sigma 14-24mm f/2.8 DG DN Art Sony E (RC)', 'obektiv-sigma-14-24mm-f28-dg-dn-art-sony-e-rc', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:11.987', '2026-03-27 23:25:11.987', '[]'),
('495fe24c-875e-4324-b145-3ec3b1c32f32', 'Sony FX 30', 'sony-fx-30', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:12.248', '2026-03-27 23:25:12.248', '[]'),
('49db6406-85e0-437e-86dd-e929d05daf03', 'Синхронизатор- светоловушка ИК TR-1', 'sinhronizator-svetolovushka-ik-tr-1', NULL, 300, 180, 240, 0, 3000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '9efb339e-c09a-45e1-8056-081e645680f3',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:12.469', '2026-03-27 23:25:12.469', '[]'),
('4a1b4fac-7753-42ff-8871-7d936ed297a6', 'Адаптер Meike MK-ETZ E-mount to Nikon Z (Делайт)', 'adapter-meike-mk-etz-e-mount-to-nikon-z-delajt', NULL, 700, 420, 560, 0, 9000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '93a11a98-d8f9-4160-ae84-0c80d784799b',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:12.585', '2026-03-27 23:25:12.585', '[]'),
('4af8c383-0532-41e2-ae36-6ddd3641c662', 'Журавль перекладина', 'zhuravl-perekladina', NULL, 1200, 720, 960, 0, 12000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e182b449-b4c6-4713-a568-3f7f4eae4094',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:12.708', '2026-03-27 23:25:12.708', '[]'),
('4b68fbc2-cb22-4cc4-bce9-214d15a5cd16', 'Микрофон rode podmic', 'mikrofon-rode-podmic-1', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fef135f8-8186-4192-b697-22c165b4e838',TRUE, FALSE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:12.824', '2026-03-27 23:25:12.824', '[]'),
('4b7d34ea-1040-42b9-9488-6c0366eed1b8', 'Panasonic Lumix GH5 Body (V-LOG)', 'panasonic-lumix-gh5-body-v-log', NULL, 15000, 9000, 12000, 0, 150000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:12.940', '2026-03-27 23:25:12.940', '[]'),
('4d016c1e-a7bf-4694-9f60-2f0e9b67ecca', 'Объектив Sony 85mm F/1.8 (RC)', 'obektiv-sony-85mm-f18-rc', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:13.058', '2026-03-27 23:25:13.058', '[]'),
('4d1e25dd-3509-4b4f-bde7-9faf1afb025e', 'Светофильтр SUNPAK ND4 62mm', 'svetofiltr-sunpak-nd4-62mm', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:13.172', '2026-03-27 23:25:13.172', '[]'),
('4de99f04-75de-454d-b1a9-5740e26910b2', 'Октобокс параболический быстрораскладной 120 см (RC)', 'oktoboks-parabolicheskij-bystroraskladnoj-120-sm-rc', NULL, 1000, 600, 800, 0, 10000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:13.290', '2026-03-27 23:25:13.290', '[]'),
('4f1ea574-a0a4-40f8-8ca9-25ead600195d', 'Кабель tipe-c - tipe-c', 'kabel-tipe-c-tipe-c', NULL, 200, 120, 160, 0, 1000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e69a50e6-352b-49dd-aa0f-1ddf2cf0f74a',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:13.405', '2026-03-27 23:25:13.405', '[]'),
('4f24814a-522f-48d5-8727-4d11449f767b', 'VHS камера', 'vhs-kamera', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:13.520', '2026-03-27 23:25:13.520', '[]'),
('51b600a8-bba6-42c3-99ee-c3d2fdb8c79b', 'АКБ Panasonic DMW-BLF19E аккумулятор', 'akb-panasonic-dmw-blf19e-akkumulyator', NULL, 400, 240, 320, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd989dfa9-6e2b-45b0-9dc0-4bb1f3e72b8a',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:13.746', '2026-03-27 23:25:13.746', '[]'),
('51c52197-6705-4a56-a3be-ff7f120b7a06', 'Canon RF 24-105mm F4L IS USM (RC)', 'canon-rf-24-105mm-f4l-is-usm-rc', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:13.865', '2026-03-27 23:25:13.865', '[]'),
('52738df3-d935-4ed0-a547-3d06591277ce', 'АКБ Canon LP-E6N Аккумулятор', 'akb-canon-lp-e6n-akkumulyator', NULL, 250, 150, 200, 0, 3000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:13.982', '2026-03-27 23:25:13.982', '[]'),
('52fe0e5f-7f18-408b-ab98-b74d7e7f7b27', 'Объектив Nikon 85 1.4g байонет F', 'obektiv-nikon-85-14g-bajonet-f', NULL, 12000, 7200, 9600, 110000, 120000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:14.102', '2026-03-27 23:25:14.102', '[]'),
('53f43ea8-9348-4ebc-9916-a8aeeee899a7', 'Передатчик PLUG ON SENNHEISER G4 - A1', 'peredatchik-plug-on-sennheiser-g4-a1', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fef135f8-8186-4192-b697-22c165b4e838',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:14.219', '2026-03-27 23:25:14.219', '[]'),
('5439fda5-7bc1-4b7a-ac55-fc80ca14d141', 'Колено Manfrotto', 'koleno-manfrotto', NULL, 700, 420, 560, 0, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f8196d71-c99e-4bc2-a902-6cdaaf1352de',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:14.337', '2026-03-27 23:25:14.337', '[]'),
('544ba360-e6e4-49eb-bec9-49e869026692', 'Портретная тарелка Hensel', 'portretnaya-tarelka-hensel', NULL, 2500, 1500, 2000, 0, 25000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:14.462', '2026-03-27 23:25:14.462', '[]'),
('56639a29-0b95-4dd3-b034-aca38eef97e4', 'Видео штатив Daiwa DSL-33 с жидкостной головой', 'video-shtativ-daiwa-dsl-33-s-zhidkostnoj-golovoj', NULL, 3000, 1800, 2400, 0, 30000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'bdd89762-fca6-48cf-ba71-e8ec223fce2b',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:14.581', '2026-03-27 23:25:14.581', '[]'),
('5888543c-61f2-40ae-aa37-89d001208085', 'Видеомикшер Blackmagic ATEM Mini Pro', 'videomiksher-blackmagic-atem-mini-pro', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '3148dc98-4cb7-4eb1-a6ff-aa6948c589d8',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:14.705', '2026-03-27 23:25:14.705', '[]'),
('59b7ffd4-6f78-48e7-88fd-b95056ce09b0', 'Объектив Canon 28-70mm f/2.8  RF (DL)', 'obektiv-canon-28-70mm-f28-rf-dl', NULL, 9500, 5700, 7600, 0, 93000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:14.822', '2026-03-27 23:25:14.822', '[]'),
('59e8bf47-36ba-44b5-94a2-0dc584bacb97', 'Держатель (Переходник ) вспышки Godox S2 с байонетом Bowens', 'derzhatel-perehodnik-vspyshki-godox-s2-s-bajonetom-bowens', NULL, 250, 150, 200, 0, 3000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '782c15ff-3437-4eb8-aa35-d209a5c56f78',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:14.937', '2026-03-27 23:25:14.937', '[]'),
('5b4edc81-b9ef-468c-bf57-008e665fcdcf', 'аккумулятор Canon LP-E17', 'akkumulyator-canon-lp-e17', NULL, 800, 480, 640, 0, 10000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd989dfa9-6e2b-45b0-9dc0-4bb1f3e72b8a',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:15.052', '2026-03-27 23:25:15.052', '[]'),
('5b89d288-eae8-472f-b0a9-d685d55bcc43', 'Canon EF 16-35mm f/2.8L II USM.(RC)', 'canon-ef-16-35mm-f28l-ii-usmrc', NULL, 7000, 4200, 5600, 62000, 72000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:15.171', '2026-03-27 23:25:15.171', '[]'),
('5beb9b45-eee6-40a4-a89a-cbcf7805bee7', 'Карта памяти Samsung EVO Plus 128GB (6)', 'karta-pamyati-samsung-evo-plus-128gb-6', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:15.287', '2026-03-27 23:25:15.287', '[]'),
('5cec68da-f45c-411b-8ec0-47e66092df27', 'Зажим SmallRig (Сlamp)', 'zazhim-smallrig-slamp', NULL, 200, 120, 160, 0, 1000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:15.414', '2026-03-27 23:25:15.414', '[]'),
('5d3acbda-3d38-4d96-a38b-74588e64c9f2', 'Объектив Laowa 10mm f/2.8 Zero-D FF (байонет E) (Делайт)', 'obektiv-laowa-10mm-f28-zero-d-ff-bajonet-e-delajt', NULL, 8500, 5100, 6800, 0, 85000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:15.534', '2026-03-27 23:25:15.534', '[]'),
('5daf00db-bcc4-4a89-a92b-3cacde774816', 'Аккумулятор NP-FW50RC', 'akkumulyator-np-fw50rc', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:15.656', '2026-03-27 23:25:15.656', '[]'),
('5e58e043-32e3-49a3-a6c7-5305fc456740', 'Крепление на голову Go Pro', 'kreplenie-na-golovu-go-pro', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '3160c40b-81be-40b1-b6a3-ff122b308f33',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:15.781', '2026-03-27 23:25:15.781', '[]'),
('5e885f8d-0f78-4242-a921-3997910b1d59', 'Sigma AF 18-35mm f/1.8 DC HSM Art Canon EF-S (Вадим)', 'sigma-af-18-35mm-f18-dc-hsm-art-canon-ef-s-vadim', NULL, 7500, 4500, 6000, 0, 75000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:15.908', '2026-03-27 23:25:15.908', '[]'),
('60b3f02c-8cf6-4daa-9b1c-ebc7c81e2d93', 'Объектив Tamron 17-28mm f/2.8 Di III RXD (A046) Sony E', 'obektiv-tamron-17-28mm-f28-di-iii-rxd-a046-sony-e', NULL, 7000, 4200, 5600, 0, 70000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:16.180', '2026-03-27 23:25:16.180', '[]'),
('63419b16-00ef-493d-bdd9-c73bfda086fc', 'Переходник nikon f на М4/3', 'perehodnik-nikon-f-na-m43', NULL, 400, 240, 320, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '93a11a98-d8f9-4160-ae84-0c80d784799b',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:16.415', '2026-03-27 23:25:16.415', '[]'),
('6464c8b4-1562-44a5-82f6-cc0ba4652359', 'Карта памяти Samsung EVO Plus 256GB', 'karta-pamyati-samsung-evo-plus-256gb', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:16.542', '2026-03-27 23:25:16.542', '[]'),
('65412242-8a7f-4756-a3d1-696b0f0b6cb6', 'Карбоновый штатив Manfrotto с редукторной головой "Benro"', 'karbonovyj-shtativ-manfrotto-s-reduktornoj-golovoj-benro', NULL, 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'bdd89762-fca6-48cf-ba71-e8ec223fce2b',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:16.669', '2026-03-27 23:25:16.669', '[]'),
('66ff90e4-44ff-4561-8e8f-6f2eb4e648c3', 'Селфи палка для Insta360 2.9m (Invisible Extended Edition Selfie Stick)', 'selfi-palka-dlya-insta360-29m-invisible-extended-edition-selfie-stick', NULL, 300, 180, 240, 0, 3000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL,TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:16.904', '2026-03-27 23:25:16.904', '[]'),
('67051ad5-c332-4fe6-bdf5-31e71c9042d1', 'Aputure Amaran 150C', 'aputure-amaran-150c', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fa93058e-0c39-479a-8782-f175d62aa148',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:17.037', '2026-03-27 23:25:17.037', '[]'),
('68e24491-5ebc-4d53-b165-e17b121f8df2', 'Кабель джек-джек', 'kabel-dzhek-dzhek', NULL, 200, 120, 160, 0, 800, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '521c348b-ec82-4132-8751-5d5e6f188e98',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:17.162', '2026-03-27 23:25:17.162', '[]'),
('69728bbc-095f-4934-bb6b-b6bdb1f25cc4', 'Godox Tl60 RGB', 'godox-tl60-rgb', NULL, 3700, 2220, 2960, 27000, 37000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '34dc74c5-4710-4d6c-af2a-fda28b664812',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:17.285', '2026-03-27 23:25:17.285', '[]'),
('6982d3cb-5aaa-472c-ba31-ec64d3c06fd6', 'Комплект масок Гобо Godox VSA-GS2', 'komplekt-masok-gobo-godox-vsa-gs2', NULL, 500, 300, 400, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e',TRUE, TRUE, 'AVAILABLE', NULL, NULL, NULL, NULL, 'INTERNAL', NULL, '{}', '[]', '2026-03-27 23:25:17.404', '2026-03-27 23:25:17.404', '[]');
INSERT INTO "Equipment" ("id", "title", "slug", "description", "pricePerDay", "price4h", "price8h", "deposit", "replacementValue", "categoryId", "subcategoryId", "isAvailable", "isPrimary", "status", "inventoryNumber", "defects", "kit", "kitDescription", "ownershipType", "partnerName", "specifications", "comments", "createdAt", "updatedAt", "videoUrls") VALUES
('69abe101-7641-4b0d-9dad-2af042732504', 'Адаптер - переходник Nikon FTZ', 'adapter-perehodnik-nikon-ftz', NULL, 1600, 960, 1280, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:17.522', '2026-03-27 23:25:17.522', '[]'),
('69b6c8be-07ea-4767-8f0b-c6039e1cc8c0', 'Система для установки фона Manfrotto «Ворота» черные', 'sistema-dlya-ustanovki-fona-manfrotto-vorota-chernye', NULL, 5000, 3000, 4000, 0, 50000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '1ec6e1f4-2cca-4323-8411-77bdffc81e8d', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:17.748', '2026-03-27 23:25:17.748', '[]'),
('69bf356b-2421-4028-a3f4-95ddef2b1c2c', 'Sony A7 IV', 'sony-a7-iv-1', '', 18000, 10800, 14400, 0, 180000, '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'a694b2e9-c251-4dc1-a1cc-2e0a25263bd8', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", '', '', '', '', 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:17.870', '2026-04-17 10:49:51.135', '[]'),
('6ad47a12-a4a8-403d-bef9-a798ede11681', 'Поляризационный фильтр 62 marumi', 'polyarizaczionnyj-filtr-62-marumi', NULL, 300, 180, 240, 0, 4000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:17.992', '2026-03-27 23:25:17.992', '[]'),
('6c725e7f-0291-455a-835d-17498a1415cc', 'АКБ LADDA AA2450mh ikea комплект 4шт', 'akb-ladda-aa2450mh-ikea-komplekt-4sht', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd989dfa9-6e2b-45b0-9dc0-4bb1f3e72b8a', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:18.112', '2026-03-27 23:25:18.112', '[]'),
('6e6c31c2-38a7-462e-a23f-0f3160d4985b', 'Вспышка накамерная Canon Speedlite 580EX II', 'vspyshka-nakamernaya-canon-speedlite-580ex-ii', NULL, 2500, 1500, 2000, 20004, 25000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:18.233', '2026-03-27 23:25:18.233', '[]'),
('6eae6ef6-bd7a-4f76-b788-3f6f9385b429', 'Софтбокс Raylab 50х70', 'softboks-raylab-50h70', 'Байонет Bowens', 500, 300, 400, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:18.354', '2026-03-27 23:25:18.354', '[]'),
('6ffef134-6164-4db5-b4a9-992d74dbc825', 'сендер SHIMBOL TP MINI,Беспроводная система передачи видео Dual-HDMI', 'sender-shimbol-tp-minibesprovodnaya-sistema-peredachi-video-dual-hdmi', NULL, 900, 540, 720, 0, 9000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:18.472', '2026-03-27 23:25:18.472', '[]'),
('71183829-04d1-4f54-a5ea-fa2238b2cd97', 'Hoya 77 поляризационный фильтр cpl', 'hoya-77-polyarizaczionnyj-filtr-cpl', NULL, 400, 240, 320, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:18.599', '2026-03-27 23:25:18.599', '[]'),
('722de942-7420-4287-91f9-5b3bf21331ba', 'Объектив Canon 24-105mm f/4L IS II USM (RC)', 'obektiv-canon-24-105mm-f4l-is-ii-usm-rc', NULL, 8000, 4800, 6400, 0, 80000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:18.724', '2026-03-27 23:25:18.724', '[]'),
('7309a2bc-4395-45a4-943f-e0eb94592aff', 'АКБ Sony NP-FW50 Аккумулятор', 'akb-sony-np-fw50-akkumulyator', NULL, 400, 240, 320, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd989dfa9-6e2b-45b0-9dc0-4bb1f3e72b8a', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:18.848', '2026-03-27 23:25:18.848', '[]'),
('753157cc-5079-4744-b35e-870dca63cb5b', 'Проектор hyper cinema c10', 'proektor-hyper-cinema-c10', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f8196d71-c99e-4bc2-a902-6cdaaf1352de', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:18.966', '2026-03-27 23:25:18.966', '[]'),
('7533a378-833c-4648-8cbc-0b18160e12da', 'Квадрокоптер DJI Mini 2 fliy more combo', 'kvadrokopter-dji-mini-2-fliy-more-combo', 'Dji mini 2 (комплект fly more combo-3 аккумулятора, хаб для зарядки, microSD 64Gb) 3000р/сутки. 50000 стоимость коптера.', 5000, 3000, 4000, 0, 50000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'ce3e2114-1747-47c3-b4bd-56b2be6117f4', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:19.087', '2026-03-27 23:25:19.087', '[]'),
('75428af3-966e-4bfd-93c2-16a04303d316', 'Кабель питания USB типа C для Panasonic (пустышка )', 'kabel-pitaniya-usb-tipa-c-dlya-panasonic-pustyshka', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e69a50e6-352b-49dd-aa0f-1ddf2cf0f74a', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:19.211', '2026-03-27 23:25:19.211', '[]'),
('757285b5-a769-4b76-bac4-8cdcdb6bbb91', 'Canon RF 70-200 f2.8 (DL)', 'canon-rf-70-200-f28-dl', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:19.341', '2026-03-27 23:25:19.341', '[]'),
('75ea29e0-54ba-46fe-ad70-b5d3baf1819b', 'пантограф', 'pantograf', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '3160c40b-81be-40b1-b6a3-ff122b308f33', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:19.461', '2026-03-27 23:25:19.461', '[]'),
('7631bde9-8a42-45e3-8d81-9c68ff4be417', 'Адаптер - переходник Andoer (for Canon) EOS R EF (Ремезова)', 'adapter-perehodnik-andoer-for-canon-eos-r-ef-remezova', NULL, 500, 300, 400, 0, 6000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:19.582', '2026-03-27 23:25:19.582', '[]'),
('77507c8a-6f7b-4721-8141-df9e43762e4c', 'Sony A7R III', 'sony-a7r-iii', NULL, 14000, 8400, 11200, 0, 140000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:19.721', '2026-03-27 23:25:19.721', '[]'),
('790459e2-7398-44b3-8c4b-d64a6efd36cc', 'Aputure Amaran 150C', 'aputure-amaran-150c-1', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:19.842', '2026-03-27 23:25:19.842', '[]'),
('7a3bdce7-fcce-4851-970e-4d05a72039d3', 'Осветитель Ulanzi VL119 RGB', 'osvetitel-ulanzi-vl119-rgb', NULL, 300, 180, 240, 0, 3000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fa93058e-0c39-479a-8782-f175d62aa148', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:19.963', '2026-03-27 23:25:19.963', '[]'),
('7ad9ba52-33bc-4ee3-bc7f-e44c67db91e8', 'Доп. источник света в Студию', 'dop-istochnik-sveta-v-studiyu', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fa93058e-0c39-479a-8782-f175d62aa148', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:20.082', '2026-03-27 23:25:20.082', '[]'),
('7b178745-bf2e-4866-9cd5-88e3993d42a2', 'штатив manfrotto 290 light', 'shtativ-manfrotto-290-light', NULL, 3000, 1800, 2400, 0, 30000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '38af0cb5-7bf9-4023-983f-ae73000e0850', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:20.354', '2026-03-27 23:25:20.354', '[]'),
('7b450c0b-5e70-4209-80e1-5175420f42dc', 'Объектив Sony Carl Zeiss 24-70mm f/4 ZA OSS', 'obektiv-sony-carl-zeiss-24-70mm-f4-za-oss', NULL, 8000, 4800, 6400, 70000, 80000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:20.469', '2026-03-27 23:25:20.469', '[]'),
('7d10b006-7706-4823-8196-bd4cedf02992', 'Тканевый черный фон', 'tkanevyj-chernyj-fon', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '41960654-d394-4f68-b48f-6fed7f6f3fc1', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:20.585', '2026-03-27 23:25:20.585', '[]'),
('7d1924bb-af6d-4890-963d-0d32f06a834e', 'Переходник sony nex nikon f FOTGA', 'perehodnik-sony-nex-nikon-f-fotga', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:20.705', '2026-03-27 23:25:20.705', '[]'),
('7d66e75e-aea5-4582-9cf7-a13c2c23e149', 'Октобокс Triopo 65 см для Bowens', 'oktoboks-triopo-65-sm-dlya-bowens', NULL, 400, 240, 320, 0, 4000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '27909c1c-a781-477c-a420-583fe8465baf', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:20.824', '2026-03-27 23:25:20.824', '[]'),
('7d9899a2-99a9-4b29-8183-7402c6aee9b8', 'Кардридер CFexpress', 'kardrider-cfexpress', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:20.950', '2026-03-27 23:25:20.950', '[]'),
('7dfeb717-ae37-43c0-a1c7-a62c7c7a202b', 'Объектив Tamron 70-180mm f/2.8 Di III VXD Sony E (Д)', 'obektiv-tamron-70-180mm-f28-di-iii-vxd-sony-e-d', NULL, 8000, 4800, 6400, 0, 80000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '26ee16d5-927b-4c53-b223-d17752cc8805', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:21.065', '2026-03-27 23:25:21.065', '[]'),
('7f163663-929e-4e77-bc7d-561ce51a02dd', 'Конус на raylab', 'konus-na-raylab', NULL, 300, 180, 240, 0, 4000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '07e624c5-d2b1-4f43-a34c-3bf0e7392273', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:21.182', '2026-03-27 23:25:21.182', '[]'),
('80f52d35-b382-4f17-944a-56b95225169b', 'Объектив Sigma AF 14mm f/1.8 DG HSM Art (байонет E) (Делайт)', 'obektiv-sigma-af-14mm-f18-dg-hsm-art-bajonet-e-delajt', NULL, 11000, 6600, 8800, 0, 110000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:21.298', '2026-03-27 23:25:21.298', '[]'),
('8161bf06-0236-4346-b03f-73c89a88e4d3', 'Вспышка накамерная Godox TT600 1', 'vspyshka-nakamernaya-godox-tt600-1', NULL, 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '01c1d230-5aab-4e45-8c2e-3be9036117e9', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:21.424', '2026-03-27 23:25:21.424', '[]'),
('81e8208b-bdc5-4817-95b3-515b925959ca', 'Карта памяти Samsung EVO Plus 128GB (2)', 'karta-pamyati-samsung-evo-plus-128gb-2', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:21.544', '2026-03-27 23:25:21.544', '[]'),
('8261d4f9-9fe3-46b5-bbb0-4892bc2eaf05', 'Стойка с колёсами', 'stojka-s-kolyosami', NULL, 3000, 1800, 2400, 0, 30000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0f196350-24f0-483e-a7a8-17bcc017f0b0', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:21.660', '2026-03-27 23:25:21.660', '[]'),
('835bdfaf-e77e-4fb8-b6cb-72d13dbf4d1f', 'Параболический софтбокс Godox QR-P 90 см быстроскладной', 'parabolicheskij-softboks-godox-qr-p-90-sm-bystroskladnoj-1', NULL, 1700, 1020, 1360, 0, 17000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '27909c1c-a781-477c-a420-583fe8465baf', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:21.870', '2026-03-27 23:25:21.870', '[]'),
('84b0b0fd-acf2-4af0-aa98-d878f980ac2b', 'Стойка Hensel 200 см', 'stojka-hensel-200-sm', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0f196350-24f0-483e-a7a8-17bcc017f0b0', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:21.985', '2026-03-27 23:25:21.985', '[]'),
('8537f5f5-e275-4365-9320-8f5c29f57b40', 'Фотофон (2.75 м)', 'fotofon-275-m', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '41960654-d394-4f68-b48f-6fed7f6f3fc1', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:22.101', '2026-03-27 23:25:22.101', '[]'),
('85817a2b-b4d5-4735-a9c1-e02ee3554607', 'Вспышка накамерная Godox TT600 3', 'vspyshka-nakamernaya-godox-tt600-3', NULL, 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '01c1d230-5aab-4e45-8c2e-3be9036117e9', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:22.225', '2026-03-27 23:25:22.225', '[]'),
('85aec525-d180-4373-9b2a-73c02ef60d01', 'Lensbaby composer pro', 'lensbaby-composer-pro', NULL, 2000, 1200, 1600, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:22.356', '2026-03-27 23:25:22.356', '[]'),
('875cdb8b-edf3-4d83-9af7-61dc1b06d0ed', 'Объектив Canon EF 16-35mm f/2.8L II USM. байонет EF', 'obektiv-canon-ef-16-35mm-f28l-ii-usm-bajonet-ef', 'Погнуто переднее кольцо корпуса', 7000, 4200, 5600, 62000, 72000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:22.467', '2026-03-27 23:25:22.467', '[]'),
('8837d870-e9a4-4623-a84e-01fbffa5ad5e', 'Рефлектор на Bowens', 'reflektor-na-bowens', NULL, 200, 120, 160, 0, 1500, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '07e624c5-d2b1-4f43-a34c-3bf0e7392273', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:22.585', '2026-03-27 23:25:22.585', '[]'),
('89279685-7cfe-4f38-8e5e-f1275cf6faab', 'Карта памяти Samsung EVO Plus 128GB (7)', 'karta-pamyati-samsung-evo-plus-128gb-7', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:22.703', '2026-03-27 23:25:22.703', '[]'),
('89e94743-c10c-4f2d-91e8-b00edd524a33', 'Стрипбокс Godox SB-FW 120x30', 'stripboks-godox-sb-fw-120x30', NULL, 500, 300, 400, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '27909c1c-a781-477c-a420-583fe8465baf', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:22.819', '2026-03-27 23:25:22.819', '[]'),
('8c09e2bd-10be-4954-889f-c918921b49ea', 'Переходник со вспышки на Bowens 1', 'perehodnik-so-vspyshki-na-bowens-1', NULL, 250, 150, 200, 0, 3000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '782c15ff-3437-4eb8-aa35-d209a5c56f78', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:22.933', '2026-03-27 23:25:22.933', '[]'),
('8c0efed0-94bb-4cc4-a0ab-b1461466b550', 'Сетевое зарядное устройство Xiaomi, мощность 120W, адаптер с кабелем USB-C', 'setevoe-zaryadnoe-ustrojstvo-xiaomi-moshhnost-120w-adapter-s-kabelem-usb-c', NULL, 200, 120, 160, 0, 1000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '782c15ff-3437-4eb8-aa35-d209a5c56f78', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:23.150', '2026-03-27 23:25:23.150', '[]'),
('8c7336b3-94ee-4eb7-8991-30d06fd07b7b', 'Aputure Amaran 300C RGB', 'aputure-amaran-300c-rgb-1', NULL, 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:23.266', '2026-03-27 23:25:23.266', '[]'),
('8d5076d1-bd4d-4c16-8f72-7d6787842ba8', 'Объектив Nikon 16mm f/2.8D AF Fisheye-Nikkor байонет F', 'obektiv-nikon-16mm-f28d-af-fisheye-nikkor-bajonet-f', 'технически исправен\r\nгнутая металлическая бленда', 6000, 3600, 4800, 50000, 62000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:23.385', '2026-03-27 23:25:23.385', '[]'),
('8ebe7f66-96c4-42e0-acfc-5bb5a587a62b', 'Софтбокс Raylab 60х60', 'softboks-raylab-60h60', NULL, 500, 300, 400, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:23.509', '2026-03-27 23:25:23.509', '[]'),
('8ff87275-d1e9-41dd-a839-7db5c2bb7ce6', 'Вспышка накамерная Godox TT600 5', 'vspyshka-nakamernaya-godox-tt600-5', NULL, 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '01c1d230-5aab-4e45-8c2e-3be9036117e9', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:23.728', '2026-03-27 23:25:23.728', '[]'),
('9255b38b-50db-4e6c-b7e2-0e3a4b899fa8', 'Адаптер - переходник Canon EOS R EF', 'adapter-perehodnik-canon-eos-r-ef', NULL, 1600, 960, 1280, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:23.843', '2026-03-27 23:25:23.843', '[]'),
('92fd0a51-a6ab-42e9-bbca-1a8a2706855e', 'Sony a7 III', 'sony-a7-iii-1', 'Базовая версия третьего поколения беззеркальных фуллфреймов Sony позиционируется в качестве профи-инструмента, для которого практически не имеется невыполнимых задач. Внутри модели установлена обновлённая 24.3 МП матрица с обратной засветкой, благодаря чему камера демонстрирует более чистую от шумов картинку при съёмке на высоких значениях светочувствительности (рабочими считаются ISO вплоть до 12800-25600 единиц, а максимальная отметка ISO достигает цифры 204800). Система автоматической наводки на резкость у Sony A7 III body использует 693 точки фазового и 425 точек контрастного типа, покрывая 93 % площади кадра. Автофокусу под силу захватить объект съёмки чуть ли не в полной темноте, надёжно удерживая его в фокусе даже в режиме максимальной скорострельности (10 к/с). На стражу чёткости картинки при съёмке в условиях недостаточной освещённости поставлен 5-осевой матричный стаб, который способен компенсировать до 5 стопов экспозиции. Видеосъёмку беззеркалка производит в ультравысоком разрешении 4К со скоростью 24/30 к/с и битрейтом до 100 Мбит/с (8 бит 4:2:0 при записи на быструю карту памяти стандарта UHS-II и 8 bit 4:2:2 при передаче видеоряда через порт HDMI на внешний рекордер). Автономность камеры оценивается возможностью «отщёлкать» на одном заряде батареи свыше 600 фото.', 2900, 1740, 2320, 125000, 135000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'a694b2e9-c251-4dc1-a1cc-2e0a25263bd8', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:23.959', '2026-03-27 23:25:23.959', '[]'),
('93a0030c-9169-4240-9e3f-92f820dc8b11', 'Фонарь Ulanzi', 'fonar-ulanzi', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fa93058e-0c39-479a-8782-f175d62aa148', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:24.077', '2026-03-27 23:25:24.077', '[]'),
('9484deab-da65-40b2-ac4e-64c1d870b5e9', 'Sigma AF 35mm f/1.4 DG HSM Art Canon EF', 'sigma-af-35mm-f14-dg-hsm-art-canon-ef', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:24.355', '2026-03-27 23:25:24.355', '[]'),
('955ad284-d586-46aa-9b7c-2e5e9fee0406', 'Объектив Canon 24-70 2.8 ii L байонет EF', 'obektiv-canon-24-70-28-ii-l-rc', 'Canon EF 24-70mm f/2.8L II USM – новый стандартный зум-объектив профессионального уровня. Данный объектив полностью заменяет собой предыдущую модель, EF 24-70mm f/2.8L USM, одновременно они выпускаться не будут. Благодаря своему универсальному фокусному диапазону и высокой светосиле данная модель была очень популярна, как в профессиональной, так и в любительской среде: 24 мм обеспечивают очень широкий угол зрения на полноформатной фототехнике, и в то же время подходят для использования с матрицами формата APS-C (38 мм в эквиваленте), а 70 мм хватает для создания портретов. Объектив хорош как для работы в жанре «репортаж», в стесненных условиях, так и для любительской съемки на отдыхе.', 1900, 1140, 1520, 0, 120000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:24.476', '2026-03-27 23:25:24.476', '[]'),
('95a13939-290c-4803-832a-3e6957ae7d55', 'Canon EOS R Body (в комплекте адаптер EF‑EOS R) (RC)', 'canon-eos-r-body-v-komplekte-adapter-efeos-r-rc', NULL, 12000, 7200, 9600, 0, 150000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:24.593', '2026-03-27 23:25:24.593', '[]'),
('95cf2aa1-0881-4d0f-bcc3-4b9dc0815ba5', 'Рефлектор на raylab', 'reflektor-na-raylab', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '07e624c5-d2b1-4f43-a34c-3bf0e7392273', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:24.714', '2026-03-27 23:25:24.714', '[]'),
('96f8f97c-debf-46fd-aa8c-af5e75a08f78', 'Портативный генератор дыма lensgo Smoke B (дым- машина)  (RC)', 'portativnyj-generator-dyma-lensgo-smoke-b-dym-mashina-rc', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd12c2a08-cdea-45b0-9659-41543ed67a9a', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:24.835', '2026-03-27 23:25:24.835', '[]'),
('9741db64-b5c0-445d-8299-185bbef71e42', 'Держатель Super Clamp', 'derzhatel-super-clamp', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0fb5b322-3a92-4f87-9e48-a612a8a3d29c', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:24.963', '2026-03-27 23:25:24.963', '[]'),
('974c2acd-7220-4a8f-9119-a229bff7f2fb', 'Объектив RF 24-105mm f/4L IS USM (ЦМ)', 'obektiv-rf-24-105mm-f4l-is-usm-czm', NULL, 9000, 5400, 7200, 0, 90000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:25.083', '2026-03-27 23:25:25.083', '[]'),
('97e7701d-2410-4dc5-8609-fdc4acf2371e', 'Nanlite FS-300 (Моноблок дневного света)', 'nanlite-fs-300-monoblok-dnevnogo-sveta', NULL, 3000, 1800, 2400, 0, 30000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:25.200', '2026-03-27 23:25:25.200', '[]'),
('9867dcf2-e37b-41f8-83c1-600cf6980b6d', 'Карбоновый штатив Manfrotto с видеоголовой Velbon', 'karbonovyj-shtativ-manfrotto-s-videogolovoj-velbon', NULL, 6000, 3600, 4800, 0, 60000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:25.333', '2026-03-27 23:25:25.333', '[]'),
('992a6762-6d8d-402a-b95e-921e3f1773c8', 'Прищепка для фона', 'prishhepka-dlya-fona', NULL, 600, 360, 480, 0, 6000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:25.451', '2026-03-27 23:25:25.451', '[]'),
('995521ff-4b16-4792-aa09-63a149da9b65', 'Стабилизатор DJI Osmo Mobile 4 SE', 'stabilizator-dji-osmo-mobile-4-se', NULL, 1500, 900, 1200, 0, 15000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e9ef0452-9efb-43c7-b9d3-2a613d13d93e', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:25.571', '2026-03-27 23:25:25.571', '[]'),
('99e56424-b345-47f4-8947-a9811ec65fba', 'Параболический софтбокс 90 см быстроскладной', 'parabolicheskij-softboks-90-sm-bystroskladnoj', 'Байонет Bowens', 800, 480, 640, 0, 8000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:25.686', '2026-03-27 23:25:25.686', '[]'),
('9a706638-5c47-45fb-8d25-62ccbbfb2577', 'Зажим SmallRig (Сlamp)', 'zazhim-smallrig-slamp-1', NULL, 200, 120, 160, 0, 1000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:25.800', '2026-03-27 23:25:25.800', '[]'),
('9a7dd41a-3882-44be-895b-8943ca5decab', 'Софтбокс SMDV Diffuser 60 см для вспышки', 'softboks-smdv-diffuser-60-sm-dlya-vspyshki', NULL, 1300, 780, 1040, 0, 13000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:25.919', '2026-03-27 23:25:25.919', '[]'),
('9a8bf778-ceeb-4a4c-b4c8-181f0ad075fd', 'Canon EOS R Body', 'canon-eos-r-body', NULL, 19000, 11400, 15200, 180000, 190000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:26.038', '2026-03-27 23:25:26.038', '[]'),
('9d58eb3d-6676-4585-8cb2-e2b5c96c7dc9', 'Power bank внешний аккумулятор Baseus', 'power-bank-vneshnij-akkumulyator-baseus', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd5c8de84-0ca0-416b-9bf6-09fe5f14dda7', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:26.258', '2026-03-27 23:25:26.258', '[]'),
('9d624d40-e510-459a-8dd7-c4f0a11ad0cd', 'Стойка Manfrotto 052B (280мм)', 'stojka-manfrotto-052b-280mm-5', '', 1500, 900, 1200, 0, 15000, '36186632-cb84-46f2-b98c-7110e2ed5b16', 'd52fab08-fc51-42a5-9eda-20432ef5d49c', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", 'Стойка Manfrotto 052B (280мм) - 5', '', '', '', 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:26.378', '2026-04-18 12:55:12.410', '[]'),
('9d7eeebe-6362-41d9-9997-5f6ae9a18250', 'Объектив Canon 16-35mm f/2.8L III USM байонет EF', 'obektiv-canon-16-35mm-f28l-iii-usm-bajonet-ef', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:26.509', '2026-03-27 23:25:26.509', '[]'),
('9d8035a9-62a2-4b4b-9455-e30c1aef306b', 'hollyland mars 400s pro hdmi/sdi RC', 'hollyland-mars-400s-pro-hdmisdi-rc', NULL, 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:26.627', '2026-03-27 23:25:26.627', '[]'),
('9d8f6ba9-f2c8-428d-906e-25fe9ca5c000', 'Cинхронизатор Godox X pro - C (Сторонняя)', 'cinhronizator-godox-x-pro-c-storonnyaya', NULL, 700, 420, 560, 0, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f8196d71-c99e-4bc2-a902-6cdaaf1352de', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:26.743', '2026-03-27 23:25:26.743', '[]'),
('9dc94dd3-7b35-408f-b29b-b6046bb98be0', 'Карта памяти Kingston 64GB', 'karta-pamyati-kingston-64gb', NULL, 200, 120, 160, 0, 1600, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:26.860', '2026-03-27 23:25:26.860', '[]'),
('9fca9191-8828-4cad-96ab-ff1824d566d6', 'призма', 'prizma', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:27.300', '2026-03-27 23:25:27.300', '[]'),
('a02856a3-8814-43b5-8a3d-97dc310bbd5d', 'Стойка Manfrotto 052B (280мм)', 'stojka-manfrotto-052b-280mm-4', '', 1500, 900, 1200, 0, 15000, '36186632-cb84-46f2-b98c-7110e2ed5b16', 'd52fab08-fc51-42a5-9eda-20432ef5d49c', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", 'Стойка Manfrotto 052B (280мм) - 4', '', '', '', 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:27.418', '2026-04-18 12:55:12.410', '[]'),
('a0885277-c403-40a1-9213-7f97d0354e0e', 'Рекордер ZOOM H5 HANDY', 'rekorder-zoom-h5-handy', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '45986e26-580e-44ae-b8bb-7f3efeac8651', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:27.533', '2026-03-27 23:25:27.533', '[]'),
('a0c32101-082b-4a35-a129-da870b3fb151', 'Godox SL 150 II', 'godox-sl-150-ii', NULL, 3500, 2100, 2800, 0, 35000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fa93058e-0c39-479a-8782-f175d62aa148', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:27.649', '2026-03-27 23:25:27.649', '[]'),
('a2c61392-252d-48e3-a33d-9fc166600f9c', 'Аккумулятор для вспышки Godox VB26 V1 v860 (CM)', 'akkumulyator-dlya-vspyshki-godox-vb26-v1-v860-cm', NULL, 200, 120, 160, 0, 1000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd989dfa9-6e2b-45b0-9dc0-4bb1f3e72b8a', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:27.765', '2026-03-27 23:25:27.765', '[]'),
('a39e2a43-0feb-4316-9e70-7bbc24c30d1e', 'АКБ для квадрокоптер DJI Mini', 'akb-dlya-kvadrokopter-dji-mini', NULL, 200, 120, 160, 0, 1500, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'ce3e2114-1747-47c3-b4bd-56b2be6117f4', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:27.988', '2026-03-27 23:25:27.988', '[]'),
('a3c2cb84-9842-4716-932a-1d9746391d0b', 'Микрофон rode podmic', 'mikrofon-rode-podmic-2', NULL, 2000, 1200, 1600, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fef135f8-8186-4192-b697-22c165b4e838', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:28.111', '2026-03-27 23:25:28.111', '[]'),
('a3f34a0a-ba29-4d34-9e0b-40f7a62b740a', 'Вспышка накамерная Godox VING V850II', 'vspyshka-nakamernaya-godox-ving-v850ii', NULL, 1200, 720, 960, 0, 12000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '01c1d230-5aab-4e45-8c2e-3be9036117e9', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:28.233', '2026-03-27 23:25:28.233', '[]'),
('a4a1b13d-1b73-48e9-a71d-ffc804766db2', 'Зарядное устройство Sony NP-FZ100', 'zaryadnoe-ustrojstvo-sony-np-fz100', NULL, 800, 480, 640, 9000, 10000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '1351fd26-8837-4255-9939-d016c62a780c', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:28.360', '2026-03-27 23:25:28.360', '[]'),
('a4db80d6-8906-43b0-b988-11567935268c', 'АКБ Nikon EN-EL15 Аккумулятор', 'akb-nikon-en-el15-akkumulyator', NULL, 500, 300, 400, 0, 6000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '93a11a98-d8f9-4160-ae84-0c80d784799b', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:28.651', '2026-03-27 23:25:28.651', '[]'),
('a55190a4-2d42-4b01-a287-2e3ecc081eba', 'Отражатель', 'otrazhatel', NULL, 800, 480, 640, 0, 8000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '07e624c5-d2b1-4f43-a34c-3bf0e7392273', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:28.769', '2026-03-27 23:25:28.769', '[]'),
('a61717ed-e756-40b7-8b7a-f1950edf9e25', 'АКБ Canon LP-E6N Аккумулятор', 'akb-canon-lp-e6n-akkumulyator-1', NULL, 550, 330, 440, 0, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd989dfa9-6e2b-45b0-9dc0-4bb1f3e72b8a', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:28.886', '2026-03-27 23:25:28.886', '[]'),
('aa4e888d-0381-4174-a23b-68d71d77cddd', 'Стойка  Ari 4000', 'stojka-ari-4000', NULL, 6000, 3600, 4800, 0, 60000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0f196350-24f0-483e-a7a8-17bcc017f0b0', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:29.017', '2026-03-27 23:25:29.017', '[]'),
('aa949f89-93dc-45df-83df-f22a503938ad', 'Ткань черная (Бол)', 'tkan-chernaya-bol', NULL, 500, 300, 400, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '41960654-d394-4f68-b48f-6fed7f6f3fc1', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:29.241', '2026-03-27 23:25:29.241', '[]'),
('ab0f9efc-3877-42ba-beba-cea36af03003', 'Портретная тарелка на Bowens с сотами', 'portretnaya-tarelka-na-bowens-s-sotami', NULL, 1000, 600, 800, 0, 10000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:29.943', '2026-03-27 23:25:29.943', '[]'),
('acce4c27-534a-4fe7-adb7-de96b1fbd4b6', 'Карта памяти Kingston Canvas Select Plus 64 ГБ (бронировать только с ZOOM)', 'karta-pamyati-kingston-canvas-select-plus-64-gb-bronirovat-tolko-s-zoom', 'Сдается только в комплекте с зумом', 200, 120, 160, 0, 700, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:30.203', '2026-03-27 23:25:30.203', '[]'),
('ae49ecdb-00fd-4312-b12e-0297114e1c50', 'Стойка manfrotto компактная', 'stojka-manfrotto-kompaktnaya', NULL, 800, 480, 640, 0, 8000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:30.321', '2026-03-27 23:25:30.321', '[]'),
('af387da6-3c54-4f98-b9b8-d93f02d22c28', 'Карта памяти Samsung EVO Plus 128GB (5)', 'karta-pamyati-samsung-evo-plus-128gb-5', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:30.454', '2026-03-27 23:25:30.454', '[]'),
('af9b88ef-802f-45f6-89cf-4a8c149ce382', 'Зонт на отражение', 'zont-na-otrazhenie', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:30.572', '2026-03-27 23:25:30.572', '[]'),
('afbb756d-744e-4289-8b7e-6c5147408a91', 'Объектив Sony FE 85 mm f/1.4 GM', 'obektiv-sony-fe-85-mm-f14-gm', NULL, 8000, 4800, 6400, 0, 80000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:30.688', '2026-03-27 23:25:30.688', '[]'),
('b327e62f-5409-4425-9d40-a0db16508775', 'АКБ Sony NP-FZ100 Аккумулятор', 'akb-sony-np-fz100-akkumulyator', NULL, 650, 390, 520, 0, 8000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd989dfa9-6e2b-45b0-9dc0-4bb1f3e72b8a', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:30.808', '2026-03-27 23:25:30.808', '[]'),
('b3d10a77-9658-4e0d-b9f3-82dddd0fdc8c', 'Sigma AF 18-50mm f/2.8 кроп for Sony E', 'sigma-af-18-50mm-f28-krop-for-sony-e', '', 5000, 3000, 4000, 0, 52000, 'eea82e65-767e-4832-9809-3032e816a9eb', '26ee16d5-927b-4c53-b223-d17752cc8805', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", '1234', '', '', '', 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:30.925', '2026-03-27 23:25:30.925', '[]'),
('b702eb8d-17d6-4395-8fa6-28085e87db30', 'Ulanzi VL119 Mini RGB', 'ulanzi-vl119-mini-rgb', NULL, 300, 180, 240, 0, 3000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fa93058e-0c39-479a-8782-f175d62aa148', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:31.044', '2026-03-27 23:25:31.044', '[]'),
('b744ca7f-74c4-4f59-afce-adb699fc1ab5', 'Объектив Sony 70-200mm f/4 G OSS (Delight Делайт)', 'obektiv-sony-70-200mm-f4-g-oss-delight-delajt', NULL, 10000, 6000, 8000, 0, 100000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:31.169', '2026-03-27 23:25:31.169', '[]'),
('b788a62d-c3e3-45e0-a4fe-116db364043d', 'HDMI кабель', 'hdmi-kabel', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e69a50e6-352b-49dd-aa0f-1ddf2cf0f74a', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:31.294', '2026-03-27 23:25:31.294', '[]'),
('b91621fb-5954-4cbe-aeeb-ec7d74118d19', 'Аккумулятор NP- 970D (7800mah) RC', 'akkumulyator-np-970d-7800mah-rc', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:31.516', '2026-03-27 23:25:31.516', '[]'),
('b9990804-0ff6-4ee5-bda1-8da1668a9f54', 'Стойка Журавль Manfrotto 420CSU', 'stojka-zhuravl-manfrotto-420csu', NULL, 6000, 3600, 4800, 0, 60000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:31.637', '2026-03-27 23:25:31.637', '[]'),
('b9b2154e-0b5a-4618-a0bd-5a200f9811ff', 'Объектив Nikon 14-24mm f/2.8G ED AF-S Nikkor байонет F', 'obektiv-nikon-14-24mm-f28g-ed-af-s-nikkor-bajonet-f', NULL, 15500, 9300, 12400, 140000, 155000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:31.753', '2026-03-27 23:25:31.753', '[]'),
('ba5d21d0-7afd-45ed-98cb-6cc1e62c4c0a', 'Объектив Tamron 28-75mm f/2.8 Di III VXD G2 Sony E (RC)', 'obektiv-tamron-28-75mm-f28-di-iii-vxd-g2-sony-e-rc', NULL, 6000, 3600, 4800, 0, 60000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:31.878', '2026-03-27 23:25:31.878', '[]'),
('ba655f50-9d46-49f5-a875-ee54ed0dadfd', 'Камера Sony A7C', 'kamera-sony-a7c', NULL, 14000, 8400, 11200, 0, 140000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:32.003', '2026-03-27 23:25:32.003', '[]'),
('bb1eebf1-0474-4419-9a12-c1f4fd95d924', 'Объектив Canon 24-70 2.8 ii L байонет EF', 'obektiv-canon-24-70-28-ii-l-bajonet-ef', 'Canon EF 24-70mm f/2.8L II USM – новый стандартный зум-объектив профессионального уровня. Данный объектив полностью заменяет собой предыдущую модель, EF 24-70mm f/2.8L USM, одновременно они выпускаться не будут. Благодаря своему универсальному фокусному диапазону и высокой светосиле данная модель была очень популярна, как в профессиональной, так и в любительской среде: 24 мм обеспечивают очень широкий угол зрения на полноформатной фототехнике, и в то же время подходят для использования с матрицами формата APS-C (38 мм в эквиваленте), а 70 мм хватает для создания портретов. Объектив хорош как для работы в жанре «репортаж», в стесненных условиях, так и для любительской съемки на отдыхе.', 1900, 1140, 1520, 0, 120000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '6a715990-413c-47ae-9c95-3e59e635ad85', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:32.571', '2026-03-27 23:25:32.571', '[]'),
('bbd7f05a-ad6b-4539-a7ea-4f0cb6df2f31', 'Canon EF 50mm f/1.8 STM Rentacamera', 'canon-ef-50mm-f18-stm-rentacamera', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f8196d71-c99e-4bc2-a902-6cdaaf1352de', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:32.756', '2026-03-27 23:25:32.756', '[]'),
('bd14a4c0-7e26-4de9-97f7-4e59c6954f7f', 'Стойка Manfrotto 052B (280мм)', 'stojka-manfrotto-052b-280mm-ne-stavit-v-arendu', '', 1500, 900, 1200, 0, 15000, '36186632-cb84-46f2-b98c-7110e2ed5b16', 'd52fab08-fc51-42a5-9eda-20432ef5d49c', FALSE, FALSE, 'AVAILABLE'::"EquipmentStatus", 'Стойка Manfrotto 052B (280мм) - НЕ СТАВИТЬ В АРЕНДУ', '', '', '', 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:32.874', '2026-04-18 12:55:12.410', '[]'),
('bd949b60-3737-4b69-af1d-7f44c4735d37', 'Стойка Manfrotto 052B (280мм)', 'stojka-manfrotto-052b-280mm-2', '', 1500, 900, 1200, 0, 15000, '36186632-cb84-46f2-b98c-7110e2ed5b16', 'd52fab08-fc51-42a5-9eda-20432ef5d49c', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", 'Стойка Manfrotto 052B (280мм) - 2', '', '', '', 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:32.997', '2026-04-18 12:55:12.483', '[]'),
('bdd3d3a8-8a2b-4717-9834-02e218a86587', 'Карта памяти Samsung EVO Plus 128GB (1)', 'karta-pamyati-samsung-evo-plus-128gb-1-1', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:33.125', '2026-03-27 23:25:33.125', '[]'),
('be0983cc-bbd0-412a-a130-51e73073fda1', 'Dji osmo mobile 6 (EO 200)', 'dji-osmo-mobile-6-eo-200', NULL, 2000, 1200, 1600, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:33.250', '2026-03-27 23:25:33.250', '[]'),
('c01faa22-7f85-4a3f-9d45-5b00eb40a08e', 'Panasonic Lumix 7-14mm f/4.0 G Vario ASPH', 'panasonic-lumix-7-14mm-f40-g-vario-asph', NULL, 8000, 4800, 6400, 71000, 81000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:33.370', '2026-03-27 23:25:33.370', '[]'),
('c062158e-ce2b-4553-b95c-456982077ae4', 'Камера Sony A6700 (кроп)', 'kamera-sony-a6700-krop', NULL, 10000, 6000, 8000, 0, 100000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:33.488', '2026-03-27 23:25:33.488', '[]'),
('c10a326f-f576-4996-8745-37d78d477b02', 'Объектив Canon 70- 200 f/4', 'obektiv-canon-70-200-f4', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:33.608', '2026-03-27 23:25:33.608', '[]'),
('c118f167-9c6d-4995-9754-c6ef0b8f5f7f', 'Hensel expert pro 500', 'hensel-expert-pro-500', NULL, 5000, 3000, 4000, 0, 50000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd5c8de84-0ca0-416b-9bf6-09fe5f14dda7', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:33.890', '2026-03-27 23:25:33.890', '[]'),
('c1ca4faf-5ab3-49d2-9805-46f806f96c22', 'Canon 6m2', 'canon-6m2', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f8196d71-c99e-4bc2-a902-6cdaaf1352de', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:34.006', '2026-03-27 23:25:34.006', '[]'),
('c2a81485-f349-4cdd-86d8-19dd916db8cb', 'Интерком SYNCO Xtalk X5', 'interkom-synco-xtalk-x5', NULL, 6000, 3600, 4800, 0, 60000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f8196d71-c99e-4bc2-a902-6cdaaf1352de', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:34.120', '2026-03-27 23:25:34.120', '[]'),
('c2eae77b-6dac-4a82-9b9c-8ad30b5b899d', 'Эпл бокс комплект ящиков (RC)', 'epl-boks-komplekt-yashhikov-rc', NULL, 500, 300, 400, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e18c2419-095f-40fc-a043-e2420cb43420', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:34.237', '2026-03-27 23:25:34.237', '[]'),
('c57da74c-497e-4e33-95cf-2043e3d805b4', 'Аккумулятор NP- 970D2 (7800mah) RC', 'akkumulyator-np-970d2-7800mah-rc', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:34.361', '2026-03-27 23:25:34.361', '[]'),
('c5e655ef-f58a-466c-8976-c9362160ee25', 'Синхронизатор Godox X1T-S', 'sinhronizator-godox-x1t-s', NULL, 700, 420, 560, 2500, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:34.479', '2026-03-27 23:25:34.479', '[]'),
('c6ac9099-1c1d-4e59-a375-5cf55f92f7a3', 'Радиосистема Ulanzi U-Mic AM18', 'radiosistema-ulanzi-u-mic-am18-1', NULL, 800, 480, 640, 0, 12000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fef135f8-8186-4192-b697-22c165b4e838', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:34.595', '2026-03-27 23:25:34.595', '[]'),
('c6ae24b1-df6e-4d5d-bfdf-c0ced5407845', 'Стул', 'stul', NULL, 200, 120, 160, 0, 800, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e18c2419-095f-40fc-a043-e2420cb43420', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:34.712', '2026-03-27 23:25:34.712', '[]'),
('c8606216-b3af-4c12-a203-a6827185ec0a', 'Tamron Sony FE 70-180 mm F/2.8', 'tamron-sony-fe-70-180-mm-f28', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f8196d71-c99e-4bc2-a902-6cdaaf1352de', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:34.827', '2026-03-27 23:25:34.827', '[]'),
('c86d6499-0f6f-4dad-907e-dec53a712757', 'Постоянный портативный светодиодный свет Zhiyun Cinepeer CX100', 'postoyannyj-portativnyj-svetodiodnyj-svet-zhiyun-cinepeer-cx100', NULL, 2000, 1200, 1600, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fa93058e-0c39-479a-8782-f175d62aa148', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:34.960', '2026-03-27 23:25:34.960', '[]'),
('c8ab5f2c-cdad-454f-9f0d-c4fd09c79aae', 'Параболический софтбокс  Jinbei  120 см быстроскладной', 'parabolicheskij-softboks-jinbei-120-sm-bystroskladnoj', 'Байонет bowens', 1700, 1020, 1360, 0, 17000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:35.076', '2026-03-27 23:25:35.076', '[]'),
('c961344c-193d-4c72-82eb-4c05d33bf572', 'Экшн-камера GoPro HERO 12 (RC)', 'ekshn-kamera-gopro-hero-12-rc', NULL, 3000, 1800, 2400, 0, 30000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:35.195', '2026-03-27 23:25:35.195', '[]'),
('c9662c23-6978-43cb-9b3b-e9004c2c4b38', 'Переходник HDMI - miniHDMI', 'perehodnik-hdmi-minihdmi-1', NULL, 200, 120, 160, 0, 1000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '782c15ff-3437-4eb8-aa35-d209a5c56f78', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:35.412', '2026-03-27 23:25:35.412', '[]'),
('c99f06ca-39f5-4a98-ad07-fb182108146a', 'Перекладина Manfrotto', 'perekladina-manfrotto', NULL, 2000, 1200, 1600, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e182b449-b4c6-4713-a568-3f7f4eae4094', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:35.528', '2026-03-27 23:25:35.528', '[]'),
('cad7bf6d-0c4c-4a97-b5ba-62d75cbb1e86', 'Держатель отражателей Manfrotto D705B', 'derzhatel-otrazhatelej-manfrotto-d705b', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0fb5b322-3a92-4f87-9e48-a612a8a3d29c', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:35.645', '2026-03-27 23:25:35.645', '[]'),
('cb00f358-4834-4d69-ba7a-d8a126f31eee', 'Телесуфлер PIXAERO mobus', 'telesufler-pixaero-mobus', NULL, 1500, 900, 1200, 0, 15000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f201fbac-7c27-4385-9122-0565961f6943', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:35.760', '2026-03-27 23:25:35.760', '[]'),
('cd668bd3-0b21-420c-bba4-ff281be9a65a', 'Зонт на просвет', 'zont-na-prosvet', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:35.879', '2026-03-27 23:25:35.879', '[]'),
('cd6dcfdd-ac71-483c-8c14-abe7cd6d8514', 'Видеомикшер Blackmagic ATEM Mini Pro ISO', 'videomiksher-blackmagic-atem-mini-pro-iso', NULL, 6000, 3600, 4800, 0, 60000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '3148dc98-4cb7-4eb1-a6ff-aa6948c589d8', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:35.995', '2026-03-27 23:25:35.995', '[]'),
('cde908ea-8582-49bb-8d43-71bc3438c1f6', 'Вспышка накамерная Godox TT350S for Sony 2', 'vspyshka-nakamernaya-godox-tt350s-for-sony-2', NULL, 800, 480, 640, 0, 8000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '01c1d230-5aab-4e45-8c2e-3be9036117e9', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:36.110', '2026-03-27 23:25:36.110', '[]'),
('cf22c0a1-291c-46e7-af96-361297d5e7dc', 'Радиосистема Boya BY-WM8 Pro-K2', 'radiosistema-boya-by-wm8-pro-k2', NULL, 2000, 1200, 1600, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '09e37cd8-815e-4467-981e-a83f5c522613', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:36.327', '2026-03-27 23:25:36.327', '[]'),
('cf2e8639-3bc2-44c9-bfff-13acddb255f1', 'Вспышка накамерная Canon Speedlite 430 EX II', 'vspyshka-nakamernaya-canon-speedlite-430-ex-ii', NULL, 1900, 1140, 1520, 0, 18900, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '418a5dd1-ddb4-4f6b-bd75-475e8d283c5b', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:36.445', '2026-03-27 23:25:36.445', '[]'),
('cfaf6785-09fc-4ccb-8cb2-1f93ac875fc7', 'Aputure Amaran 300C RGB', 'aputure-amaran-300c-rgb-2', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:36.560', '2026-03-27 23:25:36.560', '[]'),
('d00ef6ab-dd19-4cf2-bcd2-f99e9fc58a05', 'Объектив Nikon 105mm f/2.8G IF-ED AF-S VR Micro-Nikkor байонет F', 'obektiv-nikon-105mm-f28g-if-ed-af-s-vr-micro-nikkor-bajonet-f', NULL, 8500, 5100, 6800, 0, 86000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:36.671', '2026-03-27 23:25:36.671', '[]');
INSERT INTO "Equipment" ("id", "title", "slug", "description", "pricePerDay", "price4h", "price8h", "deposit", "replacementValue", "categoryId", "subcategoryId", "isAvailable", "isPrimary", "status", "inventoryNumber", "defects", "kit", "kitDescription", "ownershipType", "partnerName", "specifications", "comments", "createdAt", "updatedAt", "videoUrls") VALUES
('d12a3d6e-fbcc-4f7c-97c2-c1f64fff7c86', 'Объектив Nikon AF-S Nikkor 70-200mm f/2,8E FL ED VR байонет F', 'obektiv-nikon-af-s-nikkor-70-200mm-f28e-fl-ed-vr-bajonet-f', NULL, 25000, 15000, 20000, 240000, 250000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:36.795', '2026-03-27 23:25:36.795', '[]'),
('d143fb1a-2f0e-4013-ae14-d7bdab94cdd8', 'Радиосистема петличная Sennheiser G4-A1 S/0045', 'radiosistema-petlichnaya-sennheiser-g4-a1-s0045', 'комплектация:\r\n1. Приемник сигнала\r\n2. Провод miniJACK - XLR\r\n3. Площадка с башмаком\r\n4. Сумка', 8000, 4800, 6400, 0, 80000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fef135f8-8186-4192-b697-22c165b4e838', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:37.017', '2026-03-27 23:25:37.017', '[]'),
('d280bbb8-b069-416f-b14f-bd44fd652b3a', 'Объектив Canon 24-70 2.8 ii L байонет EF', 'obektiv-canon-24-70-28-ii-l-bajonet-ef-1', 'Canon EF 24-70mm f/2.8L II USM – новый стандартный зум-объектив профессионального уровня. Данный объектив полностью заменяет собой предыдущую модель, EF 24-70mm f/2.8L USM, одновременно они выпускаться не будут. Благодаря своему универсальному фокусному диапазону и высокой светосиле данная модель была очень популярна, как в профессиональной, так и в любительской среде: 24 мм обеспечивают очень широкий угол зрения на полноформатной фототехнике, и в то же время подходят для использования с матрицами формата APS-C (38 мм в эквиваленте), а 70 мм хватает для создания портретов. Объектив хорош как для работы в жанре «репортаж», в стесненных условиях, так и для любительской съемки на отдыхе.', 1900, 1140, 1520, 0, 120000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '6a715990-413c-47ae-9c95-3e59e635ad85', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:37.134', '2026-03-27 23:25:37.134', '[]'),
('d295d33b-31b5-4390-96b9-57e38a44011f', 'Raylab 200 #2', 'raylab-200-2', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:37.250', '2026-03-27 23:25:37.250', '[]'),
('d515b75c-21ab-4a7c-a0a7-cf5c6c6ecc05', 'Объектив Canon 85mm f/1.8 байонет EF (RC)', 'obektiv-canon-85mm-f18-bajonet-ef-rc', NULL, 3000, 1800, 2400, 0, 30000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:37.366', '2026-03-27 23:25:37.366', '[]'),
('d5e4da77-6291-48d8-9dad-7a2b74ffa43f', 'Sony a7 IV', 'sony-a7-iv-2', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:37.481', '2026-03-27 23:25:37.481', '[]'),
('d605261d-ccac-498e-b4d8-4ce2665f4498', 'Дым-машина Fogger 900', 'dym-mashina-fogger-900', NULL, 500, 300, 400, 0, 5000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:37.603', '2026-03-27 23:25:37.603', '[]'),
('d6126959-44cc-49a2-8e80-1246a28b00eb', 'Соты на hensel', 'soty-na-hensel', NULL, 550, 330, 440, 0, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '07e624c5-d2b1-4f43-a34c-3bf0e7392273', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:37.858', '2026-03-27 23:25:37.858', '[]'),
('d73bd50c-ff11-499b-ae43-d76d26b2df14', 'Параболический софтбокс Ambitful 90 см быстроскладной', 'parabolicheskij-softboks-ambitful-90-sm-bystroskladnoj', 'Байонет Bowens', 1000, 600, 800, 0, 10000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:37.977', '2026-03-27 23:25:37.977', '[]'),
('d797bf62-494b-4a8b-a2ce-7ad67e0d6f5a', 'Синхронизатор Godox X Pro S', 'sinhronizator-godox-x-pro-s', NULL, 700, 420, 560, 0, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '9efb339e-c09a-45e1-8056-081e645680f3', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:38.094', '2026-03-27 23:25:38.094', '[]'),
('d7c824cc-a621-43e9-9c4a-32e9d6f9c6e1', 'Prograf на hensel 50х120', 'prograf-na-hensel-50h120', NULL, 2000, 1200, 1600, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f8196d71-c99e-4bc2-a902-6cdaaf1352de', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:38.213', '2026-03-27 23:25:38.213', '[]'),
('d7e6a96f-253d-4586-89aa-ab244c951483', 'Переходник Canon EOS R EF(RC)', 'perehodnik-canon-eos-r-efrc', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '93a11a98-d8f9-4160-ae84-0c80d784799b', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:38.336', '2026-03-27 23:25:38.336', '[]'),
('d9714ef8-9c04-44ff-bb32-d2a91be636f7', 'Объектив Sigma AF 35mm f/1.4 DG HSM Art Nikon F байонет F', 'obektiv-sigma-af-35mm-f14-dg-hsm-art-nikon-f-bajonet-f', NULL, 6000, 3600, 4800, 45000, 58000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:38.472', '2026-03-27 23:25:38.472', '[]'),
('d986142f-f973-4231-ab13-731a7460c7c7', 'Hensel expert pro 500', 'hensel-expert-pro-500-1', NULL, 4500, 2700, 3600, 0, 45000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f8196d71-c99e-4bc2-a902-6cdaaf1352de', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:38.695', '2026-03-27 23:25:38.695', '[]'),
('da07b881-db97-451a-9860-b745abd155da', 'Godox S-Type Speedlite Bowens / Elinchrom S, адаптер для крепления вспышки', 'godox-s-type-speedlite-bowens-elinchrom-s-adapter-dlya-krepleniya-vspyshki', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '782c15ff-3437-4eb8-aa35-d209a5c56f78', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:38.834', '2026-03-27 23:25:38.834', '[]'),
('da3c95ab-f5ac-4df5-af78-b904a4e4f805', 'Объектив Sony FE 90mm f/2.8 Macro G OSS (RC)', 'obektiv-sony-fe-90mm-f28-macro-g-oss-rc', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:38.954', '2026-03-27 23:25:38.954', '[]'),
('da558437-dc01-4cfe-b797-a2cad4155082', 'Генераторный свет Godox RS 400P', 'generatornyj-svet-godox-rs-400p', NULL, 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:39.073', '2026-03-27 23:25:39.073', '[]'),
('dc12db90-a390-4446-becc-f684b0318b7f', 'Объектив Canon 70-200mm f/2.8L IS II (RC)', 'obektiv-canon-70-200mm-f28l-is-ii-rc', NULL, 8000, 4800, 6400, 0, 80000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:39.204', '2026-03-27 23:25:39.204', '[]'),
('dc7c5607-05ba-453a-97be-d9954e771c96', 'Система для установки фона Manfrotto «Ворота»', 'sistema-dlya-ustanovki-fona-manfrotto-vorota', NULL, 3500, 2100, 2800, 0, 35000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:39.328', '2026-03-27 23:25:39.328', '[]'),
('dcdbddd6-cc0e-4946-ac9d-9d56c616ddeb', 'Godox Tl60 RGB', 'godox-tl60-rgb-1', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:39.453', '2026-03-27 23:25:39.453', '[]'),
('dd66445c-46f8-4ef5-aba8-3cf24eee6509', 'Октобокс зонт. Phottix 100', 'oktoboks-zont-phottix-100', NULL, 400, 240, 320, 0, 4000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:39.582', '2026-03-27 23:25:39.582', '[]'),
('ddb4185d-6fab-4eda-a281-982d7d2c39ac', 'Журавль большой', 'zhuravl-bolshoj', NULL, 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:39.702', '2026-03-27 23:25:39.702', '[]'),
('dee56edd-e245-4d9b-bdca-4044f215921f', 'Камера Sony FX3 (DL)', 'kamera-sony-fx3-dl', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:39.824', '2026-03-27 23:25:39.824', '[]'),
('df134bf6-090d-4e44-91ee-a56f17bceb48', 'Кабель tipe-c -  tipe-c 5 метров', 'kabel-tipe-c-tipe-c-5-metrov', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'e69a50e6-352b-49dd-aa0f-1ddf2cf0f74a', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:39.940', '2026-03-27 23:25:39.940', '[]'),
('e06ad7c6-9453-4fab-ae2b-594251972fef', 'Переходник М42 на Sony e fotga', 'perehodnik-m42-na-sony-e-fotga', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '782c15ff-3437-4eb8-aa35-d209a5c56f78', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:40.060', '2026-03-27 23:25:40.060', '[]'),
('e0b02eb9-abe2-40a1-8e32-aa4c24c965b6', 'Sony a7 C', 'sony-a7-c', NULL, 14000, 8400, 11200, 130000, 140000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:40.194', '2026-03-27 23:25:40.194', '[]'),
('e206b1ab-ce93-416f-b572-b2542f8358ff', 'Вспышка аккумуляторная Godox Witstro AD300', 'vspyshka-akkumulyatornaya-godox-witstro-ad300', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'd5c8de84-0ca0-416b-9bf6-09fe5f14dda7', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:40.336', '2026-03-27 23:25:40.336', '[]'),
('e2a6d76e-d8d9-4e80-805c-959828085bca', 'Объектив Sony FE 90mm f/2.8 Macro G OSS', 'obektiv-sony-fe-90mm-f28-macro-g-oss', NULL, 10000, 6000, 8000, 90000, 100000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:40.453', '2026-03-27 23:25:40.453', '[]'),
('e3b6c300-9858-4bd8-b40b-add6187fbb58', 'Aputure Amaran 150C', 'aputure-amaran-150c-2', 'Aputure Amaran 150C — это мощный и компактный светодиодный осветитель мощностью 150 Вт, который выделяется возможностью работы в полноцветном режиме (RGBWW). В отличие от обычных ламп, он позволяет не просто менять температуру света от теплой к холодной (2500K–7500K), но и выставлять абсолютно любой оттенок из палитры 360° HSI.\r\nПрибор оснащен универсальным байонетом Bowens, что делает его совместимым почти с любыми софтбоксами и насадками. Он выдает очень точный свет (CRI 95+), имеет бесшумное охлаждение и удобно управляется со смартфона через приложение Sidus Link. Это отличный выбор для блогеров и видеографов, которым нужен качественный основной свет с возможностью творческих цветовых акцентов.', 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fa93058e-0c39-479a-8782-f175d62aa148', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:40.573', '2026-03-27 23:25:40.573', '[]'),
('e4073913-fe81-4841-b829-974eefe5a8fb', 'Пленочная камера Nikon F75', 'plenochnaya-kamera-nikon-f75', NULL, 600, 360, 480, 0, 6000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:40.694', '2026-03-27 23:25:40.694', '[]'),
('e42fbfab-e8f5-4a29-9c5d-569811140d7c', 'Canon ef 70-200 f2.8 (DL)', 'canon-ef-70-200-f28-dl', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:40.818', '2026-03-27 23:25:40.818', '[]'),
('e4a7cbcd-5a98-4d49-a7a3-e39b319317e2', 'Стойка Manfrotto 052B (280мм)', 'stojka-manfrotto-052b-280mm-3', '', 1500, 900, 1200, 0, 15000, '36186632-cb84-46f2-b98c-7110e2ed5b16', 'd52fab08-fc51-42a5-9eda-20432ef5d49c', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", ' Стойка Manfrotto 052B (280мм) - 3', '', '', '', 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:40.945', '2026-04-18 12:55:12.410', '[]'),
('e4b8e682-7803-4315-99f9-534abdcfe95e', 'Объектив Tamron 28-75mm f/2.8 Di III Sony E (2)', 'obektiv-tamron-28-75mm-f28-di-iii-sony-e-2', NULL, 9000, 5400, 7200, 0, 88000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:41.168', '2026-03-27 23:25:41.168', '[]'),
('e546f6d5-4ab0-4226-accf-5248d3ced62b', 'Софтбокс Hensel 100x180', 'softboks-hensel-100x180', NULL, 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:41.289', '2026-03-27 23:25:41.289', '[]'),
('e643e2d5-7e01-4f42-87cf-7244bf7de482', 'RODE Rodecaster Pro II', 'rode-rodecaster-pro-ii', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fef135f8-8186-4192-b697-22c165b4e838', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:41.411', '2026-03-27 23:25:41.411', '[]'),
('e6837f9f-3b1d-4611-b38c-2c20009c70e0', 'смена фона', 'smena-fona', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '41960654-d394-4f68-b48f-6fed7f6f3fc1', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:41.529', '2026-03-27 23:25:41.529', '[]'),
('e6ba0d2e-eb83-4a10-ab48-65525294696b', 'Insta360 x3', 'insta360-x3', NULL, 5000, 3000, 4000, 0, 50000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:41.752', '2026-03-27 23:25:41.752', '[]'),
('e6ca47ec-2f62-453f-ac52-59f00e852daa', 'Соты на Bowens', 'soty-na-bowens', NULL, 550, 330, 440, 0, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '07e624c5-d2b1-4f43-a34c-3bf0e7392273', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:42.019', '2026-03-27 23:25:42.019', '[]'),
('e6fe86b0-86ae-44f7-a97d-573152009d6d', 'Nikon 24-70mm f/2.8E ED VR AF-S Nikkor (RC)', 'nikon-24-70mm-f28e-ed-vr-af-s-nikkor-rc', NULL, 17000, 10200, 13600, 0, 170000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '45e763b5-07b1-4561-bddc-a128ec7e2307', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:42.144', '2026-03-27 23:25:42.144', '[]'),
('e73114ba-d232-4d47-a978-47edb80a0a64', 'Карта памяти Samsung EVO Plus 128GB (4)', 'karta-pamyati-samsung-evo-plus-128gb-4', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0a154844-22cb-43a7-b145-4173637a3037', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:42.261', '2026-03-27 23:25:42.261', '[]'),
('e88bbb98-3c3c-4174-9ebc-c36fa644b480', 'Складной октобокс Triopo 55 см для вспышек speedlite', 'skladnoj-oktoboks-triopo-55-sm-dlya-vspyshek-speedlite', 'Субаренда Rentacamera', 400, 240, 320, 0, 4000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:42.377', '2026-03-27 23:25:42.377', '[]'),
('e9a06bfb-d0b6-487b-be90-7cd61b215f34', 'Стрипбокс Aurora 160x70 Hensel', 'stripboks-aurora-160x70-hensel', 'Байонет Hensel', 1500, 900, 1200, 0, 15000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:42.500', '2026-03-27 23:25:42.500', '[]'),
('e9ac4e19-3241-45f2-9460-bce60a921ab8', 'Переходник М42 на nikon f', 'perehodnik-m42-na-nikon-f', NULL, 200, 120, 160, 0, 2000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '93a11a98-d8f9-4160-ae84-0c80d784799b', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:42.621', '2026-03-27 23:25:42.621', '[]'),
('ead71eed-5c28-4edc-b0a5-ebd6ddce0931', 'Осветитель Ulanzi UA20 Air Tube надувной', 'osvetitel-ulanzi-ua20-air-tube-naduvnoj', NULL, 800, 480, 640, 0, 8000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'cc1ffff9-ce9c-422a-a548-766582f2249a', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:42.840', '2026-03-27 23:25:42.840', '[]'),
('eaf195c6-ce24-4843-bc63-0139bcc0bb59', 'Sony a7 IV', 'sony-a7-iv-3', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:42.958', '2026-03-27 23:25:42.958', '[]'),
('ecebbc71-3c94-488b-8ed3-396c485022c3', 'Вспышка накамерная Nikon SB-600', 'vspyshka-nakamernaya-nikon-sb-600', NULL, 1400, 840, 1120, 0, 14000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'cc94a3a3-56ef-448c-95f2-456d81263afb', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:43.072', '2026-03-27 23:25:43.072', '[]'),
('eda45e70-9119-4e25-b938-85bbc0c2565a', 'синхронизатор Godox X2T-N TTL для Nikon', 'sinhronizator-godox-x2t-n-ttl-dlya-nikon', NULL, 700, 420, 560, 4000, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:43.185', '2026-03-27 23:25:43.185', '[]'),
('edb0f7f6-464f-4774-8f10-922f33b7a0bc', 'Жесткий диск SSD (СВ)', 'zhestkij-disk-ssd-sv', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '3148dc98-4cb7-4eb1-a6ff-aa6948c589d8', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:43.301', '2026-03-27 23:25:43.301', '[]'),
('edd5c5cd-3cdf-4ee3-b08f-95c0ac812e28', 'Стойка 2,4 метра', 'stojka-24-metra', NULL, 700, 420, 560, 0, 7000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '0f196350-24f0-483e-a7a8-17bcc017f0b0', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:43.518', '2026-03-27 23:25:43.518', '[]'),
('eec1f8b8-6417-4553-b0ac-17a832576b7b', 'Ручка дополнительного  хвата smallrig', 'ruchka-dopolnitelnogo-hvata-smallrig', NULL, 500, 300, 400, 0, 0, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '5846c4a1-cfed-49d7-9f00-fd539c5f82f9', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:43.634', '2026-03-27 23:25:43.634', '[]'),
('f1023a50-2098-475a-ab9f-1f9cbe1b0b7e', 'Радиосистема Boya BY-WM4 PRO', 'radiosistema-boya-by-wm4-pro', NULL, 1000, 600, 800, 0, 10000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:43.762', '2026-03-27 23:25:43.762', '[]'),
('f1973ca2-65b8-4dee-be4a-a6cd1d9eba27', 'Godox SL 200 II', 'godox-sl-200-ii', NULL, 4000, 2400, 3200, 0, 40000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:43.880', '2026-03-27 23:25:43.880', '[]'),
('f21ae312-1de9-4ec8-b175-c273e2f8c8fa', 'Квадрокоптер DJI Mini 2 + 2 аккума (субаренда)', 'kvadrokopter-dji-mini-2-2-akkuma-subarenda', NULL, 5000, 3000, 4000, 0, 50000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'ce3e2114-1747-47c3-b4bd-56b2be6117f4', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:44.003', '2026-03-27 23:25:44.003', '[]'),
('f24d9c34-67ab-4179-bbe1-3de6edfb1c70', 'Prograf на hensel 90х50', 'prograf-na-hensel-90h50', NULL, 2000, 1200, 1600, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'f8196d71-c99e-4bc2-a902-6cdaaf1352de', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:44.118', '2026-03-27 23:25:44.118', '[]'),
('f31b8350-8db1-453a-b89c-7eb2e072122d', 'Телесуфлер PIXAERO MOBUS (RC)', 'telesufler-pixaero-mobus-rc', NULL, 2000, 1200, 1600, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '3148dc98-4cb7-4eb1-a6ff-aa6948c589d8', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:44.233', '2026-03-27 23:25:44.233', '[]'),
('f5c416a8-150b-47d6-8057-32c0c6c4e3e6', 'Dji RONIN-SC2(RC)', 'dji-ronin-sc2rc', NULL, 9000, 5400, 7200, 0, 88000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:44.351', '2026-03-27 23:25:44.351', '[]'),
('f6718dc1-37db-4ca9-8d73-6fd527afc77e', 'Переходник Nikon - Panasonic', 'perehodnik-nikon-panasonic', NULL, 1200, 720, 960, 0, 15000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:44.472', '2026-03-27 23:25:44.472', '[]'),
('f6e76944-59d6-4eb6-8db9-3524265607bc', 'Штатив Benro с головой Manfrotto', 'shtativ-benro-s-golovoj-manfrotto', NULL, 1500, 900, 1200, 0, 15000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:44.597', '2026-03-27 23:25:44.597', '[]'),
('f75709e3-e351-43ba-a1c9-5ce9df3c7fb2', 'Ambitful FL 80', 'ambitful-fl-80', NULL, 1000, 600, 800, 0, 10000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'fa93058e-0c39-479a-8782-f175d62aa148', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:44.712', '2026-03-27 23:25:44.712', '[]'),
('f85b1c4d-84eb-4043-8449-0e93f633d146', 'Телесуфлер PIXAERO MOBUS (RC)', 'telesufler-pixaero-mobus-rc-1', NULL, 2000, 1200, 1600, 0, 20000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '3148dc98-4cb7-4eb1-a6ff-aa6948c589d8', TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:44.823', '2026-03-27 23:25:44.823', '[]'),
('f967dc4c-85c7-4028-a2da-0206eb4d1756', 'Nikon Speedlight SB-910', 'nikon-speedlight-sb-910', NULL, 2500, 1500, 2000, 20000, 25000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:44.937', '2026-03-27 23:25:44.937', '[]'),
('fa2e336d-f69a-47ac-891f-d31f31712e87', 'Софтбокс Чайнабол Godox CS85D (RC)', 'softboks-chajnabol-godox-cs85d-rc', NULL, 1000, 600, 800, 0, 10000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:45.052', '2026-03-27 23:25:45.052', '[]'),
('fbb8e5e4-7251-4326-9a5a-e65e40c4d230', 'Объектив Sony 70-200 f/2.8 GM II (RC)', 'obektiv-sony-70-200-f28-gm-ii-rc', NULL, 16500, 9900, 13200, 0, 163000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:45.262', '2026-03-27 23:25:45.262', '[]'),
('fc24af8c-6573-4d19-91e1-596517285b3e', 'Вспышка накамерная Godox TT350S for Sony 1', 'vspyshka-nakamernaya-godox-tt350s-for-sony-1', 'Работает только на одной мощности', 800, 480, 640, 5000, 8000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:45.379', '2026-03-27 23:25:45.379', '[]'),
('fce8ba9c-ae99-4b05-969e-10be805ecf1e', 'Переменный ND фильтр K-F CONCEPT Slim vario ND 2-400 82 mm (RC)', 'peremennyj-nd-filtr-k-f-concept-slim-vario-nd-2-400-82-mm-rc', NULL, 200, 120, 160, 0, 2400, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:45.503', '2026-03-27 23:25:45.503', '[]'),
('fd1da76d-86a3-4661-aab1-f90f9639879b', 'Рефлектор на hensel маленький для зонта', 'reflektor-na-hensel-malenkij-dlya-zonta', NULL, 250, 150, 200, 0, 3000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'b0591630-9bf7-42e7-8c47-aa31a85a4508', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:45.621', '2026-03-27 23:25:45.621', '[]'),
('fe6e85f9-c6fa-4429-a36a-d2617ccec752', 'Прищепка для фона', 'prishhepka-dlya-fona-1', NULL, 600, 360, 480, 0, 6000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', NULL, TRUE, FALSE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:45.762', '2026-03-27 23:25:45.762', '[]'),
('ff0c6c82-93d2-4673-921f-0b968479edd1', 'Гелевые фильтры', 'gelevye-filtry', NULL, 200, 120, 160, 0, 1000, '9f52f9e3-49a8-4766-a82f-a344b83b68ca', '4a65ee06-4e64-4181-af94-0ee57ecf907e', TRUE, TRUE, 'AVAILABLE'::"EquipmentStatus", NULL, NULL, NULL, NULL, 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:46.019', '2026-04-18 14:34:38.597', '[]'),
('ff9faa6b-edc3-4a81-9cc1-33b25281cb65', 'Стойка Manfrotto 052B (280мм)', 'stojka-manfrotto-052b-280mm', '', 400, 200, 250, 0, 15000, '36186632-cb84-46f2-b98c-7110e2ed5b16', 'd52fab08-fc51-42a5-9eda-20432ef5d49c', TRUE, FALSE, 'RESERVED'::"EquipmentStatus", 'Стойка Manfrotto 052B (280мм) - 1', '', '', '', 'INTERNAL'::"OwnershipType", NULL, '{}', '[]', '2026-03-27 23:25:46.138', '2026-04-18 12:55:12.410', '[]');
-- --------------------------------------------------------
--
-- Структура таблицы `EquipmentImageLink`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "EquipmentImageLink" CASCADE;
CREATE TABLE IF NOT EXISTS "EquipmentImageLink" (
  "id" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "imageId" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0
);
--
-- Дамп данных таблицы `EquipmentImageLink`
--
INSERT INTO "EquipmentImageLink" ("id", "equipmentId", "imageId", "orderIndex") VALUES
('14b5ca5d-543b-4240-a420-8114ede71f34', '35f7435b-3a62-43a8-8d92-5e2292916821', 'ed0e776a-48ef-44a6-8fd2-d59ca49c483e', 2),
('5921ef88-3e6d-4535-a6ea-0b6fe0983527', '35f7435b-3a62-43a8-8d92-5e2292916821', 'c26ec572-78d2-46c1-b56e-edaa9246fca0', 0),
('5bddae26-e664-4be5-89ca-3c9ffdde73e1', '9a8bf778-ceeb-4a4c-b4c8-181f0ad075fd', 'bf78f23e-b7aa-4b8e-ae52-89b14fea6120', 0),
('6050336e-a77b-4f5d-af4c-706fa44bac14', '35f7435b-3a62-43a8-8d92-5e2292916821', 'de4aca44-1d16-4fb9-aee2-8f62fa00b4c3', 4),
('b0265802-54de-4b79-95cc-8dacfc4b63bc', '36b9e592-c9ca-44f1-ac61-88be647e40d0', '754e3c10-f123-493f-b9f1-bf4359824942', 0),
('b639375f-44b6-4ffa-a390-6202a527f4e8', '35f7435b-3a62-43a8-8d92-5e2292916821', '2edd8e42-f6a2-4e92-9b92-d3809201671d', 1),
('c5bd05bc-f303-40ba-bf8d-6c416b0c851e', '35f7435b-3a62-43a8-8d92-5e2292916821', '5a867db8-9e9f-4fb3-a972-3419a78b9148', 3),
('c7ef9b3b-f0b9-4174-a15b-b7c888192796', 'b3d10a77-9658-4e0d-b9f3-82dddd0fdc8c', '142eecb1-0771-4fd2-964b-be377e7af7fa', 0),
('dd113da8-8f3a-4a47-baee-0e54f6087475', '221def50-e968-45ea-bf07-b9aa5ac94b6e', '18869d36-d82c-4ffd-991d-f938f2866ffe', 0),
('df3bd5fa-68f0-458d-9b51-c4e9f01827b6', '19ba2c0b-1705-4616-8465-e31f430b0b51', '98d0e58b-9b8c-4d56-95ea-6feecd9e74b1', 0);
-- --------------------------------------------------------
--
-- Структура таблицы `EquipmentRelation`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "EquipmentRelation" CASCADE;
CREATE TABLE IF NOT EXISTS "EquipmentRelation" (
  "id" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "relatedId" TEXT NOT NULL
);
--
-- Дамп данных таблицы `EquipmentRelation`
--
INSERT INTO "EquipmentRelation" ("id", "equipmentId", "relatedId") VALUES
('b4899d32-465a-43bd-9d84-169fe62b80f5', 'ff9faa6b-edc3-4a81-9cc1-33b25281cb65', '141e0f0b-76fe-4c50-be3e-63ad79726d19'),
('134f89cb-5e1f-41f9-9704-194985a3a3f8', 'ff9faa6b-edc3-4a81-9cc1-33b25281cb65', '1dc04855-b238-418f-b5e8-5df012fd36f0'),
('2ed54093-94e6-4654-a073-fcede0151dd0', 'ff9faa6b-edc3-4a81-9cc1-33b25281cb65', '1e2ec39a-c751-4e37-9f69-d5c23d0db1dc'),
('05aedbac-a2a5-4ab8-8afb-42e539b64540', 'ff9faa6b-edc3-4a81-9cc1-33b25281cb65', '2852caac-5a98-47db-b266-f92a8d17800b'),
('489abe1c-78ec-44e7-9ac3-b2c39911e6c0', 'ff9faa6b-edc3-4a81-9cc1-33b25281cb65', '67051ad5-c332-4fe6-bdf5-31e71c9042d1'),
('1081ef46-6f2c-468f-8ca8-15782689c6ef', 'ff9faa6b-edc3-4a81-9cc1-33b25281cb65', 'a0c32101-082b-4a35-a129-da870b3fb151');
-- --------------------------------------------------------
--
-- Структура таблицы `EquipmentSet`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "EquipmentSet" CASCADE;
CREATE TABLE IF NOT EXISTS "EquipmentSet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "items" JSONB NOT NULL,
  "totalPricePerDay" INTEGER DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL
);
--
-- Дамп данных таблицы `EquipmentSet`
--
INSERT INTO "EquipmentSet" ("id", "userId", "name", "description", "items", "totalPricePerDay", "createdAt", "updatedAt") VALUES
('9d572656-d17b-40a6-a33b-692894ca22bd', 'db3ae213-c165-453e-bf62-d48f6198449c', 'тест', '', '[{"quantity": 1, "equipmentId": "1d9f48eb-49c9-4156-9602-567be3847d81"}]', 500, '2026-04-03 06:35:06.202', '2026-04-03 06:36:05.514');
-- --------------------------------------------------------
--
-- Структура таблицы `FaqItem`
--
-- Создание: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "FaqItem" CASCADE;
CREATE TABLE IF NOT EXISTS "FaqItem" (
  "id" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "category" TEXT DEFAULT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdBy" TEXT DEFAULT NULL,
  "updatedBy" TEXT DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL
);
-- --------------------------------------------------------
--
-- Структура таблицы `Favorite`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "Favorite" CASCADE;
CREATE TABLE IF NOT EXISTS "Favorite" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "equipmentId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--
-- Дамп данных таблицы `Favorite`
--
INSERT INTO "Favorite" ("id", "userId", "equipmentId", "createdAt") VALUES
('019047b4-870a-4f7f-95ea-6681784c8b68', 'db3ae213-c165-453e-bf62-d48f6198449c', 'e4a7cbcd-5a98-4d49-a7a3-e39b319317e2', '2026-04-18 12:43:52.385'),
('615a2557-42fd-4669-ad3b-bcf4a6ab9f48', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', '02590486-a46a-4ed7-96bd-865eedae4343', '2026-04-18 12:33:57.214'),
('96ed74ef-f4f4-4e7b-949c-f11fda89549b', 'db3ae213-c165-453e-bf62-d48f6198449c', '221def50-e968-45ea-bf07-b9aa5ac94b6e', '2026-04-17 11:26:49.538'),
('b6747a4a-b9ad-49a7-9920-b101aaa2d000', 'db3ae213-c165-453e-bf62-d48f6198449c', 'bd14a4c0-7e26-4de9-97f7-4e59c6954f7f', '2026-04-18 12:49:31.159'),
('b818c424-de2c-4983-9237-501108e3979d', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', '221def50-e968-45ea-bf07-b9aa5ac94b6e', '2026-04-17 11:28:58.767'),
('ea4d1f5b-30f1-41a0-848f-e508dbbfa372', 'db3ae213-c165-453e-bf62-d48f6198449c', 'bd949b60-3737-4b69-af1d-7f44c4735d37', '2026-04-18 12:56:01.881'),
('f46f607e-fd8f-44af-92b2-8ef535847113', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', '0101d0f5-67b3-45fd-8a12-90bf550f4503', '2026-04-18 12:33:58.431');
-- --------------------------------------------------------
--
-- Структура таблицы `Image`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "Image" CASCADE;
CREATE TABLE IF NOT EXISTS "Image" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "hash" TEXT DEFAULT NULL
);
--
-- Дамп данных таблицы `Image`
--
INSERT INTO "Image" ("id", "url", "hash") VALUES
('142eecb1-0771-4fd2-964b-be377e7af7fa', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/sigma-af-18-50mm-f28-krop-for-sony-e/3514fc69-fd06-4698-bad7-4f1cb6719e18.webp', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/sigma-af-18-50mm-f28-krop-for-sony-e/3514fc69-fd06-4698-bad7-4f1cb6719e18.webp'),
('18869d36-d82c-4ffd-991d-f938f2866ffe', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/stojka-manfrotto-052b-280mm-6/7e70a338-b707-4fa5-add9-1a7bd4533cfa.webp', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/stojka-manfrotto-052b-280mm-6/7e70a338-b707-4fa5-add9-1a7bd4533cfa.webp'),
('1b9c666e-4dbd-41a6-b943-d28e4d21ef88', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/oktoboks-zont-phottix-100/ee9f112a58892f284979b21778f4d9bee4eb2519679f1571844e45d7959fc4c7.webp', 'ee9f112a58892f284979b21778f4d9bee4eb2519679f1571844e45d7959fc4c7'),
('2061fdda-50fd-42ee-9558-5334153cb292', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/sony-a7-iii/061cba2bc567775291623e9a5af32122f55775072d0642f2c8af8996360de6cb.webp', '061cba2bc567775291623e9a5af32122f55775072d0642f2c8af8996360de6cb'),
('2a171bb8-2cac-4889-948a-c2a279a81e72', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/sony-a7-iii/b251a51c527ba856d942d366bfed3db1fafb475f03af2c1a62a2ca496b5b2a6b.webp', 'b251a51c527ba856d942d366bfed3db1fafb475f03af2c1a62a2ca496b5b2a6b'),
('2edd8e42-f6a2-4e92-9b92-d3809201671d', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/sony-a7-iv/0f7e6e4e-fc82-457e-85ae-c19849f0dae8.webp', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/sony-a7-iv/0f7e6e4e-fc82-457e-85ae-c19849f0dae8.webp'),
('30377dfc-da35-41b8-9a7d-5bcecfb5ae5b', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/parabolicheskij-softboks-godox-qr-p-90-sm-bystroskladnoj/1cc1723b834a65f18b8102bdf2757c59a0369c00ecaa', '1cc1723b834a65f18b8102bdf2757c59a0369c00ecaae96c64e8d53244c28417'),
('3f95a2a5-56f7-4f95-ad70-b9ca87235f91', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/stojka-zhuravl-manfrotto-420csu/56b594cf870aea83eae11e5781b17bdf1295db64e5f64085a7f9fe54900710e4.webp', '56b594cf870aea83eae11e5781b17bdf1295db64e5f64085a7f9fe54900710e4'),
('4d01b237-de72-4f90-a21e-1e5675b4f94f', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/radiosistema-ulanzi-u-mic-am18/47cbcc62d2fd6ee1bc5465f41fed90ddee54e41da5323cba8b808c9407d65863.webp', '47cbcc62d2fd6ee1bc5465f41fed90ddee54e41da5323cba8b808c9407d65863'),
('55e9fcf8-da22-4234-926b-57238bca70ae', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/insta360-x3/da32bd41800fb273d14a2856ac88af84a941bcc31eed52a45d3543451252ba0e.webp', 'da32bd41800fb273d14a2856ac88af84a941bcc31eed52a45d3543451252ba0e'),
('5889a932-3ff8-44c4-b431-b57448b4e1d3', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/gelevye-filtry/9a43d18a2aa8c7f0849c4ee4cd5612932a51cbfba7417d1f07cff7ddaa7ac617.png', '9a43d18a2aa8c7f0849c4ee4cd5612932a51cbfba7417d1f07cff7ddaa7ac617'),
('5a867db8-9e9f-4fb3-a972-3419a78b9148', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/sony-a7-iv/5bf288a9-4874-4b72-b048-1cd42452046c.webp', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/sony-a7-iv/5bf288a9-4874-4b72-b048-1cd42452046c.webp'),
('6b60a755-f5e0-49e1-a0ba-89d585abe0d9', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/fonar-ulanzi/72d049ee4c7a6583eab22138fe4e30886ffb8b0b8e7d9f884a2832611477245c.webp', '72d049ee4c7a6583eab22138fe4e30886ffb8b0b8e7d9f884a2832611477245c'),
('754e3c10-f123-493f-b9f1-bf4359824942', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/nikon-z6-ii/f168da3c-8488-4266-b63e-fa390102bdca.webp', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/nikon-z6-ii/f168da3c-8488-4266-b63e-fa390102bdca.webp'),
('974250fd-8b33-48db-bc21-2881d7906def', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/stojka-zhuravl-manfrotto-420csu/e43b540651eca981cbdb9e722010028a2be6a6a81d34b67c02b26b50915dbeff.webp', 'e43b540651eca981cbdb9e722010028a2be6a6a81d34b67c02b26b50915dbeff'),
('98d0e58b-9b8c-4d56-95ea-6feecd9e74b1', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/nikon-f75/a85fd533-55a7-4c44-adbc-7a0f479dd4a1.webp', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/nikon-f75/a85fd533-55a7-4c44-adbc-7a0f479dd4a1.webp'),
('99afb9c8-12d7-4788-bf2b-51419b862952', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/polyarizaczionnyj-filtr-77mm/69f22b1da40da70863c753882e546794bd24ba1b87bd21b861f5c364165172e6.webp', '69f22b1da40da70863c753882e546794bd24ba1b87bd21b861f5c364165172e6'),
('9d2b9594-c4e6-456f-b9bf-de3f587be84f', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/nikon-d780/39f34c657a397c9a89de63aceb6857e051c0d854a172b5cec690d984328f0499.png', '39f34c657a397c9a89de63aceb6857e051c0d854a172b5cec690d984328f0499'),
('9e3ea4e7-c670-4a8a-832c-029df1431e13', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/obektiv-canon-24-70-28-ii-l-bajonet-ef/92f574557f836431910321a0fa15f3bfe5f2f0239886a61d99f4b9fe1e9f6c', '92f574557f836431910321a0fa15f3bfe5f2f0239886a61d99f4b9fe1e9f6ca5'),
('a8ca2951-f8bc-42f8-bc48-15b54d8c9730', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/hensel-expert-pro-500/b69be343c695c9a5591973af60c120dfe04d63a9004b1382570aaeca5a7de5fe.png', 'b69be343c695c9a5591973af60c120dfe04d63a9004b1382570aaeca5a7de5fe'),
('bf78f23e-b7aa-4b8e-ae52-89b14fea6120', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/canon-eos-r-body/8e214df9-da95-48ef-b092-10e3245fd13f.webp', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/canon-eos-r-body/8e214df9-da95-48ef-b092-10e3245fd13f.webp'),
('c1558405-2675-4cb2-9be3-f91872ae43e5', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/sony-a7-iii/b03020c32a280b8a56be547c167e8d8b2c14d3b0854144c76b7492b2d4e356f3.webp', 'b03020c32a280b8a56be547c167e8d8b2c14d3b0854144c76b7492b2d4e356f3'),
('c26ec572-78d2-46c1-b56e-edaa9246fca0', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/sony-a7-iv/0480a193-64ad-40b5-8323-1f9851557e6b.webp', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/sony-a7-iv/0480a193-64ad-40b5-8323-1f9851557e6b.webp'),
('cc0eeb1c-7db1-4f39-83c8-1b53ac6a32d7', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/insta360-x5/6389f107419bcf986732e4560c479ddfb36091a9d5d8993dc06fbe732471f316.webp', '6389f107419bcf986732e4560c479ddfb36091a9d5d8993dc06fbe732471f316'),
('cc1cfda4-6492-4f8b-a899-48814053d6f2', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/obektiv-canon-24-70-28-ii-l-bajonet-ef/205db63c1acd796a0c633be2f87fde97ab7cdb560c2a10b1cc60a058ec4203', '205db63c1acd796a0c633be2f87fde97ab7cdb560c2a10b1cc60a058ec42030b'),
('cf293f63-14be-4603-a31e-db5997dba2c7', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/stojka-zhuravl-manfrotto-420csu/b4482f6568a420614fbf46c3333b2f7b252cbfce596de215e07fb23ec9a60b6d.webp', 'b4482f6568a420614fbf46c3333b2f7b252cbfce596de215e07fb23ec9a60b6d'),
('d44c781a-1a07-49e0-900c-2ccde1fc2157', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/insta360-x3/130af90c8300c9c5900e13000e4664859afcbb5810d61831c9698e1efd770163.webp', '130af90c8300c9c5900e13000e4664859afcbb5810d61831c9698e1efd770163'),
('de4aca44-1d16-4fb9-aee2-8f62fa00b4c3', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/sony-a7-iv/12e57570-85c8-4500-85c0-50725c38e5e1.webp', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/sony-a7-iv/12e57570-85c8-4500-85c0-50725c38e5e1.webp'),
('e04e6729-85f8-4e9e-bce1-efa780b6c47b', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/sony-a7-iii/d07e76f042dd129ae19efb9a3a4bda9f5d316c8da1597af91aee55273332601f.webp', 'd07e76f042dd129ae19efb9a3a4bda9f5d316c8da1597af91aee55273332601f'),
('e2c36cb8-f7ad-4cfd-bbb0-e7a511b48fb9', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/radiosistema-ulanzi-u-mic-am18/9adf729d99012f5838a40e1e9c7d804a75cf9930bd51c168e2926448a0913536.webp', '9adf729d99012f5838a40e1e9c7d804a75cf9930bd51c168e2926448a0913536'),
('ed0e776a-48ef-44a6-8fd2-d59ca49c483e', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/sony-a7-iv/c5681cc1-c3ba-434b-b5cc-666aacebb543.webp', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/equipment/sony-a7-iv/c5681cc1-c3ba-434b-b5cc-666aacebb543.webp'),
('f1851712-ed5a-4631-a81d-dc1d51c2db3b', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/sony-a7-iii/249d15a6eb87444e6db36c5fddad9a86153bc5adb79b4d9f5b2604726807f20b.webp', '249d15a6eb87444e6db36c5fddad9a86153bc5adb79b4d9f5b2604726807f20b'),
('f6d5fd1f-f712-45fc-8d5f-fa164ebb9104', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/perehodnye-kolcza-49-82/3e6281394d8e0669c8e86f03f941df8a4eb0f5b2a97d877f5463d4e9b16da9b2.webp', '3e6281394d8e0669c8e86f03f941df8a4eb0f5b2a97d877f5463d4e9b16da9b2'),
('f953d977-d45b-4245-b42d-9132e52a9301', 'https://xesbocpjxavyeobmuxca.supabase.co/storage/v1/object/public/equipment-images/images/stojka-zhuravl-manfrotto-420csu/216c19f28225e84111e5851fdbb6a7ac759fe0446c9ef9e59b318090c9f9d08e.webp', '216c19f28225e84111e5851fdbb6a7ac759fe0446c9ef9e59b318090c9f9d08e');
-- --------------------------------------------------------
--
-- Структура таблицы `InviteToken`
--
-- Создание: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "InviteToken" CASCADE;
CREATE TABLE IF NOT EXISTS "InviteToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt" TIMESTAMPTZ DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- --------------------------------------------------------
--
-- Структура таблицы `Session`
--
-- Создание: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "Session" CASCADE;
CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMPTZ NOT NULL
);
-- --------------------------------------------------------
--
-- Структура таблицы `SiteSetting`
--
-- Создание: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "SiteSetting" CASCADE;
CREATE TABLE IF NOT EXISTS "SiteSetting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);
-- --------------------------------------------------------
--
-- Структура таблицы `Subcategory`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "Subcategory" CASCADE;
CREATE TABLE IF NOT EXISTS "Subcategory" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "adminNotes" TEXT DEFAULT NULL,
  "imageUrl" TEXT DEFAULT NULL
);
--
-- Дамп данных таблицы `Subcategory`
--
INSERT INTO "Subcategory" ("id", "categoryId", "name", "slug", "sortOrder", "adminNotes", "imageUrl") VALUES
('01c1d230-5aab-4e45-8c2e-3be9036117e9', '36186632-cb84-46f2-b98c-7110e2ed5b16', 'Вспышки', 'вспышки', 2, NULL, NULL),
('01e05ea6-a04d-4f3f-bafc-958500b82bb3', '36186632-cb84-46f2-b98c-7110e2ed5b16', 'Журавли', 'zhuravli', 8, NULL, NULL),
('03be2f03-24bb-491c-ad34-bfb07a6f8079', 'eea82e65-767e-4832-9809-3032e816a9eb', 'Светофильтры', 'svetofiltry', 4, NULL, NULL),
('07e624c5-d2b1-4f43-a34c-3bf0e7392273', 'be1782c3-b0f4-4df6-9984-6c1babc64595', 'Аксессуары для света', 'аксессуары-для-света', 1, NULL, NULL),
('09e37cd8-815e-4467-981e-a83f5c522613', '85f96900-25c9-48e6-9dce-9d34c0681232', 'Общее', 'общее', 3, NULL, NULL),
('0a154844-22cb-43a7-b145-4173637a3037', 'dc761cba-1e4b-4aaa-9435-5749a2afed31', 'Карты памяти', 'карты-памяти', 6, NULL, NULL),
('0f196350-24f0-483e-a7a8-17bcc017f0b0', '00abe910-a81b-420b-85dd-13cee1fe90ae', 'Стойки', 'стойки', 1, NULL, NULL),
('0fb5b322-3a92-4f87-9e48-a612a8a3d29c', 'dc761cba-1e4b-4aaa-9435-5749a2afed31', 'Крепежи', 'крепежи', 7, NULL, NULL),
('1351fd26-8837-4255-9939-d016c62a780c', 'dc761cba-1e4b-4aaa-9435-5749a2afed31', 'Зарядки', 'зарядки', 3, NULL, NULL),
('1937fcea-467d-4cb8-b0c5-5b7930bc9a99', 'dc761cba-1e4b-4aaa-9435-5749a2afed31', 'Оптические аксессуары', 'оптические-аксессуары-1', 10, NULL, NULL),
('1ec6e1f4-2cca-4323-8411-77bdffc81e8d', '00abe910-a81b-420b-85dd-13cee1fe90ae', 'Фоны', 'фоны-1', 2, NULL, NULL),
('26ee16d5-927b-4c53-b223-d17752cc8805', 'eea82e65-767e-4832-9809-3032e816a9eb', 'Sony', 'sony', 7, NULL, NULL),
('27909c1c-a781-477c-a420-583fe8465baf', '36186632-cb84-46f2-b98c-7110e2ed5b16', 'Модификаторы света', 'модификаторы-света-1', 4, NULL, NULL),
('3148dc98-4cb7-4eb1-a6ff-aa6948c589d8', '1aed3cf4-e394-4e24-9557-89c1d840eb69', 'Электроника', 'электроника', 1, NULL, NULL),
('3160c40b-81be-40b1-b6a3-ff122b308f33', '8a37f010-db5f-41b1-a396-bedc69079104', 'Крепежи', 'крепежи-1', 4, NULL, NULL),
('31d3c951-036d-42a9-9f75-4786aa7f65ef', '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'Nikon', 'nikon-1', 1, NULL, NULL),
('34dc74c5-4710-4d6c-af2a-fda28b664812', '38a87130-eea3-4a01-8f39-7fcd77924758', 'Общее', 'общее-4', 3, NULL, NULL),
('38af0cb5-7bf9-4023-983f-ae73000e0850', '00abe910-a81b-420b-85dd-13cee1fe90ae', 'Штативы', 'штативы-1', 3, NULL, NULL),
('38c9fec0-ed18-4a12-8385-ee14a84d2840', 'dc761cba-1e4b-4aaa-9435-5749a2afed31', 'Штативы', 'штативы', 11, NULL, NULL),
('418a5dd1-ddb4-4f6b-bd75-475e8d283c5b', '38a87130-eea3-4a01-8f39-7fcd77924758', 'Вспышки', 'вспышки-1', 1, NULL, NULL),
('41960654-d394-4f68-b48f-6fed7f6f3fc1', '8a37f010-db5f-41b1-a396-bedc69079104', 'Фоны', 'фоны', 9, NULL, NULL),
('45986e26-580e-44ae-b8bb-7f3efeac8651', '85f96900-25c9-48e6-9dce-9d34c0681232', 'Оптические аксессуары', 'оптические-аксессуары', 4, NULL, NULL),
('45e763b5-07b1-4561-bddc-a128ec7e2307', '8a37f010-db5f-41b1-a396-bedc69079104', 'Камеры', 'камеры-2', 2, NULL, NULL),
('46b4ed09-c3ff-44ed-be1a-bf30a0c653e4', '9f52f9e3-49a8-4766-a82f-a344b83b68ca', 'Адаптеры', 'adaptery', 1, NULL, NULL),
('4a65ee06-4e64-4181-af94-0ee57ecf907e', '8a37f010-db5f-41b1-a396-bedc69079104', 'Оптические аксессуары', 'оптические-аксессуары-2', 7, NULL, NULL),
('521c348b-ec82-4132-8751-5d5e6f188e98', '85f96900-25c9-48e6-9dce-9d34c0681232', 'Аудиокабели', 'аудиокабели', 1, NULL, NULL),
('5846c4a1-cfed-49d7-9f00-fd539c5f82f9', '3e5f74c6-a021-4395-bd8d-c98cf13e4dbb', 'Общее', 'общее-6', 1, NULL, NULL),
('5b8299af-aea7-405d-9195-e3748e257930', 'dc761cba-1e4b-4aaa-9435-5749a2afed31', 'Модификаторы света', 'модификаторы-света', 8, NULL, NULL),
('6603de92-9304-4431-b1a4-54d76ce063b5', '7058f698-8db0-4bcb-92f3-cc2ae32d127b', 'Услуги', 'услуги', 1, NULL, NULL),
('6a715990-413c-47ae-9c95-3e59e635ad85', 'eea82e65-767e-4832-9809-3032e816a9eb', 'Canon', 'canon', 5, NULL, NULL),
('6c12db9c-68fb-4694-92cc-4e3724bfe8b5', 'd7aabe3d-b739-44b3-94e4-804f7904d548', 'Общее', 'общее-1', 1, NULL, NULL),
('71579c5c-f5aa-469f-b9d9-a83dab715c98', 'c92c4d91-dd94-410e-b071-0e5eacb1244a', 'Вспышки', 'вспышки-2', 1, NULL, NULL),
('782c15ff-3437-4eb8-aa35-d209a5c56f78', 'dc761cba-1e4b-4aaa-9435-5749a2afed31', 'Адаптеры', 'адаптеры', 1, NULL, NULL),
('93a11a98-d8f9-4160-ae84-0c80d784799b', 'dc761cba-1e4b-4aaa-9435-5749a2afed31', 'Камеры', 'камеры', 5, NULL, NULL),
('9efb339e-c09a-45e1-8056-081e645680f3', '36186632-cb84-46f2-b98c-7110e2ed5b16', 'Синхронизаторы', 'синхронизаторы', 7, NULL, NULL),
('a694b2e9-c251-4dc1-a1cc-2e0a25263bd8', '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'Sony', 'sony-1', 3, NULL, NULL),
('abfc7365-ee2c-424b-bdbe-d8888415c11a', '367d21ef-fb13-40b9-ada3-f57e176b5b52', 'Штативы', 'shtativy', 2, NULL, NULL),
('b0591630-9bf7-42e7-8c47-aa31a85a4508', 'be1782c3-b0f4-4df6-9984-6c1babc64595', 'Модификаторы света', 'модификаторы-света-2', 2, NULL, NULL),
('bc2da058-c5f0-4b20-af1c-2d94f9b15f73', 'be1782c3-b0f4-4df6-9984-6c1babc64595', 'Общее', 'общее-3', 3, NULL, NULL),
('bdd89762-fca6-48cf-ba71-e8ec223fce2b', '3e5f74c6-a021-4395-bd8d-c98cf13e4dbb', 'Штативы', 'штативы-2', 2, NULL, NULL),
('be960e72-6e57-49fd-bef9-1b21144e8c4f', 'd7aabe3d-b739-44b3-94e4-804f7904d548', 'Постоянный свет', 'постоянный-свет', 2, NULL, NULL),
('cc1ffff9-ce9c-422a-a548-766582f2249a', '36186632-cb84-46f2-b98c-7110e2ed5b16', 'Кабели', 'кабели-1', 3, NULL, NULL),
('cc94a3a3-56ef-448c-95f2-456d81263afb', '38a87130-eea3-4a01-8f39-7fcd77924758', 'Камеры', 'камеры-1', 2, NULL, NULL),
('ce3e2114-1747-47c3-b4bd-56b2be6117f4', '8a37f010-db5f-41b1-a396-bedc69079104', 'Дроны', 'дроны', 1, NULL, NULL),
('d12c2a08-cdea-45b0-9659-41543ed67a9a', '8a37f010-db5f-41b1-a396-bedc69079104', 'Машины дыма', 'машины-дыма', 5, NULL, NULL),
('d472c68c-8c7c-401b-9cca-23c8f9761462', 'eea82e65-767e-4832-9809-3032e816a9eb', 'Nikon', 'nikon', 6, NULL, NULL),
('d52fab08-fc51-42a5-9eda-20432ef5d49c', '36186632-cb84-46f2-b98c-7110e2ed5b16', 'Журавли / Стойки', 'zhuravli-stojki', 9, NULL, NULL),
('d5c8de84-0ca0-416b-9bf6-09fe5f14dda7', '36186632-cb84-46f2-b98c-7110e2ed5b16', 'Импульсный свет', 'impulsnyj-svet', 1, NULL, NULL),
('d989dfa9-6e2b-45b0-9dc0-4bb1f3e72b8a', 'dc761cba-1e4b-4aaa-9435-5749a2afed31', 'Аккумуляторы', 'аккумуляторы', 2, NULL, NULL),
('da3a69b4-deb6-4bdf-b55d-7879433016bc', '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'Action', 'action', 4, NULL, NULL),
('e10565bd-2004-4448-8c97-7f4c9b24741d', 'dc761cba-1e4b-4aaa-9435-5749a2afed31', 'Общее', 'общее-2', 9, NULL, NULL),
('e182b449-b4c6-4713-a568-3f7f4eae4094', 'd99b02ca-b401-4aa8-885c-f10f588aad79', 'Журавли', 'журавли', 1, NULL, NULL),
('e18c2419-095f-40fc-a043-e2420cb43420', '8a37f010-db5f-41b1-a396-bedc69079104', 'Реквизит', 'реквизит', 8, NULL, NULL),
('e5752121-fef3-49f2-b29b-da8fc97ac613', '8a37f010-db5f-41b1-a396-bedc69079104', 'Карты памяти', 'карты-памяти-1', 3, NULL, NULL),
('e69a50e6-352b-49dd-aa0f-1ddf2cf0f74a', 'dc761cba-1e4b-4aaa-9435-5749a2afed31', 'Кабели', 'кабели', 4, NULL, NULL),
('e9ef0452-9efb-43c7-b9d3-2a613d13d93e', '367d21ef-fb13-40b9-ada3-f57e176b5b52', 'Стабилизаторы', 'стабилизаторы', 1, NULL, NULL),
('ed3a6f43-891d-4180-ac4e-5b7004190f43', '18f91ba0-1ea3-46ba-8699-3eafd3547190', 'Canon', 'canon-1', 2, NULL, NULL),
('f201fbac-7c27-4385-9122-0565961f6943', '8a37f010-db5f-41b1-a396-bedc69079104', 'Электроника', 'электроника-1', 10, NULL, NULL),
('f8196d71-c99e-4bc2-a902-6cdaaf1352de', '8a37f010-db5f-41b1-a396-bedc69079104', 'Общее', 'общее-5', 6, NULL, NULL),
('fa93058e-0c39-479a-8782-f175d62aa148', '36186632-cb84-46f2-b98c-7110e2ed5b16', 'Постоянный свет', 'постоянный-свет-1', 6, NULL, NULL),
('fef135f8-8186-4192-b697-22c165b4e838', '85f96900-25c9-48e6-9dce-9d34c0681232', 'Микрофоны', 'микрофоны', 2, NULL, NULL);
-- --------------------------------------------------------
--
-- Структура таблицы `User`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "User" CASCADE;
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "name" TEXT DEFAULT NULL,
  "email" TEXT DEFAULT NULL,
  "emailVerified" TIMESTAMPTZ DEFAULT NULL,
  "image" TEXT DEFAULT NULL,
  "password" TEXT DEFAULT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "entityType" "EntityType" DEFAULT 'INDIVIDUAL',
  "companyName" TEXT DEFAULT NULL,
  "tin" TEXT DEFAULT NULL,
  "isVerified" BOOLEAN DEFAULT FALSE,
  "phone" TEXT DEFAULT NULL,
  "extraPhone" TEXT DEFAULT NULL,
  "registrationStep" INTEGER NOT NULL DEFAULT 1,
  "nickname" TEXT DEFAULT NULL,
  "isBlocked" BOOLEAN NOT NULL DEFAULT FALSE,
  "blockedReason" TEXT,
  "permissions" JSONB NOT NULL,
  "deletionScheduledAt" TIMESTAMPTZ DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "adminCreatedNote" TEXT,
  "isAdminCreated" BOOLEAN NOT NULL DEFAULT FALSE,
  "mergedIntoId" TEXT DEFAULT NULL
);
--
-- Дамп данных таблицы `User`
--
INSERT INTO "User" ("id", "name", "email", "emailVerified", "image", "password", "role", "entityType", "companyName", "tin", "isVerified", "phone", "extraPhone", "registrationStep", "nickname", "isBlocked", "blockedReason", "permissions", "deletionScheduledAt", "createdAt", "balance", "adminCreatedNote", "isAdminCreated", "mergedIntoId") VALUES
('3f1ab5b9-bc03-4840-bbe4-2daeedf8f8bf', NULL, 'kilkun@mail.ru', '2026-03-24 12:13:54.711', NULL, NULL, 'USER'::"Role", 'INDIVIDUAL'::"EntityType", NULL, NULL, FALSE, NULL, NULL, 1, NULL, FALSE, NULL, '{}', NULL, '2026-03-23 11:42:45.518', 0, NULL, FALSE, NULL),
('5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', '', 'kilkun@icloud.com', '2026-03-23 11:43:49.222', 'https://aeb737f5febe-linza-storage.s3.ru1.storage.beget.cloud/avatars/73e0f03d-b3ce-456e-ab84-aa5fc13b584c.webp', NULL, 'USER'::"Role", 'INDIVIDUAL'::"EntityType", NULL, NULL, FALSE, NULL, NULL, 1, NULL, FALSE, NULL, '{}', NULL, '2026-03-23 11:43:49.229', 0, NULL, FALSE, NULL),
('db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'linzarental@yandex.ru', NULL, 'https://avatars.yandex.net/get-yapic/17910871/FSpbMWfna0kSBbC6qlj6QwGxA-1/islands-200', NULL, 'ADMIN'::"Role", 'INDIVIDUAL'::"EntityType", NULL, NULL, FALSE, NULL, NULL, 1, NULL, FALSE, NULL, '{}', NULL, '2026-03-26 08:37:01.714', 67900, NULL, FALSE, NULL),
('e3b42108-8e30-4bbe-bc2a-963f3636134a', 'Roma Bubnov', 'roman.bubnov.1989@gmail.com', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocJ5T3HEK3wZEdQAugCfv6HxMMXuQRwbmh6i0pUlr_p3gwtYPh9h=s96-c', NULL, 'USER'::"Role", 'INDIVIDUAL'::"EntityType", NULL, NULL, FALSE, NULL, 'kilkun@icloud.com', 1, 'Супер-Пупер-Мега-Чел', FALSE, NULL, '{}', NULL, '2026-03-25 04:53:13.575', 0, NULL, FALSE, NULL),
('f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'Александр Ненашев', 'volnd@yandex.ru', NULL, 'https://avatars.yandex.net/get-yapic/31078/enc-fc584695632f8f2f0da70f53375b3646c42f3e12a3c68f869868cd890639d18f/islands-200', NULL, 'ADMIN'::"Role", 'INDIVIDUAL'::"EntityType", NULL, NULL, FALSE, NULL, NULL, 1, NULL, FALSE, NULL, '{}', NULL, '2026-03-31 16:03:14.664', 0, NULL, FALSE, NULL);
-- --------------------------------------------------------
--
-- Структура таблицы `UserAdminNote`
--
-- Создание: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "UserAdminNote" CASCADE;
CREATE TABLE IF NOT EXISTS "UserAdminNote" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "authorId" TEXT DEFAULT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- --------------------------------------------------------
--
-- Структура таблицы `UserAuditLog`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "UserAuditLog" CASCADE;
CREATE TABLE IF NOT EXISTS "UserAuditLog" (
  "id" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "authorId" TEXT DEFAULT NULL,
  "authorName" TEXT DEFAULT NULL,
  "action" TEXT NOT NULL,
  "fieldName" TEXT DEFAULT NULL,
  "valueBefore" TEXT,
  "valueAfter" TEXT,
  "meta" JSONB DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--
-- Дамп данных таблицы `UserAuditLog`
--
INSERT INTO "UserAuditLog" ("id", "targetUserId", "authorId", "authorName", "action", "fieldName", "valueBefore", "valueAfter", "meta", "createdAt") VALUES
('012e8cea-bdfa-4025-b88a-92b28df04ae1', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '0 %', '{}', '2026-04-13 08:07:29.446'),
('0144b951-b188-4458-9dd0-5ea192c498cd', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:42:30.047'),
('01a738af-fd26-431a-b3e5-0fcaf20db682', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.socials', '', 'Соцсети: @test_user, http://localhost:3000/admin/users', '{}', '2026-04-11 01:49:42.475'),
('02e159bd-20d3-465e-af78-7d11a6fb634c', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:52:32.976'),
('04a5e398-70f2-44a1-b702-a561f636d6c2', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удалена метка', 'labels', 'самая красивая метка', '', '{}', '2026-04-18 15:36:16.437'),
('05fb3bcc-c498-4b0e-88a2-808d43bd720b', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: ', '{}', '2026-04-12 13:11:29.520'),
('07628987-8dd2-40e7-ad5f-31449619c6e1', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:42:03.288'),
('08eeba53-7239-4a26-a248-2634299c81b6', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:05:24.915'),
('08fbaca2-55e8-4c46-8bdd-d3440363ba74', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлен комментарий', NULL, NULL, 'вот тут будут всякие комментарии', '{}', '2026-04-10 11:39:44.577'),
('0b5df2a7-038d-4f61-905e-df036cbca9a8', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: тест новой метки, например эта метка для очень прилежных клиентов, а это метка для клиентов с которыми нужно быть осторожнее, для лучших', '{}', '2026-04-10 11:38:05.171'),
('0bae5726-e3b7-42e3-8ffb-4b618c2b4e7f', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-10 13:45:21.537'),
('0c7b1cdb-e2e3-4d1b-afb5-9445089af4b8', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:39:04.704'),
('0e5d5cee-beed-46a2-af2f-db22e75f93f5', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.socials', '', 'Соцсети: @test_user', '{}', '2026-04-13 14:19:12.153'),
('0fd9ff1e-0c3e-44ca-b666-d04812d501cd', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.socials', '', 'Соцсети: @test_user, http://localhost:3000/admin/users, https://www.youtube.com/', '{}', '2026-04-11 01:47:00.765'),
('10211f77-2055-4473-a692-0f1af5a404a1', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.socials', '', 'Соцсети: @kilkun, №вдвдвдвдв\\', '{}', '2026-04-13 14:10:01.350'),
('123be6e3-ac68-4306-93eb-ee5afcc3c5b8', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.registrationAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия', '{}', '2026-04-13 10:48:48.975'),
('13f0d206-ac8a-4b6e-b210-d0272062af39', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 05:15:58.640'),
('14dd1956-a2a7-4888-9e52-1ef1a5be5fec', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удален комментарий', NULL, 'ну да, ничо такой', NULL, '{}', '2026-04-14 07:29:44.990'),
('14de6e76-f004-4156-8bba-b8249c0ead3e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '20 %', '{}', '2026-04-13 09:51:22.667'),
('15873db0-7a4c-450a-a62f-ef292a2c1d35', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-09 19:23:56.164'),
('15b8ead2-dd1a-4534-87ba-6a448aa8f1af', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'firstName', '', 'Роман', '{}', '2026-04-13 12:17:37.718'),
('15f868c0-a2d8-454e-bbcd-a51a82e623c7', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удалена метка', 'labels', 'пустая метка', '', '{}', '2026-04-18 15:36:11.006'),
('168308f1-dae5-43ce-9a1c-0f8ff99b9cec', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:31:52.436'),
('1749baf0-48bb-4253-a557-7469d67911c7', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: тест новой метки, например эта метка для очень прилежных клиентов, а это метка для клиентов с которыми нужно быть осторожнее', '{}', '2026-04-10 11:37:55.205'),
('185cc7a3-774e-448a-9216-668e8a352cf9', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-10 07:21:14.765'),
('18d7418d-c042-4323-9ce8-0f4d828abc3e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:42:58.668'),
('1a2ad668-7179-4c51-b466-76af386e776f', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:08:41.616'),
('1ab28407-8659-4ef7-8841-160cf0d9ecbb', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:19:40.011'),
('1e4d493b-91be-45fe-8dce-d01dbf2dd899', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 05:42:32.604'),
('1f7d331b-09c4-4bc7-af70-fe9214636b33', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:28:48.446'),
('214823e0-d6d6-4c0a-9f3e-1479fcd5412e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Романович', '{}', '2026-04-10 14:40:43.258'),
('22369549-a060-45a9-9e23-b8839cd8a568', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:39:22.681'),
('22bad289-02cc-4847-b3a8-1242bd42aeaa', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:39:15.427'),
('24b7c390-5470-4854-8727-b963642f17f9', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-10 05:15:13.544'),
('265e267e-c977-47b6-8813-392b4daf7a65', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: для лучших, для интересненьких, ну и просто метка', '{}', '2026-04-10 14:38:10.640'),
('2837ef2a-f9a2-4842-9397-c246b8d6b1d4', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:14:38.022'),
('2893b9d1-e681-4f02-a7f1-ef97a00adf5d', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'passport.registrationAddress', 'г Новосибирск, ул Кирова, д 30', '', '{}', '2026-04-18 15:35:44.693'),
('28c6de16-24c8-4f05-9db3-eb07d3a338fc', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Linza', '{}', '2026-04-11 13:10:36.298'),
('29384314-ac97-457d-8e91-05f2ea0ca544', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:07:13.900'),
('2a7f3ac9-88f0-4bb1-9cb1-ec4e333abcc1', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedAt', '', '21.06.1989', '{}', '2026-04-13 11:32:11.137'),
('2b1a8c29-3df5-4a85-b760-a8ae782d7851', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:09:06.412'),
('2d749a4e-65da-4613-9865-0f953e84a092', '3f1ab5b9-bc03-4840-bbe4-2daeedf8f8bf', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "b7a6cdf9-ef7d-4ffc-9aa0-67ecf5b307c5"}', '2026-04-10 07:29:26.954'),
('2f3f88f9-eecc-41ba-80e2-bc3450797f0e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'birthDate', '', '21.05.1779', '{}', '2026-04-11 03:35:36.449'),
('2f524fad-64dc-4989-acb9-b12add5511a2', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.socials', '', 'Соцсети: ', '{}', '2026-04-13 11:01:01.188'),
('2fae9ce2-2427-47a4-89ec-e7f46d89b1fd', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 05:40:04.336'),
('3005aeae-1cb2-490e-822a-27ad6a6c01f3', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'address.residentialAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия', '{}', '2026-04-13 10:46:47.766'),
('31e965ca-e0d1-4bf9-a65c-fe4ad3622851', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedBy', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-13 10:51:36.147'),
('31f43463-0c77-4e18-b546-961919a5b352', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Иван', '{}', '2026-04-10 13:38:41.111'),
('31f72fb5-37ec-450d-b6ec-ce26aeb0ec0f', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.email', '', 'roman.bubnov.1989@gmail.com', '{}', '2026-04-13 12:17:15.536'),
('33361d32-8748-4306-889e-350c75deb6d0', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удален комментарий', NULL, 'ахахахах', NULL, '{}', '2026-04-13 10:30:56.950'),
('3429356c-77ca-479f-b98b-7ecff79f19fd', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:39:52.248'),
('346c3482-daf7-417a-958a-7b00da891f16', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:25:54.730'),
('34f675e4-0760-479f-9931-08e2c824c98c', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 05:40:04.933'),
('35682b5e-a6f9-4a4a-be20-819c94600c52', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлен комментарий', NULL, NULL, 'Это классный клиент, правда ведь ?', '{}', '2026-04-13 14:29:35.186'),
('36429670-2d3e-4f39-b258-c096b5b9f9b5', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 05:13:00.124'),
('37cb352b-e444-4071-8956-1ecf41e13534', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "80c5c62b-0a1a-410e-9d0a-1faa87a58372"}', '2026-04-10 07:55:13.628'),
('39429c9e-3c2e-424f-83cc-fba2382663c0', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Изменение меток', 'labels', 'красная метка, пустая метка, серенькая, самая красивая метка', 'красная метка, пустая метка, серенькая, самая красивая метка', '{}', '2026-04-18 15:36:07.566'),
('3b9c1ce2-33c4-45f4-b1e8-1228b64496d8', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлена метка', 'labels', '', 'серенькая', '{}', '2026-04-18 15:33:11.678'),
('3bacb70c-5036-4304-a035-ca06473d1d47', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-10 07:10:32.604'),
('3da96e3f-563a-4f6a-a4ef-cb5fae3bf9ff', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-10 13:46:10.552'),
('3e12b435-c94f-481a-b6d7-e18d80f76c54', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлен комментарий', NULL, NULL, 'вввввв', '{}', '2026-04-10 14:48:43.107'),
('3ea228f5-2f4e-4bea-bca1-e40ec50a0d15', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:31:44.414'),
('3ee9eaf1-db2a-4102-a21b-b3e949c1fc74', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'firstName', '', 'Иван', '{}', '2026-04-11 09:48:28.059'),
('3efed5a9-dbfa-4cf7-a4c0-8ef0a6458e66', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.registrationAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия', '{}', '2026-04-13 11:32:46.549'),
('3f09d8ac-cfe2-4b60-b7cc-265d1d1165d1', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '0 ₽', '{}', '2026-04-10 19:28:18.809'),
('3fca39aa-46ec-4ece-a5f7-b2de7e398725', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Алексндрович', '{}', '2026-04-13 12:21:37.185'),
('403c18b4-b424-4263-b75c-727586d718df', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'address.residentialAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия', '{}', '2026-04-13 11:32:25.113'),
('43782c5a-f474-4a0d-9c98-2855df922bad', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-09 19:23:40.811'),
('453f02db-3bba-47d2-bb4c-5efa7609dcdf', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:12:03.959'),
('48f7999f-77d4-4871-9740-6d70ff2949d2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "827595d9-903f-49b9-b0bb-b26fb6231689"}', '2026-04-10 07:29:47.619'),
('49251baa-0d07-469c-bf38-0b9c341c51fd', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:31:53.059'),
('493904d3-14b6-4560-ae04-dfda987c1ef6', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'firstName', 'Иванович', '', '{}', '2026-04-18 15:35:26.693'),
('49e75e6b-39ab-4648-a447-be5aae9978ff', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.extraPhone', '', '+8888888888', '{}', '2026-04-11 09:49:34.407'),
('4b416938-ae1e-4140-9508-d020b9079def', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-10 13:41:47.377'),
('4b8dce53-b639-4067-9fa3-59f98f5769a4', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedBy', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-13 10:45:18.526'),
('4ba327ee-fc26-4fc7-934c-267efa9a1312', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'address.registrationAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия', '{}', '2026-04-13 10:26:23.052'),
('4d261b74-f907-478e-aa8b-7f670c73e678', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedBy', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-13 10:27:16.789'),
('4dd3b6fb-4058-463a-91ed-b35fe9a34e46', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:37:03.455'),
('4f3737f8-8e47-4c9d-94eb-cbc5bf33f7be', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:31:44.963'),
('4fbb03b1-aac1-4c55-8f3a-c151477e7d88', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedBy', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-11 09:49:25.442'),
('4fc07248-2306-4937-8437-752ab252afc6', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:44:44.764'),
('4fc078f8-f4e6-400c-b2be-dfbacdf29cab', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:44:46.476'),
('502806e1-c56e-4655-914e-bda219052146', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлена метка', 'labels', '', 'самая красивая метка', '{}', '2026-04-18 15:33:32.355'),
('50a2592b-5df0-4273-9c82-50d8d4c1feba', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:39:22.179'),
('51128094-9b69-48e8-8a0a-579ef5aadc7b', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'address.residentialAddress', 'г Новосибирск, ул Кирова, д 30', '', '{}', '2026-04-18 15:35:47.347'),
('51dd65e3-5bc7-4129-84f5-df413a2732f2', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:07:29.435'),
('54638c35-358d-49cd-a598-42eca61435c1', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удалена метка', 'labels', 'серенькая', '', '{}', '2026-04-18 15:36:12.731'),
('54914668-b210-416e-9172-7152fbdd8b49', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'passport.issuedBy', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-18 15:35:41.914'),
('5606ba9f-45e2-4e15-8ddc-c55ffaf95c90', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:42:17.885'),
('57e85e47-c61c-4574-83c9-58c8c7d949c9', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:09:07.084'),
('585685fa-09dd-4edd-bb7a-79dd16d6c663', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '20 %', '{}', '2026-04-10 13:11:40.183'),
('58f0b671-39e7-41b9-9fdb-947f5eead83a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.seriesAndNumber', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-11 13:11:01.339'),
('59689561-51fd-42bc-8549-35e43912f7e6', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'address.residentialAddress', '', 'Ленинградская обл, ', '{}', '2026-04-13 10:52:53.765'),
('59a1dd07-2c99-46d6-ab89-fe9d416b14d6', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.socials', '', 'Соцсети: @kilkun', '{}', '2026-04-11 14:27:37.046'),
('5ac06013-c7e1-4301-9792-0263b0dbfa09', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:43:13.248'),
('5b24c2cb-5a19-478e-a3fc-4f7e0272f1e3', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-10 13:49:11.791'),
('5c0bd6b0-d260-4a34-a39a-23ef4547ae7c', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Иванович', '{}', '2026-04-10 13:48:38.488'),
('5c30832f-284c-4027-a334-bfba61b1ac50', '3f1ab5b9-bc03-4840-bbe4-2daeedf8f8bf', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "b7a6cdf9-ef7d-4ffc-9aa0-67ecf5b307c5"}', '2026-04-10 07:29:27.517'),
('5cc4a1b0-6050-4a17-aeb0-5d0c543a965d', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'address.registrationAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия', '{}', '2026-04-13 10:28:16.189'),
('5cd5cd83-764b-49d6-b2bb-63b48fbe0aea', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'birthDate', '', '21.06.1989', '{}', '2026-04-12 19:05:14.705'),
('5e06089d-f4a6-4fa5-85f1-d7a5247255d6', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:42:02.493'),
('5e4f2a6e-b12d-411e-a816-4bac21f91e88', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedBy', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-11 13:10:56.401'),
('5f2247cf-71f9-4999-a4e9-64d3e38f85e2', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удалена метка', 'labels', 'тестовая метка', '', '{}', '2026-04-18 15:36:06.714'),
('608eaec6-9dcf-4c85-a1d3-f11ba27521ef', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "80c5c62b-0a1a-410e-9d0a-1faa87a58372"}', '2026-04-10 07:29:09.139'),
('60976e8e-1127-4b63-9a47-05a304e244fc', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:43:12.796'),
('6117ecc8-37ce-40ea-bc16-57d37fa438bb', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'birthDate', '', '21.01.1991', '{}', '2026-04-11 09:48:35.651'),
('611bb8f9-114e-4e70-9d16-aa5d9439145a', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'lastName', '', 'Иванов', '{}', '2026-04-11 09:48:24.877'),
('6170fff1-ed7c-4c02-bbc7-d72a9a81ae9b', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'lastName', '', 'Бубнов', '{}', '2026-04-13 10:23:38.430'),
('617cbc58-449e-4b6a-8922-edd77a3dccd1', '3f1ab5b9-bc03-4840-bbe4-2daeedf8f8bf', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "b7a6cdf9-ef7d-4ffc-9aa0-67ecf5b307c5"}', '2026-04-10 07:37:58.405'),
('61d19789-ac14-4432-a1cc-b9f9abbc1d8e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:37:03.846'),
('62ada155-60b7-40da-9ec7-42c19fe44928', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'address.registrationAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия', '{}', '2026-04-13 10:46:54.122'),
('62ef9567-ac92-4343-98f8-e10f5fba3542', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'firstName', 'Иван', 'Роман', '{}', '2026-04-18 15:04:07.822'),
('63f9c3e1-8e77-4c3f-88e7-346971debc36', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.phone', '', '+7(777)777-77-75', '{}', '2026-04-10 14:37:48.313'),
('63fad8c2-0825-4639-8f27-3c04ddb7d2d4', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '0 %', '{}', '2026-04-10 20:02:18.149'),
('64b22f6b-6474-4012-bb03-fc936d013dd3', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '10 %', '{}', '2026-04-10 13:11:25.994'),
('64e7ba17-49e8-4a3c-b321-db5969e03478', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлен комментарий', NULL, NULL, 'ахахахах', '{}', '2026-04-11 09:54:05.779'),
('66540956-84aa-483d-835c-58171dae799e', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "827595d9-903f-49b9-b0bb-b26fb6231689"}', '2026-04-09 19:24:01.034'),
('675b7a91-1458-422a-b538-e60d0da58c6f', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.socials', '', 'Соцсети: @kilkun, fjffjfjfjf', '{}', '2026-04-12 15:22:40.444'),
('67b78e24-d614-4b25-bbcf-8b95cc01a798', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Александрович', '{}', '2026-04-11 03:35:20.542'),
('69f4af03-fb2f-43f5-90b5-6590b71b916e', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-09 19:23:13.279'),
('6a821f95-de55-49e9-abfd-0f8bb2b0770a', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:28:47.820'),
('6adb4365-4edd-474e-b19b-4a1519efc7d7', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:39:16.097'),
('6ae36c81-cbda-480f-bdea-2fd34779efdc', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Романович', '{}', '2026-04-13 12:17:04.436'),
('6d78bcc7-bf6b-4fae-9e53-77e0a0da8849', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "80c5c62b-0a1a-410e-9d0a-1faa87a58372"}', '2026-04-10 07:56:15.834'),
('6db684a7-365e-41b9-a3fa-1091f3caea2c', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.phone', '', '+7(777)777-77-75', '{}', '2026-04-12 19:05:00.498'),
('6fb78bc3-51c1-404c-8c1b-c2523086668b', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удален комментарий', NULL, 'вввввв', NULL, '{}', '2026-04-13 10:30:59.230'),
('70064339-1b7b-4c6a-af64-67cee8021809', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 20:43:27.451'),
('70876e21-3cc5-4d26-8141-6a117c054358', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:07:28.693'),
('71bc2d35-c86a-44c6-9fd9-dd84f1d5384c', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удален комментарий', NULL, 'ввдвдвддвдв', NULL, '{}', '2026-04-11 09:53:46.901'),
('73e1d924-6589-451d-8832-b0135d0c0320', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.phone', '', '4434343434343434343434', '{}', '2026-04-12 19:03:48.892'),
('7470ef7c-3fc0-46c3-8247-773f15f084cc', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удален комментарий', NULL, 'eefefefefe', NULL, '{}', '2026-04-14 07:29:43.522'),
('74c1642b-0ce4-4b5c-8b58-43254248f838', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:42:18.503'),
('74ef61f6-a874-464c-b0bf-6c27d5066666', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлена соцсеть', 'contacts.socials', '', 'dfdfdfdfd', '{}', '2026-04-15 12:02:05.450'),
('75459409-c89c-415a-9e10-664ae99d93de', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:11:09.221'),
('76a2466b-a827-4b23-9581-2a543661488c', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:22:43.748'),
('77aea5ab-62a8-4c73-b183-30e03ac37f8d', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-09 19:23:37.023'),
('77ee8cf0-8aa5-4bd1-b79e-96c3c8c2a78d', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'firstName', '', 'Роман', '{}', '2026-04-12 19:03:12.069'),
('785fc862-7394-4091-8965-dfefcfdea8cc', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'appData', '', '[object Object]', '{}', '2026-04-10 07:10:58.313'),
('799dca35-b2d3-4176-bb8d-6438c3936087', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'birthDate', '', '', '{}', '2026-04-11 13:11:24.545'),
('7d0697ba-28df-4520-8b0a-49fbaaef72d4', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedAt', '', '21.06.1771', '{}', '2026-04-11 09:50:32.945'),
('7d785efd-06e5-4abc-8e86-aa713ee3afbf', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:24:07.071'),
('7e74f094-e451-4146-9347-656af3cc01f0', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-10 08:14:50.389'),
('7f8c04b1-19b1-48a2-abb5-48b937880cce', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "827595d9-903f-49b9-b0bb-b26fb6231689"}', '2026-04-09 19:24:04.327'),
('7fbf5940-f6cd-42cd-95db-aa21817df4d7', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'passport.issuedAt', '21.06.1989', '', '{}', '2026-04-18 15:35:38.492'),
('82400f90-0707-4d9c-b43d-cf270ffab1c4', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'firstName', '', 'Иван', '{}', '2026-04-13 10:52:27.948'),
('830394bb-c108-4e54-bc7d-5ea033942518', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:44:44.139'),
('834f6a22-2b80-4582-a003-98c1be25a94d', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:17:38.454'),
('8391df65-7f8f-4326-9ed1-6a5cd5e8a260', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-09 19:23:55.716'),
('83bec3cb-315d-4106-a8a6-ecc57c727dab', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.registrationAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия ', '{}', '2026-04-13 12:12:21.286'),
('8469b518-11d5-4d46-9a7a-c08911bc855e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Александрович', '{}', '2026-04-11 05:11:23.641'),
('8478bf78-2b5f-4304-8543-b53495fda3cd', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-09 19:23:37.483'),
('8651a532-45e3-4126-bc32-7269990c2d78', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:39:29.730'),
('87b31f84-0a75-40e3-8c54-43eb0787f851', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.socials', '', 'Соцсети: @kilkun', '{}', '2026-04-13 13:50:35.620'),
('89d4937e-d8f5-4fd4-8e3d-675ae6265637', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удалена метка', 'labels', 'Тут еще одна метка', '', '{}', '2026-04-14 07:28:58.303'),
('89d599ea-1ddc-45d0-8a80-d2882ad2a855', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'address.registrationAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия', '{}', '2026-04-13 10:27:02.007'),
('8b60946b-1a86-4841-bdff-b54f0e6aa424', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:22:46.744'),
('8ca6c0b9-e726-4e7c-bd08-1a2daa08d1b1', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'clientOriginalData.passport.seriesAndNumber', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-13 11:17:17.366'),
('8cd2a004-fcfb-4525-8deb-cf2cfd079199', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: тест новой метки, например эта метка для очень прилежных клиентов, а это метка для клиентов с которыми нужно быть осторожнее, для лучших, для интересненьких', '{}', '2026-04-10 11:38:17.872'),
('8f19bed9-c485-4547-b4de-f90d2bcd1cdf', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:52:33.412'),
('8fbfeee4-8192-4d6e-ad0a-e2b01dcdbc2c', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:38:45.576'),
('9136b2fc-4d0a-496a-8dcc-65133faaea3b', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 05:15:58.072'),
('91667da0-7d0d-4897-9217-02ef71a88d06', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удалена соцсеть', 'contacts.socials', '@vasiliy', '', '{}', '2026-04-18 15:35:51.115'),
('9313be65-27c4-4a47-bdf9-72589d1bf3db', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'lastName', '', 'Бубнов ffgfgfg', '{}', '2026-04-13 10:23:18.889'),
('935d0951-a128-4aca-b627-54f0af2c0cb9', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:19:07.926'),
('9360fac1-52d8-4714-a8a3-7e32102227ce', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: новая метка', '{}', '2026-04-11 13:12:16.321'),
('93993a92-cc57-4731-b733-25d75f917e5e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.seriesAndNumber', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-13 12:02:57.696'),
('93d2f425-0f53-46ec-b3f2-b1bca2700834', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'recommendedBy', '', 'тут будут делиться тем как нашли рентал', '{}', '2026-04-11 09:49:56.056'),
('94c6e61d-1d17-4f6e-8307-d79e257e5f47', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-10 13:44:59.272'),
('96430eca-7cce-45ce-a9b8-554940385d1e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'address.registrationAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия', '{}', '2026-04-13 10:26:30.757'),
('9657d1b3-3528-41ee-9055-710947004f5c', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:26:44.259'),
('96f78eb2-2d7d-455a-a63c-a39db4a10d87', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 05:13:00.689'),
('97383225-541f-4845-8c56-4d9868952eaf', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-10 07:08:43.903'),
('98d4b71d-37b9-493d-95f2-8fa71f8dd62b', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedAt', '', '21.06.1989', '{}', '2026-04-13 12:16:22.545'),
('9a0914d0-4f1a-4814-8721-3c366589e1d7', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удален комментарий', NULL, 'Это классный клиент, правда ведь ?', NULL, '{}', '2026-04-14 07:29:46.531'),
('9bdeba09-f3d8-43bb-90d2-71f174b591e5', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.seriesAndNumber', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-13 11:03:36.555'),
('9c1a4e6c-6b53-458d-b4fa-a21601e5f775', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:17:51.280'),
('9c7ff683-3b15-4904-b1ff-510208aeeabc', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-09 19:23:40.343'),
('9d4cc905-3854-42e3-9d34-d5601bf592c9', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'firstName', '', 'Алексндрович', '{}', '2026-04-12 19:02:07.267'),
('9db99680-d264-45f0-bd16-7ae7eb906bec', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'middleName', 'Иванович', 'Романович', '{}', '2026-04-18 15:04:12.168'),
('9ea9b872-beb1-4598-b2d9-3512c5a6baa5', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'birthDate', '', '21.06.1989', '{}', '2026-04-13 12:16:57.338'),
('9efa7c27-fece-432b-800e-962f8b0963dd', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'lastName', '', 'Иванов', '{}', '2026-04-10 13:38:30.462'),
('a03376dd-f2d0-4926-ac8b-bbafc704445e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:39:30.289'),
('a073a091-48f3-4d78-903e-2607b5792f37', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "80c5c62b-0a1a-410e-9d0a-1faa87a58372"}', '2026-04-10 07:29:09.639'),
('a093321b-6026-4a46-8cbb-1826761ff932', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Александрович', '{}', '2026-04-12 19:03:20.718'),
('a18eb399-d8c5-46ee-afaf-24969f544f78', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:40:45.078'),
('a223ac81-4720-4a29-ad14-cf24a84978e2', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'lastName', '', 'Бубнов ', '{}', '2026-04-13 10:23:23.053'),
('a2ea539e-0ea1-4b0e-aab3-2feb8b5f080d', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:08:42.056'),
('a539fcdb-519b-4bdf-90d0-4dcbf894e48a', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-10 07:46:48.140'),
('a8196e4e-75c2-43d8-92bf-807120ccecb7', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "827595d9-903f-49b9-b0bb-b26fb6231689"}', '2026-04-10 07:29:47.064'),
('a940ac4c-fb5e-451d-b65e-685e48d6a120', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:31:29.945'),
('a964fd5e-3fa9-40bc-af39-dc24bf4643ce', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedAt', '', '', '{}', '2026-04-11 13:11:04.375'),
('a96fdd25-8bc9-4701-bfdb-91a8856e3063', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '5 % (за красивые глазки)', '{}', '2026-04-10 14:43:55.958'),
('aa17ea3c-23d8-44e4-9b71-c2589a3caecd', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:39:46.018'),
('aa94addf-e125-4b8c-8f8e-f7d0af463b60', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedBy', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-13 12:16:28.911'),
('aaeebd21-84a9-4e61-978e-58e658267921', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.phone', '', '+7(777)777-77-75', '{}', '2026-04-13 12:17:23.184'),
('ab40e8a4-76a1-46f2-9d25-0b2ab14f57d3', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'firstName', '', 'Роман', '{}', '2026-04-12 19:01:49.325'),
('ac1cec27-1587-468a-a1d6-d6acb1af56f2', '3f1ab5b9-bc03-4840-bbe4-2daeedf8f8bf', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "b7a6cdf9-ef7d-4ffc-9aa0-67ecf5b307c5"}', '2026-04-10 07:37:57.602');
INSERT INTO "UserAuditLog" ("id", "targetUserId", "authorId", "authorName", "action", "fieldName", "valueBefore", "valueAfter", "meta", "createdAt") VALUES
('ac3ecbca-4a0b-42f0-bf63-7a69e2c3a0f3', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: это лучший клиент !!!!, Тут еще одна метка, желтую меточку подвезли', '{}', '2026-04-14 06:56:49.786'),
('ac3ff978-89ac-4c30-afc7-c17e9858c283', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:25:54.293'),
('ac85d67d-6085-486f-87d6-ccfd88320e33', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удален комментарий', NULL, 'пишу новый комментарий', NULL, '{}', '2026-04-11 09:53:50.202'),
('af56d14b-5c27-490f-92ad-4068887401bf', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'address.registrationAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия', '{}', '2026-04-13 11:20:11.189'),
('afcbb80b-ef51-4dd1-9fe3-b9b8fb34d014', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:26:03.531'),
('afdc7f77-e3a7-4519-ae6f-1bbe3c005a0b', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'lastName', '', 'Бубнов', '{}', '2026-04-10 13:44:40.648'),
('afe0b060-318f-4ec8-8671-0959ee0b4ac1', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '0 %', '{}', '2026-04-13 08:39:04.818'),
('afe0c70a-0fda-4b0d-a36f-283fce762da1', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 20:43:26.721'),
('b0637ca8-40d8-47a6-8d60-c3ab25851d35', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлен комментарий', NULL, NULL, 'пишу новый комментарий', '{}', '2026-04-10 14:38:52.321'),
('b06cd067-f2a0-4d54-9f2c-4ed63d8f87b1', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:07:13.476'),
('b19327b3-1fd3-4fa7-b13b-a9d1eb7b2040', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлен комментарий', NULL, NULL, 'а я пишу ответ на этот комментарий', '{}', '2026-04-10 14:47:30.414'),
('b194c11c-3f5f-42d1-a23f-131b8772be5a', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:44:45.858'),
('b216e3cb-bb9b-4d5f-b44d-60639d78e94b', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:24:07.691'),
('b26081ef-173b-4cc7-b43a-49f7be6cf000', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '20 %', '{}', '2026-04-11 09:51:36.505'),
('b2a9a07b-71be-4400-9ca3-9c41b71ebea1', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedAt', '', '21.06.1989', '{}', '2026-04-13 10:46:34.587'),
('b3684708-a3d8-48fc-a650-4593fa0d9285', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:40:00.678'),
('b37981a8-06c5-4bd4-a087-f6707c8fe4ad', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.phone', '', '+7', '{}', '2026-04-13 10:51:56.912'),
('b427578d-ac18-497a-91f3-601a44e5c28d', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:19:07.261'),
('b4b1518e-d418-41d4-8cc5-3067aeefcdfc', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedBy', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-13 11:32:54.461'),
('b4c50e1d-2d2e-43a7-a024-d7c79f4c414a', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'address.registrationAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия', '{}', '2026-04-13 10:47:04.106'),
('b5b8fcfe-ac9f-498f-997c-c87ffec3d502', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:39:04.024'),
('b6378c4b-9db4-4e86-9523-1825419fe4f4', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Иванович', '{}', '2026-04-11 09:48:19.960'),
('b78b6d58-dae7-435c-a346-605d68c189c6', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: это лучший клиент !!!!', '{}', '2026-04-12 13:25:37.950'),
('b7f4bf43-9b68-4ea9-9f69-88be4c2ce295', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: тест новой метки, например эта метка для очень прилежных клиентов, а это метка для клиентов с которыми нужно быть осторожнее, для лучших, для интересненьких, ну и просто метка', '{}', '2026-04-10 11:38:29.966'),
('b807c669-42c9-4942-9e9f-304623ee9ae2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "827595d9-903f-49b9-b0bb-b26fb6231689"}', '2026-04-09 19:24:01.610'),
('b8a88961-bd3a-4de9-8005-f6cc4148393b', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:31:30.570'),
('ba589d14-61c2-46b6-aca6-952515a1b2b5', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удалена соцсеть', 'contacts.socials', 'dfdfdfdfd', '', '{}', '2026-04-15 12:02:10.366'),
('ba60e7e4-4c08-4f9f-bd4f-9d4568276c9f', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-10 07:46:48.577'),
('bba5884e-d75d-4b69-b650-5bd9818faa3c', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: тест новой метки', '{}', '2026-04-10 11:36:10.303'),
('bbd13210-dbc1-4602-8732-3e7816de9cda', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:40:45.496'),
('bc33ba44-dd0c-4f69-8715-b3644b2dcfb1', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:39:51.619'),
('bc957b9b-318a-4d0c-8076-bd91f2ea9b13', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: это лучший клиент !!!!, Тут еще одна метка', '{}', '2026-04-13 12:20:14.963'),
('bd5449cd-1dd5-4335-ad77-bb8e98287709', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.extraPhone', '', '', '{}', '2026-04-12 19:28:44.489'),
('bd999a51-efcd-43d4-95d5-a6c110c16e60', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.seriesAndNumber', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-13 10:44:54.083'),
('be28bba2-408e-4636-976d-cf62ebed0119', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.socials', '', 'Соцсети: @kilkun', '{}', '2026-04-13 14:16:56.523'),
('be4f037d-c8d4-4787-865f-917965e01cc5', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удален комментарий', NULL, 'вот тут будут всякие комментарии', NULL, '{}', '2026-04-10 14:38:29.981'),
('bee97582-243b-43c4-90e6-9d57d94411a2', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удалена метка', 'labels', 'красная метка', '', '{}', '2026-04-18 15:36:09.317'),
('c010d848-e2d5-4053-bb43-b05fd2e4522f', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:42:41.505'),
('c20f3591-c841-4f72-9ddb-6da4314dd89e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлен комментарий', NULL, NULL, 'eefefefefe', '{}', '2026-04-14 07:29:22.673'),
('c2d11266-6879-48d6-8dfe-2aa281d122d1', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.registrationAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия', '{}', '2026-04-13 11:33:48.671'),
('c2fbc3ed-340e-4c1f-9841-5dadda24487a', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удален комментарий', NULL, 'заметка номер раз', NULL, '{}', '2026-04-10 14:38:32.863'),
('c3dfcc51-879b-406e-821e-510e8c4259a9', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '90 %', '{}', '2026-04-10 13:27:09.101'),
('c3e602ac-bec6-4c3e-99b4-a88d70d4b8f8', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'address.residentialAddress', '', 'Ленинградская обл, Кировский р-н, тер. СНТ ГРЭС №8 имени Кирова (Беляевский мох), 30-я линия ', '{}', '2026-04-13 12:15:09.630'),
('c53c497a-6969-431d-aa0a-79a435f3fd1d', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-10 07:08:43.200'),
('c6b5f8fb-b9e9-4cbb-b1db-59d3f049b05a', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "80c5c62b-0a1a-410e-9d0a-1faa87a58372"}', '2026-04-10 07:55:12.975'),
('c7b8ec39-924b-4e06-ab28-793a8a625244', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:19:40.694'),
('c8074cdc-5f5a-4532-9893-bf456fd96546', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:42:41.970'),
('c9761086-bba4-4002-9e2a-25f3319a7cd5', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Изменение соцсетей', 'contacts.socials', '@test_user', '@kilkun', '{}', '2026-04-15 12:01:57.966'),
('cab7e92f-e0ae-47a6-b299-a78dc52c47dc', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.seriesAndNumber', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-13 10:53:08.706'),
('cc019bf5-58a3-4646-a990-c2de7e60b9c7', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:17:51.884'),
('ce729d8b-5bc0-4438-b18b-fa8503d61752', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'recommendedBy', '', '', '{}', '2026-04-12 12:12:59.133'),
('cf289ce4-4413-4a5e-beb6-4e930b47326e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: тест новой метки, например эта метка для очень прилежных клиентов', '{}', '2026-04-10 11:37:31.000'),
('d0d49951-e658-4ffe-8a68-26aa649167d3', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'lastName', '', 'Бубнов', '{}', '2026-04-13 12:17:31.921'),
('d0fce847-5877-44ba-8b22-eef8f4a70521', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-10 05:15:12.936'),
('d15ecada-4d88-481c-b772-805454783e27', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '0 %', '{}', '2026-04-13 08:46:02.182'),
('d17451e7-d888-4b8e-9165-37b611a2e1a3', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "827595d9-903f-49b9-b0bb-b26fb6231689"}', '2026-04-09 19:24:03.895'),
('d218ef62-f749-4cab-bb86-779a6114bad4', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.socials', '', 'Соцсети: @test_user', '{}', '2026-04-11 01:49:45.819'),
('d3a4bfcd-247a-4d2a-8015-f42af65c174b', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'middleName', 'Алексндрович', 'Романович', '{}', '2026-04-18 14:40:58.434'),
('d3a81322-7025-4c4b-b536-056f0e788f09', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'lastName', '', 'Бубнов', '{}', '2026-04-10 07:09:20.033'),
('d43c6899-5ebb-4e8e-a529-835818481ae4', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-10 13:37:59.692'),
('d441ccce-e5e2-4030-92db-bdd3c8874303', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '10 ₽', '{}', '2026-04-10 17:01:24.973'),
('d618c58d-9c69-472f-8935-c6aa3945a1a7', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'recommendedBy', '', 'фото кто-то', '{}', '2026-04-13 11:00:49.675'),
('d622b76a-221e-4608-aba3-2f8b209807a0', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удален комментарий', NULL, 'а я пишу ответ на этот комментарий', NULL, '{}', '2026-04-11 09:53:47.868'),
('d752a0e9-ace5-4b50-bbc3-392e40b28927', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлен комментарий', NULL, NULL, 'ввдвдвддвдв', '{}', '2026-04-10 14:48:30.387'),
('d80d8ebf-e4e4-41be-a250-1cd6b995ab19', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:26:02.836'),
('d9f00f6c-bd57-4e1a-a60f-3ca399646194', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-10 13:38:15.777'),
('da4daffe-88c0-475d-837c-e2f9e9d06cbc', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:05:26.399'),
('da92771c-bab2-4213-83a2-d94afe20d05e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'lastName', '', 'Иванов', '{}', '2026-04-13 10:52:29.707'),
('db6fbef0-eae8-4624-8ac6-09656e33a005', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.email', '', 'rom', '{}', '2026-04-13 10:52:46.338'),
('dbbc1004-b41c-4ffc-8683-3ac850017fb0', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:11:09.840'),
('dc62f790-ebb5-4535-8546-88d8e859b9b4', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-10 07:21:14.296'),
('dce091a0-f736-4272-be78-d93fe8a6e544', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: а это метка для клиентов с которыми нужно быть осторожнее, для лучших, для интересненьких, ну и просто метка', '{}', '2026-04-10 13:26:45.172'),
('e007c29b-7c4b-4be5-9116-b3d08513096e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:22:43.035'),
('e19b34e6-5d4d-404a-b49d-a3f3aac54534', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:12:04.590'),
('e1d2d913-fb5b-4750-819e-3c7686d5d9ad', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:26:45.235'),
('e270b652-f8ba-4a67-949d-bc11fa76b26e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Александрович', '{}', '2026-04-11 07:38:31.075'),
('e39bd0c7-4bde-4b3c-a8b6-e301931ab6de', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'birthDate', '21.01.1981', '', '{}', '2026-04-18 15:35:29.381'),
('e42f95c5-9142-4644-993c-7d9e06d28dc8', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '10 %', '{}', '2026-04-13 08:38:02.331'),
('e5349c98-7201-4de4-a0b6-fd5c6da4352b', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:17:39.039'),
('e563b219-b9b4-4582-8a91-6a735000035f', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.email', '', 'roman.bubnov.1989@gmail.com', '{}', '2026-04-12 12:59:05.590'),
('e5b30ce6-214e-40bd-8bed-9b8993a4643d', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.socials', '', 'Соцсети: @test_user, http://localhost:3000/admin/users', '{}', '2026-04-11 01:46:43.694'),
('e65af20c-95c4-49e0-98eb-5103126693db', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:28:23.383'),
('e672b3f0-e55a-4fd2-8931-7881e8fe53c6', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлена метка', 'labels', '', 'тестовая метка', '{}', '2026-04-18 15:32:14.571'),
('e67d1dd4-60fb-49cd-8374-f47d66c75870', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:39:45.567'),
('e6e65832-825a-4f00-af3b-28d9b9fb82d6', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Александрович', '{}', '2026-04-10 07:09:38.119'),
('e73f8a67-3e4e-44b0-8e54-6f6bddbae98c', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.issuedAt', '', '21.06.1989', '{}', '2026-04-13 11:27:22.273'),
('e7525771-4e09-4733-b345-8fce80f31f86', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Назначена скидка', 'discount', NULL, '20 %', '{}', '2026-04-13 08:41:06.057'),
('e7b7675a-2ef6-4040-94f0-00695353e666', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Удален комментарий', NULL, 'заметка номер двас', NULL, '{}', '2026-04-10 14:38:31.564'),
('e858b22a-f23b-4d2f-97d9-e00258643e9c', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:40:00.092'),
('e940a39b-f0ee-465a-bee3-ab3d15aac779', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.seriesAndNumber', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-13 12:15:12.807'),
('e9b85460-9818-4b55-82e0-25562259ded7', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:38:44.959'),
('ea48fc33-00df-4d6d-8dab-f95772d32296', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Александрович', '{}', '2026-04-11 05:12:17.371'),
('ea76de07-9b5d-4c18-aa27-a2355cf443ea', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:28:22.831'),
('ec4b70ec-d50a-41f1-a779-612dfea3d498', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:14:38.605'),
('eea935e7-6068-4443-a220-8a2f859ebe49', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "436f6e91-5ce4-4a8d-b291-504548830544"}', '2026-04-09 19:23:12.751'),
('ef03b923-d491-4ba4-a118-ad322f8a29ad', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'appData.passport.issuedAt', '', '21.06.1989', '{}', '2026-04-13 11:29:01.187'),
('f078287a-8c35-41d3-b939-35d682e0accc', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'firstName', '', 'Роман', '{}', '2026-04-10 07:09:27.602'),
('f08ca600-beb6-4a11-b997-41feef86299d', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-10 13:45:54.268'),
('f0f52565-ed4f-4a79-bdb4-91d3ceac036c', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлена метка', 'labels', '', 'красная метка', '{}', '2026-04-18 15:32:39.885'),
('f16165fa-23ce-463a-b7c9-f2e1f8544314', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'passport.seriesAndNumber', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-18 11:43:50.731'),
('f176abc3-7884-404c-b5cc-6c04de4de419', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлен комментарий', NULL, NULL, 'ну да, ничо такой', '{}', '2026-04-13 14:29:50.233'),
('f1d84fc3-c062-4724-b888-95b154e48449', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:42:59.158'),
('f29d2254-d653-4897-b981-4781ee4a7ae2', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.divisionCode', '', '111-111', '{}', '2026-04-13 11:00:32.101'),
('f367bb84-604e-46ea-8ac5-04312a1d5fb6', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'firstName', '', 'админов', '{}', '2026-04-11 13:10:35.501'),
('f37bfe7c-51f5-43c1-b043-6eb22ac7cbe3', 'db3ae213-c165-453e-bf62-d48f6198449c', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'lastName', '', 'аккаунт', '{}', '2026-04-11 13:10:34.124'),
('f53b7ae8-be6c-40fc-821c-9de41096111e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 07:42:30.539'),
('f5527fbe-272a-4476-a75e-561db91dc8d6', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'passport.seriesAndNumber', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-18 15:35:36.194'),
('f5cb567b-1a3e-4fab-901b-1004a4f464de', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'birthDate', '', '21.06келдкелдлкедлек', '{}', '2026-04-13 10:52:13.205'),
('f5db50d6-371d-418f-ae47-8f86550a25c0', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Добавлена метка', 'labels', '', 'пустая метка', '{}', '2026-04-18 15:32:57.714'),
('f79aa9ca-3b38-46c8-8e28-4a1335d5e559', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 05:42:32.015'),
('f802c4c5-095b-488c-9b68-397557c6e525', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'middleName', '', '', '{}', '2026-04-18 15:35:31.809'),
('f814bd5f-38b0-4b5b-9c1c-280f9d1dc820', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'middleName', 'Романович', 'Александрович', '{}', '2026-04-18 14:41:10.946'),
('f86d1ceb-ee64-475e-8c53-ca51f014a8f5', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'middleName', '', 'Иванович', '{}', '2026-04-13 10:52:37.310'),
('f8f3b3b4-1e2f-49ca-8113-a698e3e08c83', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'labels', '', 'Метки: например эта метка для очень прилежных клиентов, а это метка для клиентов с которыми нужно быть осторожнее, для лучших, для интересненьких, ну и просто метка', '{}', '2026-04-10 13:26:40.560'),
('fa1830d1-c71e-4bea-a2b1-92a0199a64aa', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'lastName', 'Иванов', 'Романов', '{}', '2026-04-18 15:04:13.892'),
('fa73bcaa-a767-46e3-a465-732b6b48ccf2', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'birthDate', '', '1989-06-21', '{}', '2026-04-12 19:00:49.808'),
('fa767998-17d2-4845-8df3-c47aeb599e1f', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'lastName', '', 'Бубнов', '{}', '2026-04-12 19:01:33.116'),
('faab8186-662b-41cd-91bc-d355f3d48284', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'contacts.socials', '', 'Соцсети: @kilkun', '{}', '2026-04-12 20:04:05.929'),
('facd0b2b-98b2-4591-8199-cc6fcdf4cdc4', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-10 08:14:15.966'),
('fb7795e5-a5be-4bcc-89db-406e61e3df6d', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-09 19:22:47.373'),
('fbf7b149-ac55-4a04-a882-2091b5173371', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'EDIT_APPLICATION', 'passport.seriesAndNumber', '*** скрыто ***', '*** обновлено (скрыто) ***', '{}', '2026-04-13 10:46:27.751'),
('fc000691-8088-4cc4-9487-abbfdb046ff9', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'Редактирование поля', 'lastName', 'Иванов', '', '{}', '2026-04-18 15:35:22.429'),
('fd81f7ed-3eba-4b51-855c-aa97853f1cc1', '5e73cfa1-bc12-40f6-a5a4-e5ad660110f9', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "80c5c62b-0a1a-410e-9d0a-1faa87a58372"}', '2026-04-10 07:56:15.289'),
('fe481757-a2e0-44d1-8b3e-d1421b07172b', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:23:36.772'),
('ff63252a-b662-4650-a1b7-0ed709577a44', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'db3ae213-c165-453e-bf62-d48f6198449c', 'linzarental', 'VIEW_APPLICATION', NULL, NULL, NULL, '{"applicationId": "3cf12e62-2271-4a29-98ea-9546e579296f"}', '2026-04-10 06:23:37.283');
-- --------------------------------------------------------
--
-- Структура таблицы `UserDiscount`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "UserDiscount" CASCADE;
CREATE TABLE IF NOT EXISTS "UserDiscount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "DiscountType" NOT NULL,
  "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "promoCode" TEXT DEFAULT NULL,
  "description" TEXT,
  "validFrom" TIMESTAMPTZ DEFAULT NULL,
  "validUntil" TIMESTAMPTZ DEFAULT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdBy" TEXT DEFAULT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--
-- Дамп данных таблицы `UserDiscount`
--
INSERT INTO "UserDiscount" ("id", "userId", "type", "value", "promoCode", "description", "validFrom", "validUntil", "isActive", "createdBy", "createdAt") VALUES
('1035ffc1-e4d7-428c-b6db-18f749da4f97', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'PERCENT'::"DiscountType", 0, NULL, '', NULL, NULL, FALSE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-13 08:46:01.971'),
('26effcc7-1817-4cf1-8160-699eb8735386', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'PERCENT'::"DiscountType", 20, NULL, '', NULL, NULL, FALSE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-13 08:41:05.859'),
('2a9d9d7f-0046-42fd-b886-bbf47800abb0', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'FIXED'::"DiscountType", 10, NULL, '', NULL, NULL, FALSE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-10 17:01:24.729'),
('7612a930-b809-42de-8fb5-0d3d5b8bfd71', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'PERCENT'::"DiscountType", 20, NULL, '', NULL, NULL, TRUE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-13 09:51:22.466'),
('7f4200fc-be99-4648-8cae-8e3e7f95da6e', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'PERCENT'::"DiscountType", 10, NULL, '', NULL, NULL, FALSE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-13 08:38:02.128'),
('9b2fc698-b0ec-4c7a-9651-2842983f2a08', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'PERCENT'::"DiscountType", 0, NULL, '', NULL, NULL, FALSE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-13 08:39:04.608'),
('a97752f4-f8db-404d-bb87-18b8d505ee35', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'PERCENT'::"DiscountType", 90, NULL, '', NULL, NULL, FALSE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-10 13:27:08.804'),
('b010a84d-5f8e-44b3-9afd-43e0a5d7dc0b', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'PERCENT'::"DiscountType", 0, NULL, '', NULL, NULL, FALSE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-13 08:07:29.241'),
('c42e285d-1dc0-44a0-bb14-462e10ddefae', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'FIXED'::"DiscountType", 0, NULL, '', NULL, NULL, FALSE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-10 19:28:18.558'),
('c4c7fc32-c78b-4187-9f2b-a1450d1448be', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'PERCENT'::"DiscountType", 0, NULL, '', NULL, NULL, FALSE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-10 20:02:17.893'),
('d76f4498-5930-4a0b-b90a-013f03057c79', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'PERCENT'::"DiscountType", 20, NULL, '', NULL, NULL, FALSE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-11 09:51:36.251'),
('debce730-3297-4b52-8ce3-3e70879f3526', 'f9f32484-b7d9-4cf6-b82e-ca32a75a08f2', 'PERCENT'::"DiscountType", 100, NULL, '', NULL, NULL, TRUE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-10 07:47:08.091'),
('f2d3c656-d3c5-49dd-95a3-821dc7b088de', 'e3b42108-8e30-4bbe-bc2a-963f3636134a', 'PERCENT'::"DiscountType", 5, NULL, 'за красивые глазки', NULL, NULL, FALSE, 'db3ae213-c165-453e-bf62-d48f6198449c', '2026-04-10 14:43:55.724');
-- --------------------------------------------------------
--
-- Структура таблицы `VerificationToken`
--
-- Создание: Апр 22 2026 г., 15:46
-- Последнее обновление: Апр 22 2026 г., 15:46
--
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMPTZ NOT NULL
);
--
-- Дамп данных таблицы `VerificationToken`
--
INSERT INTO "VerificationToken" ("identifier", "token", "expires") VALUES
('kilkun@mail.com', '2a9c936286c5f8b69ab17fd0bc577ea18118cba190f67387c5c20e60b5667579', '2026-03-25 20:13:43.497');
--
-- Индексы сохранённых таблиц
--
--
-- Индексы таблицы `Account`
--
ALTER TABLE "Account" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account" ("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "Account_userId_fkey" ON "Account" ("userId");
--
-- Индексы таблицы `AdminNotification`
--
ALTER TABLE "AdminNotification" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "AdminNotification_userId_fkey" ON "AdminNotification" ("userId");
--
-- Индексы таблицы `BalanceTransaction`
--
ALTER TABLE "BalanceTransaction" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "BalanceTransaction_userId_fkey" ON "BalanceTransaction" ("userId");
CREATE INDEX IF NOT EXISTS "BalanceTransaction_bookingId_fkey" ON "BalanceTransaction" ("bookingId");
CREATE INDEX IF NOT EXISTS "BalanceTransaction_authorId_fkey" ON "BalanceTransaction" ("authorId");
--
-- Индексы таблицы `Banner`
--
ALTER TABLE "Banner" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "Banner_createdBy_fkey" ON "Banner" ("createdBy");
--
-- Индексы таблицы `BannerImage`
--
ALTER TABLE "BannerImage" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "BannerImage_bannerId_fkey" ON "BannerImage" ("bannerId");
--
-- Индексы таблицы `Booking`
--
ALTER TABLE "Booking" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "Booking_userId_fkey" ON "Booking" ("userId");
--
-- Индексы таблицы `BookingAdminNote`
--
ALTER TABLE "BookingAdminNote" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "BookingAdminNote_bookingId_fkey" ON "BookingAdminNote" ("bookingId");
CREATE INDEX IF NOT EXISTS "BookingAdminNote_authorId_fkey" ON "BookingAdminNote" ("authorId");
--
-- Индексы таблицы `BookingAuditLog`
--
ALTER TABLE "BookingAuditLog" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "BookingAuditLog_bookingId_fkey" ON "BookingAuditLog" ("bookingId");
CREATE INDEX IF NOT EXISTS "BookingAuditLog_authorId_fkey" ON "BookingAuditLog" ("authorId");
--
-- Индексы таблицы `BookingItem`
--
ALTER TABLE "BookingItem" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "BookingItem_bookingId_fkey" ON "BookingItem" ("bookingId");
CREATE INDEX IF NOT EXISTS "BookingItem_equipmentId_fkey" ON "BookingItem" ("equipmentId");
--
-- Индексы таблицы `BookingLabel`
--
ALTER TABLE "BookingLabel" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "BookingLabel_bookingId_fkey" ON "BookingLabel" ("bookingId");
CREATE INDEX IF NOT EXISTS "BookingLabel_authorId_fkey" ON "BookingLabel" ("authorId");
--
-- Индексы таблицы `BookingPayment`
--
ALTER TABLE "BookingPayment" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "BookingPayment_bookingId_fkey" ON "BookingPayment" ("bookingId");
CREATE INDEX IF NOT EXISTS "BookingPayment_authorId_fkey" ON "BookingPayment" ("authorId");
--
-- Индексы таблицы `CartItem`
--
ALTER TABLE "CartItem" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_userId_equipmentId_key" ON "CartItem" ("userId", "equipmentId");
CREATE INDEX IF NOT EXISTS "CartItem_equipmentId_fkey" ON "CartItem" ("equipmentId");
--
-- Индексы таблицы `Category`
--
ALTER TABLE "Category" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category" ("slug");
--
-- Индексы таблицы `CategoryHistory`
--
ALTER TABLE "CategoryHistory" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "CategoryHistory_changedBy_fkey" ON "CategoryHistory" ("changedBy");
--
-- Индексы таблицы `ClientApplication`
--
ALTER TABLE "ClientApplication" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "ClientApplication_userId_key" ON "ClientApplication" ("userId");
--
-- Индексы таблицы `DocumentGenerationLog`
--
ALTER TABLE "DocumentGenerationLog" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "DocumentGenerationLog_bookingId_fkey" ON "DocumentGenerationLog" ("bookingId");
CREATE INDEX IF NOT EXISTS "DocumentGenerationLog_templateId_fkey" ON "DocumentGenerationLog" ("templateId");
CREATE INDEX IF NOT EXISTS "DocumentGenerationLog_generatedBy_fkey" ON "DocumentGenerationLog" ("generatedBy");
--
-- Индексы таблицы `DocumentTemplate`
--
ALTER TABLE "DocumentTemplate" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "DocumentTemplate_createdBy_fkey" ON "DocumentTemplate" ("createdBy");
--
-- Индексы таблицы `Equipment`
--
ALTER TABLE "Equipment" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "Equipment_slug_key" ON "Equipment" ("slug");
CREATE INDEX IF NOT EXISTS "Equipment_categoryId_fkey" ON "Equipment" ("categoryId");
CREATE INDEX IF NOT EXISTS "Equipment_subcategoryId_fkey" ON "Equipment" ("subcategoryId");
--
-- Индексы таблицы `EquipmentImageLink`
--
ALTER TABLE "EquipmentImageLink" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "EquipmentImageLink_equipmentId_imageId_key" ON "EquipmentImageLink" ("equipmentId", "imageId");
CREATE INDEX IF NOT EXISTS "EquipmentImageLink_imageId_fkey" ON "EquipmentImageLink" ("imageId");
--
-- Индексы таблицы `EquipmentRelation`
--
ALTER TABLE "EquipmentRelation" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "EquipmentRelation_equipmentId_relatedId_key" ON "EquipmentRelation" ("equipmentId", "relatedId");
CREATE INDEX IF NOT EXISTS "EquipmentRelation_relatedId_fkey" ON "EquipmentRelation" ("relatedId");
--
-- Индексы таблицы `EquipmentSet`
--
ALTER TABLE "EquipmentSet" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "EquipmentSet_userId_fkey" ON "EquipmentSet" ("userId");
--
-- Индексы таблицы `FaqItem`
--
ALTER TABLE "FaqItem" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "FaqItem_createdBy_fkey" ON "FaqItem" ("createdBy");
CREATE INDEX IF NOT EXISTS "FaqItem_updatedBy_fkey" ON "FaqItem" ("updatedBy");
--
-- Индексы таблицы `Favorite`
--
ALTER TABLE "Favorite" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "Favorite_userId_fkey" ON "Favorite" ("userId");
CREATE INDEX IF NOT EXISTS "Favorite_equipmentId_fkey" ON "Favorite" ("equipmentId");
--
-- Индексы таблицы `Image`
--
ALTER TABLE "Image" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "Image_hash_key" ON "Image" ("hash");
--
-- Индексы таблицы `InviteToken`
--
ALTER TABLE "InviteToken" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "InviteToken_token_key" ON "InviteToken" ("token");
CREATE INDEX IF NOT EXISTS "InviteToken_userId_fkey" ON "InviteToken" ("userId");
--
-- Индексы таблицы `Session`
--
ALTER TABLE "Session" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session" ("sessionToken");
CREATE INDEX IF NOT EXISTS "Session_userId_fkey" ON "Session" ("userId");
--
-- Индексы таблицы `SiteSetting`
--
ALTER TABLE "SiteSetting" ADD PRIMARY KEY ("key");
--
-- Индексы таблицы `Subcategory`
--
ALTER TABLE "Subcategory" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "Subcategory_slug_key" ON "Subcategory" ("slug");
CREATE INDEX IF NOT EXISTS "Subcategory_categoryId_fkey" ON "Subcategory" ("categoryId");
--
-- Индексы таблицы `User`
--
ALTER TABLE "User" ADD PRIMARY KEY ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" ("email");
CREATE INDEX IF NOT EXISTS "User_mergedIntoId_fkey" ON "User" ("mergedIntoId");
--
-- Индексы таблицы `UserAdminNote`
--
ALTER TABLE "UserAdminNote" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "UserAdminNote_userId_fkey" ON "UserAdminNote" ("userId");
CREATE INDEX IF NOT EXISTS "UserAdminNote_authorId_fkey" ON "UserAdminNote" ("authorId");
--
-- Индексы таблицы `UserAuditLog`
--
ALTER TABLE "UserAuditLog" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "UserAuditLog_targetUserId_fkey" ON "UserAuditLog" ("targetUserId");
CREATE INDEX IF NOT EXISTS "UserAuditLog_authorId_fkey" ON "UserAuditLog" ("authorId");
--
-- Индексы таблицы `UserDiscount`
--
ALTER TABLE "UserDiscount" ADD PRIMARY KEY ("id");
CREATE INDEX IF NOT EXISTS "UserDiscount_userId_fkey" ON "UserDiscount" ("userId");
CREATE INDEX IF NOT EXISTS "UserDiscount_createdBy_fkey" ON "UserDiscount" ("createdBy");
--
-- Индексы таблицы `VerificationToken`
--
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken" ("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken" ("identifier", "token");
--
-- Ограничения внешнего ключа сохраненных таблиц
--
--
-- Ограничения внешнего ключа таблицы `Account`
--
ALTER TABLE "Account"
  ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `AdminNotification`
--
ALTER TABLE "AdminNotification"
  ADD CONSTRAINT "AdminNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `BalanceTransaction`
--
ALTER TABLE "BalanceTransaction"
  ADD CONSTRAINT "BalanceTransaction_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "BalanceTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "BalanceTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `Banner`
--
ALTER TABLE "Banner"
  ADD CONSTRAINT "Banner_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `BannerImage`
--
ALTER TABLE "BannerImage"
  ADD CONSTRAINT "BannerImage_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `Booking`
--
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `BookingAdminNote`
--
ALTER TABLE "BookingAdminNote"
  ADD CONSTRAINT "BookingAdminNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "BookingAdminNote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `BookingAuditLog`
--
ALTER TABLE "BookingAuditLog"
  ADD CONSTRAINT "BookingAuditLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "BookingAuditLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `BookingItem`
--
ALTER TABLE "BookingItem"
  ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "BookingItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `BookingLabel`
--
ALTER TABLE "BookingLabel"
  ADD CONSTRAINT "BookingLabel_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "BookingLabel_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `BookingPayment`
--
ALTER TABLE "BookingPayment"
  ADD CONSTRAINT "BookingPayment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "BookingPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `CartItem`
--
ALTER TABLE "CartItem"
  ADD CONSTRAINT "CartItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `CategoryHistory`
--
ALTER TABLE "CategoryHistory"
  ADD CONSTRAINT "CategoryHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `ClientApplication`
--
ALTER TABLE "ClientApplication"
  ADD CONSTRAINT "ClientApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `DocumentGenerationLog`
--
ALTER TABLE "DocumentGenerationLog"
  ADD CONSTRAINT "DocumentGenerationLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentGenerationLog_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentGenerationLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `DocumentTemplate`
--
ALTER TABLE "DocumentTemplate"
  ADD CONSTRAINT "DocumentTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `Equipment`
--
ALTER TABLE "Equipment"
  ADD CONSTRAINT "Equipment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Equipment_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `EquipmentImageLink`
--
ALTER TABLE "EquipmentImageLink"
  ADD CONSTRAINT "EquipmentImageLink_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EquipmentImageLink_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `EquipmentRelation`
--
ALTER TABLE "EquipmentRelation"
  ADD CONSTRAINT "EquipmentRelation_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "EquipmentRelation_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `EquipmentSet`
--
ALTER TABLE "EquipmentSet"
  ADD CONSTRAINT "EquipmentSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `FaqItem`
--
ALTER TABLE "FaqItem"
  ADD CONSTRAINT "FaqItem_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "FaqItem_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `Favorite`
--
ALTER TABLE "Favorite"
  ADD CONSTRAINT "Favorite_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `InviteToken`
--
ALTER TABLE "InviteToken"
  ADD CONSTRAINT "InviteToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `Session`
--
ALTER TABLE "Session"
  ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `Subcategory`
--
ALTER TABLE "Subcategory"
  ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `User`
--
ALTER TABLE "User"
  ADD CONSTRAINT "User_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `UserAdminNote`
--
ALTER TABLE "UserAdminNote"
  ADD CONSTRAINT "UserAdminNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "UserAdminNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `UserAuditLog`
--
ALTER TABLE "UserAuditLog"
  ADD CONSTRAINT "UserAuditLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "UserAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
--
-- Ограничения внешнего ключа таблицы `UserDiscount`
--
ALTER TABLE "UserDiscount"
  ADD CONSTRAINT "UserDiscount_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "UserDiscount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;