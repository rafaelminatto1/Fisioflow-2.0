import React from 'react';
import { useInventory } from '../../hooks/useInventory';

interface InventoryConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InventoryConsultationModal: React.FC<InventoryConsultationModalProps> = ({ isOpen, onClose }) => {
  const { items, loading, error, setSearchTerm } = useInventory();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg w-1/2">
        <h2 className="text-2xl font-bold mb-4">Consultar Inventário</h2>
        <input 
          type="text"
          placeholder="Pesquisar item..."
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded w-full mb-4"
        />
        {loading && <p>Carregando...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <ul>
          {!loading && !error && items.map(item => (
            <li key={item.id} className="flex justify-between items-center p-2 border-b">
              <span>{item.name}</span>
              <span>{item.quantity} em estoque</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-end mt-4">
          <button type="button" onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Fechar</button>
        </div>
      </div>
    </div>
  );
};