-- CreateEnum
CREATE TYPE "ContributionType" AS ENUM ('BASIC', 'ADDITIONAL');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "type" "ContributionType" NOT NULL DEFAULT 'ADDITIONAL';

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submitted_by" TEXT,
ADD COLUMN     "vendor" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "basic_contribution_amount" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "basic_contribution_payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),
    "paid_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "basic_contribution_payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "basic_contribution_payment_userId_year_month_key" ON "basic_contribution_payment"("userId", "year", "month");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basic_contribution_payment" ADD CONSTRAINT "basic_contribution_payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
