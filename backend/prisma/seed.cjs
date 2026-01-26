const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seed() {
  const dataDir = path.join(__dirname, 'seed-data');

  // Check if seed data exists
  if (!fs.existsSync(path.join(dataDir, 'countries.json'))) {
    console.error('Seed data not found in prisma/seed-data/');
    console.error('Run the export script locally first.');
    process.exit(1);
  }

  // Check if data already exists
  const existingCountries = await prisma.country.count();
  if (existingCountries > 0) {
    console.log('Location data already exists (' + existingCountries + ' countries). Skipping seed.');
    await prisma.$disconnect();
    return;
  }

  console.log('Seeding location data...');

  // Import countries
  console.log('Importing countries...');
  const countries = JSON.parse(fs.readFileSync(path.join(dataDir, 'countries.json'), 'utf8'));
  await prisma.country.createMany({ data: countries, skipDuplicates: true });
  console.log('Imported', countries.length, 'countries');

  // Import states in batches (to avoid memory issues)
  console.log('Importing states...');
  const states = JSON.parse(fs.readFileSync(path.join(dataDir, 'states.json'), 'utf8'));
  const stateBatchSize = 1000;
  for (let i = 0; i < states.length; i += stateBatchSize) {
    const batch = states.slice(i, i + stateBatchSize);
    await prisma.state.createMany({ data: batch, skipDuplicates: true });
    process.stdout.write('\rImported ' + Math.min(i + stateBatchSize, states.length) + ' / ' + states.length + ' states');
  }
  console.log('');

  // Import cities in batches
  console.log('Importing cities...');
  const cities = JSON.parse(fs.readFileSync(path.join(dataDir, 'cities.json'), 'utf8'));
  const cityBatchSize = 5000;
  for (let i = 0; i < cities.length; i += cityBatchSize) {
    const batch = cities.slice(i, i + cityBatchSize);
    await prisma.city.createMany({ data: batch, skipDuplicates: true });
    process.stdout.write('\rImported ' + Math.min(i + cityBatchSize, cities.length) + ' / ' + cities.length + ' cities');
  }
  console.log('');

  console.log('Seeding complete!');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('Seed error:', e);
  prisma.$disconnect();
  process.exit(1);
});
