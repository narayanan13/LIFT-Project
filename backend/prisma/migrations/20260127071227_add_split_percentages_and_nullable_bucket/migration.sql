-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "aa_percentage" DOUBLE PRECISION,
ADD COLUMN     "lift_percentage" DOUBLE PRECISION,
ALTER COLUMN "bucket" DROP NOT NULL,
ALTER COLUMN "bucket" DROP DEFAULT;
