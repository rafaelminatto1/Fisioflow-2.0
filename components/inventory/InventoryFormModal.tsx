import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InventoryItem, InventoryCategory, InventoryStatus } from '../../types';
import { inventoryItemSchema } from '../../schemas/inventorySchemas';

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<InventoryItem, 'id'>) => void;
  defaultValues?: InventoryItem;
}

export const InventoryFormModal: React.FC<InventoryFormModalProps> = ({ isOpen, onClose, onSubmit, defaultValues }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<Omit<InventoryItem, 'id'>>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: defaultValues,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">{defaultValues ? 'Editar Item' : 'Adicionar Item'}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input {...register('name')} placeholder="Nome do Item" className="p-2 border rounded" />
            {errors.name && <p className="text-red-500">{errors.name.message}</p>}
            
            <select {...register('category')} className="p-2 border rounded">
              {Object.values(InventoryCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <input type="number" {...register('quantity', { valueAsNumber: true })} placeholder="Quantidade" className="p-2 border rounded" />
            {errors.quantity && <p className="text-red-500">{errors.quantity.message}</p>}

            <input type="number" {...register('minQuantity', { valueAsNumber: true })} placeholder="Quantidade Mínima" className="p-2 border rounded" />
            {errors.minQuantity && <p className="text-red-500">{errors.minQuantity.message}</p>}

            <select {...register('status')} className="p-2 border rounded">
              {Object.values(InventoryStatus).map(status => <option key={status} value={status}>{status}</option>)}
            </select>

            <input {...register('location')} placeholder="Localização" className="p-2 border rounded" />
            {errors.location && <p className="text-red-500">{errors.location.message}</p>}
          </div>
          <div className="flex justify-end mt-4">
            <button type="button" onClick={onClose} className="mr-2 bg-gray-300 px-4 py-2 rounded">Cancelar</button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};