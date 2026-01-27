-- Migrate existing contribution data to new schema
-- For BASIC contributions: set liftPercentage from splitPercentage, aaPercentage = 100 - liftPercentage
-- For ADDITIONAL contributions: set percentages based on bucket (100% to one bucket)

-- First, migrate BASIC contributions
UPDATE "Contribution"
SET "lift_percentage" = "split_percentage",
    "aa_percentage" = 100 - COALESCE("split_percentage", 50),
    "bucket" = NULL
WHERE type = 'BASIC';

-- Then, migrate ADDITIONAL contributions
UPDATE "Contribution"
SET "lift_percentage" = 100,
    "aa_percentage" = 0,
    "bucket" = NULL
WHERE type = 'ADDITIONAL' AND bucket = 'LIFT';

UPDATE "Contribution"
SET "lift_percentage" = 0,
    "aa_percentage" = 100,
    "bucket" = NULL
WHERE type = 'ADDITIONAL' AND bucket = 'ALUMNI_ASSOCIATION';
