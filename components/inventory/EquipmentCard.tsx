import React from 'react';
import { Equipment } from '../../types';

interface EquipmentCardProps {
  equipment: Equipment;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h3 className="text-lg font-semibold">{equipment.name}</h3>
      <p className="text-sm text-gray-500">{equipment.serialNumber}</p>
      <div className="mt-4">
        <p><strong>Condição:</strong> {equipment.condition}</p>
        <p><strong>Garantia até:</strong> {equipment.warrantyExpires}</p>
        <p><strong>Próxima Manutenção:</strong> {equipment.nextMaintenanceDate}</p>
      </div>
    </div>
  );
};