
import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { patientService } from '../services/patientService';
import { Patient, SearchFilters } from '../types';

export const useAdvancedSearch = (initialFilters: Partial<SearchFilters>) => {
  const [filters, setFilters] = useState(initialFilters);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await patientService.searchPatients(debouncedFilters);
        setPatients(result.patients);
      } catch (e) {
        setError('Failed to fetch patients');
      }
      setLoading(false);
    };

    search();
  }, [debouncedFilters]);

  return { filters, setFilters, patients, loading, error };
};
