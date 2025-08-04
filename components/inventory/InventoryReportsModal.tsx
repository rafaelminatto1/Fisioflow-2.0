import React, { useState } from 'react';
import * as reportsService from '../../services/inventoryReportsService';

interface InventoryReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InventoryReportsModal: React.FC<InventoryReportsModalProps> = ({ isOpen, onClose }) => {
  const [reportData, setReportData] = useState<any[] | null>(null);

  const handleGenerateReport = async () => {
    const data = await reportsService.generateStockLevelReport();
    setReportData(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg w-1/2">
        <h2 className="text-2xl font-bold mb-4">Relatórios de Inventário</h2>
        <button onClick={handleGenerateReport} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
          Gerar Relatório de Nível de Estoque
        </button>
        {reportData && (
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(reportData, null, 2)}
          </pre>
        )}
        <div className="flex justify-end mt-4">
          <button type="button" onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Fechar</button>
        </div>
      </div>
    </div>
  );
};