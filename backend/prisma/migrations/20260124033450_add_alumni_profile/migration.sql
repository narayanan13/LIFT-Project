-- CreateTable
CREATE TABLE "alumni_profile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "contact_number" TEXT,
    "current_residence" TEXT,
    "profession" TEXT,
    "linkedin_profile" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_history" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "company_website" TEXT,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alumni_profile_user_id_key" ON "alumni_profile"("user_id");

-- AddForeignKey
ALTER TABLE "alumni_profile" ADD CONSTRAINT "alumni_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_history" ADD CONSTRAINT "job_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "alumni_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
