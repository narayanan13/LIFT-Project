-- CreateTable
CREATE TABLE "country" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "iso2" TEXT NOT NULL,
    "iso3" TEXT NOT NULL,
    "numeric_code" TEXT,
    "phone_code" TEXT,
    "capital" TEXT,
    "currency" TEXT,
    "region" TEXT,
    "subregion" TEXT,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "state" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "iso2" TEXT,
    "country_id" INTEGER NOT NULL,

    CONSTRAINT "state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "state_id" INTEGER NOT NULL,
    "country_id" INTEGER NOT NULL,
    "latitude" TEXT,
    "longitude" TEXT,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "country_iso2_key" ON "country"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "country_iso3_key" ON "country"("iso3");

-- CreateIndex
CREATE UNIQUE INDEX "state_country_id_name_key" ON "state"("country_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "city_state_id_name_key" ON "city"("state_id", "name");

-- AddForeignKey
ALTER TABLE "state" ADD CONSTRAINT "state_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city" ADD CONSTRAINT "city_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "state"("id") ON DELETE CASCADE ON UPDATE CASCADE;
