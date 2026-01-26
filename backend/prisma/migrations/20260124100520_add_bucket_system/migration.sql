-- CreateEnum
CREATE TYPE "Bucket" AS ENUM ('LIFT', 'ALUMNI_ASSOCIATION');

-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "aa_amount" DOUBLE PRECISION,
ADD COLUMN     "bucket" "Bucket" NOT NULL DEFAULT 'LIFT',
ADD COLUMN     "lift_amount" DOUBLE PRECISION,
ADD COLUMN     "split_percentage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "bucket" "Bucket" NOT NULL DEFAULT 'LIFT';

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");
