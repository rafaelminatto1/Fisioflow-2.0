import React from 'react';

interface InventoryStatsProps {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export const InventoryStats: React.FC<InventoryStatsProps> = ({ totalItems, lowStockItems, outOfStockItems }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="bg-white p-4 shadow rounded-lg">
        <h4 className="text-gray-500">Total de Itens</h4>
        <p className="text-2xl font-bold">{totalItems}</p>
      </div>
      <div className="bg-white p-4 shadow rounded-lg">
        <h4 className="text-gray-500">Itens com Estoque Baixo</h4>
        <p className="text-2xl font-bold text-yellow-500">{lowStockItems}</p>
      </div>
      <div className="bg-white p-4 shadow rounded-lg">
        <h4 className="text-gray-500">Itens Fora de Estoque</h4>
        <p className="text-2xl font-bold text-red-500">{outOfStockItems}</p>
      </div>
    </div>
  );
};