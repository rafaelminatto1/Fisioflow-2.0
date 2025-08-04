import { z } from 'zod';
import { InventoryCategory, InventoryStatus, MovementType } from '../types';

export const inventoryItemSchema = z.object({
  name: z.string().min(3, 'O nome do item deve ter pelo menos 3 caracteres.'),
  category: z.nativeEnum(InventoryCategory),
  quantity: z.number().min(0, 'A quantidade não pode ser negativa.'),
  minQuantity: z.number().min(0, 'A quantidade mínima não pode ser negativa.'),
  status: z.nativeEnum(InventoryStatus),
  supplier: z.string().optional(),
  lastReorderDate: z.string().optional(),
  location: z.string().min(2, 'A localização deve ter pelo menos 2 caracteres.'),
});

export const equipmentSchema = inventoryItemSchema.extend({
  serialNumber: z.string().min(1, 'O número de série é obrigatório.'),
  purchaseDate: z.string(),
  warrantyExpires: z.string(),
  lastMaintenanceDate: z.string().optional(),
  nextMaintenanceDate: z.string().optional(),
  maintenanceCost: z.number().optional(),
  condition: z.enum(['new', 'used', 'needs_repair']),
});

export const inventoryMovementSchema = z.object({
  itemId: z.string(),
  type: z.nativeEnum(MovementType),
  quantity: z.number().min(1, 'A quantidade deve ser maior que zero.'),
  date: z.string(),
  userId: z.string(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});