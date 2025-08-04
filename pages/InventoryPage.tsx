import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { InventoryTable } from '../components/inventory/InventoryTable';
import { InventoryFormModal } from '../components/inventory/InventoryFormModal';
import { InventoryStats } from '../components/inventory/InventoryStats';
import { InventoryItem, InventoryStatus } from '../types';
import { InventoryReportsModal } from '../components/inventory/InventoryReportsModal';

import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error}: {error: Error}) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  )
}

const InventoryPage: React.FC = () => {
  const { items, loading, error, setSearchTerm, setCategoryFilter } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  const handleAddItem = (data: Omit<InventoryItem, 'id'>) => {
    // Logic to add item will go here
    console.log(data);
    setIsModalOpen(false);
  };

  const stats = {
    totalItems: items.length,
    lowStockItems: items.filter(i => i.status === InventoryStatus.LowStock).length,
    outOfStockItems: items.filter(i => i.status === InventoryStatus.OutOfStock).length,
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Gestão de Inventário</h1>
        <InventoryStats {...stats} />
        <div className="flex justify-between mb-4">
          <input 
            type="text"
            placeholder="Pesquisar..."
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded"
          />
          <div>
            <button onClick={() => setIsReportsModalOpen(true)} className="bg-green-500 text-white px-4 py-2 rounded mr-2">Relatórios</button>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 text-white px-4 py-2 rounded">Adicionar Item</button>
          </div>
        </div>
        {loading && <div className="flex justify-center items-center"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div></div>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && <InventoryTable items={items} />}
        <InventoryFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddItem}
        />
        <InventoryReportsModal 
          isOpen={isReportsModalOpen}
          onClose={() => setIsReportsModalOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
};''

export default InventoryPage;''