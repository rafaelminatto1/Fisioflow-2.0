import { useState, useEffect } from 'react';
import { Equipment } from '../types';
import * as equipmentService from '../services/equipmentService';

export const useEquipment = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const data = await equipmentService.getEquipment();
        setEquipment(data);
      } catch (err) {
        setError('Falha ao carregar equipamentos.');
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, []);

  return {
    equipment,
    loading,
    error,
  };
};