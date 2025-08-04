import { InventoryItem, InventoryMovement } from '../types';
import * as inventoryService from './inventoryService';

export const generateStockLevelReport = async (): Promise<any[]> => {
  const items = await inventoryService.getInventoryItems();
  return items.map(item => ({
    ID: item.id,
    Nome: item.name,
    Categoria: item.category,
    Quantidade: item.quantity,
    Status: item.status,
  }));
};

export const generateMovementReport = async (itemId: string): Promise<any[]> => {
  const movements = await inventoryService.getMovementHistory(itemId);
  return movements.map(movement => ({
    ID: movement.id,
    Tipo: movement.type,
    Quantidade: movement.quantity,
    Data: movement.date,
    Usuário: movement.userId,
  }));
};''