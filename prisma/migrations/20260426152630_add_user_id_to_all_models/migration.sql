-- Migration: Add userId to all root models for multi-tenant data isolation
-- Strategy: Add nullable → backfill with admin userId → set NOT NULL

-- Step 1: Add columns as NULLABLE
ALTER TABLE "AccountTransfer" ADD COLUMN "userId" TEXT;
ALTER TABLE "BankAccount" ADD COLUMN "userId" TEXT;
ALTER TABLE "Expense" ADD COLUMN "userId" TEXT;
ALTER TABLE "Item" ADD COLUMN "userId" TEXT;
ALTER TABLE "ItemCategory" ADD COLUMN "userId" TEXT;
ALTER TABLE "Party" ADD COLUMN "userId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "userId" TEXT;
ALTER TABLE "PurchaseInvoice" ADD COLUMN "userId" TEXT;
ALTER TABLE "PurchaseReturn" ADD COLUMN "userId" TEXT;
ALTER TABLE "SaleInvoice" ADD COLUMN "userId" TEXT;
ALTER TABLE "SaleReturn" ADD COLUMN "userId" TEXT;

-- Step 2: Backfill existing data with the admin user (kailashtrivedi7@gmail.com)
-- This assigns ALL existing data to the real admin account.
UPDATE "AccountTransfer" SET "userId" = (SELECT id FROM "User" WHERE email = 'kailashtrivedi7@gmail.com' LIMIT 1) WHERE "userId" IS NULL;
UPDATE "BankAccount" SET "userId" = (SELECT id FROM "User" WHERE email = 'kailashtrivedi7@gmail.com' LIMIT 1) WHERE "userId" IS NULL;
UPDATE "Expense" SET "userId" = (SELECT id FROM "User" WHERE email = 'kailashtrivedi7@gmail.com' LIMIT 1) WHERE "userId" IS NULL;
UPDATE "Item" SET "userId" = (SELECT id FROM "User" WHERE email = 'kailashtrivedi7@gmail.com' LIMIT 1) WHERE "userId" IS NULL;
UPDATE "ItemCategory" SET "userId" = (SELECT id FROM "User" WHERE email = 'kailashtrivedi7@gmail.com' LIMIT 1) WHERE "userId" IS NULL;
UPDATE "Party" SET "userId" = (SELECT id FROM "User" WHERE email = 'kailashtrivedi7@gmail.com' LIMIT 1) WHERE "userId" IS NULL;
UPDATE "Payment" SET "userId" = (SELECT id FROM "User" WHERE email = 'kailashtrivedi7@gmail.com' LIMIT 1) WHERE "userId" IS NULL;
UPDATE "PurchaseInvoice" SET "userId" = (SELECT id FROM "User" WHERE email = 'kailashtrivedi7@gmail.com' LIMIT 1) WHERE "userId" IS NULL;
UPDATE "PurchaseReturn" SET "userId" = (SELECT id FROM "User" WHERE email = 'kailashtrivedi7@gmail.com' LIMIT 1) WHERE "userId" IS NULL;
UPDATE "SaleInvoice" SET "userId" = (SELECT id FROM "User" WHERE email = 'kailashtrivedi7@gmail.com' LIMIT 1) WHERE "userId" IS NULL;
UPDATE "SaleReturn" SET "userId" = (SELECT id FROM "User" WHERE email = 'kailashtrivedi7@gmail.com' LIMIT 1) WHERE "userId" IS NULL;

-- Step 3: Make columns NOT NULL
ALTER TABLE "AccountTransfer" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "BankAccount" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Item" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "ItemCategory" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Party" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "PurchaseInvoice" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "PurchaseReturn" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "SaleInvoice" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "SaleReturn" ALTER COLUMN "userId" SET NOT NULL;

-- Step 4: Add Foreign Key Constraints
ALTER TABLE "Party" ADD CONSTRAINT "Party_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemCategory" ADD CONSTRAINT "ItemCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Item" ADD CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleInvoice" ADD CONSTRAINT "SaleInvoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseInvoice" ADD CONSTRAINT "PurchaseInvoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountTransfer" ADD CONSTRAINT "AccountTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseReturn" ADD CONSTRAINT "PurchaseReturn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
