-- AlterTable
ALTER TABLE "alumni_profile" ADD COLUMN "address_line" TEXT;
ALTER TABLE "alumni_profile" ADD COLUMN "area" TEXT;
ALTER TABLE "alumni_profile" ADD COLUMN "city" TEXT;
ALTER TABLE "alumni_profile" ADD COLUMN "state" TEXT;
ALTER TABLE "alumni_profile" ADD COLUMN "country" TEXT;
ALTER TABLE "alumni_profile" ADD COLUMN "share_address" BOOLEAN NOT NULL DEFAULT true;

-- Drop the old current_residence column
ALTER TABLE "alumni_profile" DROP COLUMN "current_residence";
