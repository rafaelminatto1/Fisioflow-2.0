import React from 'react';
import { InventoryItem } from '../../types';

interface InventoryTableProps {
  items: InventoryItem[];
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ items }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Nome</th>
            <th className="py-2 px-4 border-b">Categoria</th>
            <th className="py-2 px-4 border-b">Quantidade</th>
            <th className="py-2 px-4 border-b">Status</th>
            <th className="py-2 px-4 border-b">Localização</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td className="py-2 px-4 border-b">{item.name}</td>
              <td className="py-2 px-4 border-b">{item.category}</td>
              <td className="py-2 px-4 border-b">{item.quantity}</td>
              <td className="py-2 px-4 border-b">{item.status}</td>
              <td className="py-2 px-4 border-b">{item.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};