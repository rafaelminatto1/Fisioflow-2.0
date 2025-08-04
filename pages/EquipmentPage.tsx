import React, { useState } from 'react';
import { useEquipment } from '../hooks/useEquipment';
import { EquipmentCard } from '../components/inventory/EquipmentCard';
import { EquipmentFormModal } from '../components/inventory/EquipmentFormModal';
import { Equipment } from '../types';

import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error}: {error: Error}) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  )
}

const EquipmentPage: React.FC = () => {
  const { equipment, loading, error } = useEquipment();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddEquipment = (data: Omit<Equipment, 'id'>) => {
    // Logic to add equipment will go here
    console.log(data);
    setIsModalOpen(false);
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Gestão de Equipamentos</h1>
        <div className="flex justify-end mb-4">
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 text-white px-4 py-2 rounded">Adicionar Equipamento</button>
        </div>
        {loading && <div className="flex justify-center items-center"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div></div>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {!loading && !error && equipment.map(e => <EquipmentCard key={e.id} equipment={e} />)}
        </div>
        <EquipmentFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddEquipment}
        />
      </div>
    </ErrorBoundary>
  );
};''

export default EquipmentPage;''