import React, { useState, useEffect } from 'react';
import api from '../api';

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

  // Fetch countries on mount
  useEffect(() => {
    async function fetchCountries() {
      try {
        setLoadingCountries(true);
        const res = await api.get('/locations/countries');
        setCountries(res.data);

        // If country name is provided, find matching country
        if (country) {
          const matchedCountry = res.data.find(
            c => c.name.toLowerCase() === country.toLowerCase()
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
        return;
      }

      try {
        setLoadingStates(true);
        const res = await api.get(`/locations/countries/${selectedCountryId}/states`);
        setStates(res.data);

        // If state name is provided, find matching state
        if (state) {
          const matchedState = res.data.find(
            s => s.name.toLowerCase() === state.toLowerCase()
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
        return;
      }

      try {
        setLoadingCities(true);
        const res = await api.get(`/locations/states/${selectedStateId}/cities`);
        setCities(res.data);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      } finally {
        setLoadingCities(false);
      }
    }
    fetchCities();
  }, [selectedStateId]);

  function handleCountryChange(e) {
    const countryId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedCountryId(countryId);
    setSelectedStateId(null);
    setCities([]);

    const selectedCountry = countries.find(c => c.id === countryId);
    onCountryChange(selectedCountry?.name || '');
    onStateChange('');
    onCityChange('');
  }

  function handleStateChange(e) {
    const stateId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedStateId(stateId);
    setCities([]);

    const selectedState = states.find(s => s.id === stateId);
    onStateChange(selectedState?.name || '');
    onCityChange('');
  }

  function handleCityChange(e) {
    const cityId = e.target.value ? parseInt(e.target.value) : null;
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
          value={cities.find(c => c.name === city)?.id || ''}
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
