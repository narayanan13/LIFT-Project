import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Get all countries
router.get('/countries', async (req, res) => {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        iso2: true,
        iso3: true,
        phoneCode: true
      }
    });
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// Get states by country ID
router.get('/countries/:countryId/states', async (req, res) => {
  try {
    const countryId = parseInt(req.params.countryId);
    if (isNaN(countryId)) {
      return res.status(400).json({ error: 'Invalid country ID' });
    }

    const states = await prisma.state.findMany({
      where: { countryId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        iso2: true
      }
    });
    res.json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

// Get cities by state ID
router.get('/states/:stateId/cities', async (req, res) => {
  try {
    const stateId = parseInt(req.params.stateId);
    if (isNaN(stateId)) {
      return res.status(400).json({ error: 'Invalid state ID' });
    }

    const cities = await prisma.city.findMany({
      where: { stateId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true
      }
    });
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Search locations (for autocomplete)
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'city' } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const searchTerm = q.toLowerCase();
    let results = [];

    if (type === 'country') {
      results = await prisma.country.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        take: 20,
        orderBy: { name: 'asc' },
        select: { id: true, name: true, iso2: true }
      });
    } else if (type === 'state') {
      results = await prisma.state.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        take: 20,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          country: { select: { name: true } }
        }
      });
    } else {
      results = await prisma.city.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        take: 20,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          state: {
            select: {
              name: true,
              country: { select: { name: true } }
            }
          }
        }
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Error searching locations:', error);
    res.status(500).json({ error: 'Failed to search locations' });
  }
});

export default router;
