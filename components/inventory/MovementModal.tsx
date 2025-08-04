import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InventoryMovement, MovementType } from '../../types';
import { inventoryMovementSchema } from '../../schemas/inventorySchemas';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<InventoryMovement, 'id'>) => void;
  itemId: string;
}

export const MovementModal: React.FC<MovementModalProps> = ({ isOpen, onClose, onSubmit, itemId }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<Omit<InventoryMovement, 'id'>>({
    resolver: zodResolver(inventoryMovementSchema),
    defaultValues: { itemId },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Registrar Movimentação</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-4">
            <select {...register('type')} className="p-2 border rounded">
              {Object.values(MovementType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>

            <input type="number" {...register('quantity', { valueAsNumber: true })} placeholder="Quantidade" className="p-2 border rounded" />
            {errors.quantity && <p className="text-red-500">{errors.quantity.message}</p>}

            <textarea {...register('reason')} placeholder="Motivo" className="p-2 border rounded"></textarea>
          </div>
          <div className="flex justify-end mt-4">
            <button type="button" onClick={onClose} className="mr-2 bg-gray-300 px-4 py-2 rounded">Cancelar</button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  );
};