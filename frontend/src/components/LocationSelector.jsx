import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

// Normalize string for comparison (remove spaces, lowercase)
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\s+/g, '');
}

export default function LocationSelector({
  country,
  state,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
  disabled = false,
  className = ''
}) {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Selected IDs for cascading
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);

  // Track if we're initializing from props
  const initializedRef = useRef(false);
  const countryRef = useRef(country);
  const stateRef = useRef(state);
  const cityRef = useRef(city);

  // Fetch countries on mount
  useEffect(() => {
    async function fetchCountries() {
      try {
        setLoadingCountries(true);
        const res = await api.get('/locations/countries');
        setCountries(res.data);

        // If country name is provided, find matching country
        if (countryRef.current) {
          const matchedCountry = res.data.find(
            c => normalize(c.name) === normalize(countryRef.current)
          );
          if (matchedCountry) {
            setSelectedCountryId(matchedCountry.id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch countries:', err);
      } finally {
        setLoadingCountries(false);
      }
    }
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    async function fetchStates() {
      if (!selectedCountryId) {
        setStates([]);
        setSelectedStateId(null);
        setSelectedCityId(null);
        return;
      }

      try {
        setLoadingStates(true);
        const res = await api.get(`/locations/countries/${selectedCountryId}/states`);
        setStates(res.data);

        // If state name is provided and we're initializing, find matching state
        if (stateRef.current && !initializedRef.current) {
          const matchedState = res.data.find(
            s => normalize(s.name) === normalize(stateRef.current)
          );
          if (matchedState) {
            setSelectedStateId(matchedState.id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch states:', err);
      } finally {
        setLoadingStates(false);
      }
    }
    fetchStates();
  }, [selectedCountryId]);

  // Fetch cities when state changes
  useEffect(() => {
    async function fetchCities() {
      if (!selectedStateId) {
        setCities([]);
        setSelectedCityId(null);
        return;
      }

      try {
        setLoadingCities(true);
        const res = await api.get(`/locations/states/${selectedStateId}/cities`);
        setCities(res.data);

        // If city name is provided and we're initializing, find matching city
        if (cityRef.current && !initializedRef.current) {
          const matchedCity = res.data.find(
            c => normalize(c.name) === normalize(cityRef.current)
          );
          if (matchedCity) {
            setSelectedCityId(matchedCity.id);
            initializedRef.current = true; // Mark as initialized
          }
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      } finally {
        setLoadingCities(false);
      }
    }
    fetchCities();
  }, [selectedStateId]);

  // Reset initialization when props change significantly (e.g., opening edit modal)
  useEffect(() => {
    if (country !== countryRef.current || state !== stateRef.current || city !== cityRef.current) {
      countryRef.current = country;
      stateRef.current = state;
      cityRef.current = city;

      // If all values are cleared, reset the component
      if (!country && !state && !city) {
        initializedRef.current = false;
        setSelectedCountryId(null);
        setSelectedStateId(null);
        setSelectedCityId(null);
        setStates([]);
        setCities([]);
      } else if (country && countries.length > 0) {
        // Re-initialize with new values
        initializedRef.current = false;
        const matchedCountry = countries.find(
          c => normalize(c.name) === normalize(country)
        );
        if (matchedCountry && matchedCountry.id !== selectedCountryId) {
          setSelectedCountryId(matchedCountry.id);
        }
      }
    }
  }, [country, state, city, countries]);

  // When country is selected, try to find and select the state
  useEffect(() => {
    if (selectedCountryId && !initializedRef.current && states.length > 0 && stateRef.current) {
      const matchedState = states.find(
        s => normalize(s.name) === normalize(stateRef.current)
      );
      if (matchedState && matchedState.id !== selectedStateId) {
        setSelectedStateId(matchedState.id);
      }
    }
  }, [selectedCountryId, states, selectedStateId, state]);

  // When state is selected, try to find and select the city
  useEffect(() => {
    if (selectedStateId && !initializedRef.current && cities.length > 0 && cityRef.current) {
      const matchedCity = cities.find(
        c => normalize(c.name) === normalize(cityRef.current)
      );
      if (matchedCity && matchedCity.id !== selectedCityId) {
        setSelectedCityId(matchedCity.id);
      }
    }
  }, [selectedStateId, cities, selectedCityId, city]);

  // When modal opens and country is set, select the country
  useEffect(() => {
    if (country && !selectedCountryId && countries.length > 0) {
      const matchedCountry = countries.find(
        c => normalize(c.name) === normalize(country)
      );
      if (matchedCountry) {
        setSelectedCountryId(matchedCountry.id);
      }
    }
  }, [country, countries, selectedCountryId]);

  function handleCountryChange(e) {
    const countryId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedCountryId(countryId);
    setSelectedStateId(null);
    setSelectedCityId(null);
    setCities([]);
    initializedRef.current = true; // User made a selection

    const selectedCountry = countries.find(c => c.id === countryId);
    onCountryChange(selectedCountry?.name || '');
    onStateChange('');
    onCityChange('');
  }

  function handleStateChange(e) {
    const stateId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedStateId(stateId);
    setSelectedCityId(null);
    setCities([]);
    initializedRef.current = true; // User made a selection

    const selectedState = states.find(s => s.id === stateId);
    onStateChange(selectedState?.name || '');
    onCityChange('');
  }

  function handleCityChange(e) {
    const cityId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedCityId(cityId);

    const selectedCity = cities.find(c => c.id === cityId);
    onCityChange(selectedCity?.name || '');
  }

  const selectClass = "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-deep-red focus:border-transparent disabled:bg-gray-100";

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <select
          value={selectedCountryId || ''}
          onChange={handleCountryChange}
          disabled={disabled || loadingCountries}
          className={selectClass}
        >
          <option value="">
            {loadingCountries ? 'Loading countries...' : 'Select a country'}
          </option>
          {countries.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* State */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
        <select
          value={selectedStateId || ''}
          onChange={handleStateChange}
          disabled={disabled || !selectedCountryId || loadingStates}
          className={selectClass}
        >
          <option value="">
            {loadingStates
              ? 'Loading states...'
              : selectedCountryId
                ? (states.length > 0 ? 'Select a state' : 'No states available')
                : 'Select a country first'
            }
          </option>
          {states.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
        <select
          value={selectedCityId || ''}
          onChange={handleCityChange}
          disabled={disabled || !selectedStateId || loadingCities}
          className={selectClass}
        >
          <option value="">
            {loadingCities
              ? 'Loading cities...'
              : selectedStateId
                ? (cities.length > 0 ? 'Select a city' : 'No cities available')
                : 'Select a state first'
            }
          </option>
          {cities.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
