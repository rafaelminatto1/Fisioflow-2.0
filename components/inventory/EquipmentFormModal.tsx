import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Equipment } from '../../types';
import { equipmentSchema } from '../../schemas/inventorySchemas';

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Equipment, 'id'>) => void;
  defaultValues?: Equipment;
}

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({ isOpen, onClose, onSubmit, defaultValues }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<Omit<Equipment, 'id'>>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: defaultValues,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">{defaultValues ? 'Editar Equipamento' : 'Adicionar Equipamento'}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input {...register('name')} placeholder="Nome do Equipamento" className="p-2 border rounded" />
            {errors.name && <p className="text-red-500">{errors.name.message}</p>}

            <input {...register('serialNumber')} placeholder="Número de Série" className="p-2 border rounded" />
            {errors.serialNumber && <p className="text-red-500">{errors.serialNumber.message}</p>}

            <input {...register('purchaseDate')} type="date" placeholder="Data da Compra" className="p-2 border rounded" />
            {errors.purchaseDate && <p className="text-red-500">{errors.purchaseDate.message}</p>}

            <input {...register('warrantyExpires')} type="date" placeholder="Garantia Expira em" className="p-2 border rounded" />
            {errors.warrantyExpires && <p className="text-red-500">{errors.warrantyExpires.message}</p>}

            <select {...register('condition')} className="p-2 border rounded">
              <option value="new">Novo</option>
              <option value="used">Usado</option>
              <option value="needs_repair">Precisa de Reparo</option>
            </select>

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