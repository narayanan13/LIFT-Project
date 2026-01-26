import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function main() {
  console.log('Starting location data seed...');

  // Read the location data file
  const dataPath = path.join(__dirname, 'location-data.json');

  if (!fs.existsSync(dataPath)) {
    console.log('Data file not found. Downloading...');
    console.log('');
    console.log('Please download the data file first:');
    console.log('');
    console.log('  curl -sL "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries%2Bstates%2Bcities.json" -o prisma/location-data.json');
    console.log('');
    console.log('Then run this script again:');
    console.log('  node prisma/seed-location.js');
    process.exit(1);
  }

  console.log('Reading location data file...');
  const fileContent = fs.readFileSync(dataPath, 'utf8');
  const countriesData = JSON.parse(fileContent);

  console.log(`Found ${countriesData.length} countries to process`);

  // Clear existing data
  console.log('Clearing existing location data...');
  await prisma.city.deleteMany({});
  await prisma.state.deleteMany({});
  await prisma.country.deleteMany({});

  let countryCount = 0;
  let stateCount = 0;
  let cityCount = 0;
  let skippedCities = 0;

  // First pass: Insert all countries
  console.log('Inserting countries...');
  const countryInserts = countriesData.map(countryData => ({
    id: countryData.id,
    name: countryData.name,
    iso2: countryData.iso2,
    iso3: countryData.iso3,
    numericCode: countryData.numeric_code || null,
    phoneCode: countryData.phone_code || countryData.phonecode || null,
    capital: countryData.capital || null,
    currency: countryData.currency || null,
    region: countryData.region || null,
    subregion: countryData.subregion || null,
  }));

  await prisma.country.createMany({
    data: countryInserts,
    skipDuplicates: true,
  });
  countryCount = countryInserts.length;
  console.log(`Inserted ${countryCount} countries`);

  // Second pass: Insert all states and track valid state IDs
  console.log('Inserting states...');
  const validStateIds = new Set();

  for (const countryData of countriesData) {
    if (countryData.states && Array.isArray(countryData.states)) {
      const statesData = countryData.states.map(stateData => {
        validStateIds.add(stateData.id);
        return {
          id: stateData.id,
          name: stateData.name,
          iso2: stateData.state_code || stateData.iso2 || null,
          countryId: countryData.id,
        };
      });

      if (statesData.length > 0) {
        await prisma.state.createMany({
          data: statesData,
          skipDuplicates: true,
        });
        stateCount += statesData.length;
      }
    }
  }
  console.log(`Inserted ${stateCount} states`);

  // Third pass: Insert cities (only for valid states)
  console.log('Inserting cities...');
  for (const countryData of countriesData) {
    if (countryData.states && Array.isArray(countryData.states)) {
      for (const stateData of countryData.states) {
        if (stateData.cities && Array.isArray(stateData.cities)) {
          // Only include cities whose state exists
          const citiesData = stateData.cities
            .filter(cityData => validStateIds.has(stateData.id))
            .map(cityData => ({
              id: cityData.id,
              name: cityData.name,
              stateId: stateData.id,
              countryId: countryData.id,
              latitude: cityData.latitude || null,
              longitude: cityData.longitude || null,
            }));

          if (citiesData.length > 0) {
            try {
              await prisma.city.createMany({
                data: citiesData,
                skipDuplicates: true,
              });
              cityCount += citiesData.length;
            } catch (err) {
              // Skip on duplicate/constraint errors
              skippedCities += citiesData.length;
            }
          }
        }
      }
    }

    // Progress indicator
    if ((countryCount % 25 === 0) || countryCount === countriesData.length) {
      const processedCountries = countriesData.indexOf(countryData) + 1;
      if (processedCountries % 25 === 0) {
        console.log(`Progress: ${processedCountries}/${countriesData.length} countries, ${cityCount} cities...`);
      }
    }
  }

  console.log('');
  console.log('Seed completed successfully!');
  console.log(`  Countries: ${countryCount}`);
  console.log(`  States: ${stateCount}`);
  console.log(`  Cities: ${cityCount}`);
  if (skippedCities > 0) {
    console.log(`  Skipped cities (duplicates): ${skippedCities}`);
  }
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
