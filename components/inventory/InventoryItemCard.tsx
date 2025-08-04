import React from 'react';
import { InventoryItem, InventoryStatus } from '../../types';

interface InventoryItemCardProps {
  item: InventoryItem;
}

const getStatusClass = (status: InventoryStatus) => {
  switch (status) {
    case InventoryStatus.LowStock:
      return 'bg-yellow-100 text-yellow-800';
    case InventoryStatus.OutOfStock:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-green-100 text-green-800';
  }
};

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(item.status)}`}>
          {item.status}
        </span>
      </div>
      <p className="text-sm text-gray-500">{item.category}</p>
      <div className="mt-4">
        <p><strong>Quantidade:</strong> {item.quantity}</p>
        <p><strong>Mínimo:</strong> {item.minQuantity}</p>
        <p><strong>Local:</strong> {item.location}</p>
      </div>
    </div>
  );
};