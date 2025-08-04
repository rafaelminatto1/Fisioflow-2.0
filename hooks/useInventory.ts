import { useState, useEffect, useMemo } from 'react';
import { InventoryItem } from '../types';
import * as inventoryService from '../services/inventoryService';

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await inventoryService.getInventoryItems();
        setItems(data);
      } catch (err) {
        setError('Falha ao carregar itens do inventário.');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(item => 
        categoryFilter === 'all' || item.category === categoryFilter
      );
  }, [items, searchTerm, categoryFilter]);

  return {
    items: filteredItems,
    loading,
    error,
    setSearchTerm,
    setCategoryFilter,
  };
};