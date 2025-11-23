/*
  Warnings:

  - Added the required column `purpose` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "event" TEXT,
ADD COLUMN     "purpose" TEXT NOT NULL;
