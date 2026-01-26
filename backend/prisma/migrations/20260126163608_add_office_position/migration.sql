-- CreateEnum
CREATE TYPE "OfficePosition" AS ENUM ('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'JOINT_SECRETARY', 'TREASURER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "office_position" "OfficePosition";
