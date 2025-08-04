import { useState, useCallback } from 'react';
import { InventoryMovement } from '../types';
import * as inventoryService from '../services/inventoryService';

export const useInventoryMovements = (itemId: string) => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getMovementHistory(itemId);
      setMovements(data);
    } catch (err) {
      setError('Falha ao carregar o histórico de movimentações.');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  const registerMovement = async (movement: Omit<InventoryMovement, 'id'>) => {
    try {
      setLoading(true);
      await inventoryService.registerMovement(movement);
      fetchMovements(); // Refresh the list
    } catch (err) {
      setError('Falha ao registrar a movimentação.');
    } finally {
      setLoading(false);
    }
  };

  return {
    movements,
    loading,
    error,
    fetchMovements,
    registerMovement,
  };
};