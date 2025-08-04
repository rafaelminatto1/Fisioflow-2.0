import { InventoryItem, InventoryMovement, MovementType, InventoryStatus, InventoryCategory } from '../types';

// Mock data
let mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'TheraBand - Faixa Elástica (Média)',
    category: InventoryCategory.Consumable,
    quantity: 50,
    minQuantity: 10,
    status: InventoryStatus.InStock,
    location: 'Armário A, Prateleira 2',
    lastReorderDate: '2024-07-15',
  },
  {
    id: '2',
    name: 'Cama Elástica Profissional',
    category: InventoryCategory.Equipment,
    quantity: 2,
    minQuantity: 1,
    status: InventoryStatus.InStock,
    location: 'Sala de Exercícios 1',
  },
  {
    id: '3',
    name: 'Rolo de Liberação Miofascial',
    category: InventoryCategory.Consumable,
    quantity: 5,
    minQuantity: 5,
    status: InventoryStatus.LowStock,
    location: 'Armário B, Prateleira 1',
  },
];

let mockMovements: InventoryMovement[] = [];

const ARTIFICIAL_DELAY = 500;

// --- CRUD Operations ---

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  return mockInventory;
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  const newItem: InventoryItem = {
    id: (mockInventory.length + 1).toString(),
    ...item,
  };
  mockInventory.push(newItem);
  return newItem;
};

export const updateInventoryItem = async (item: InventoryItem): Promise<InventoryItem> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  const index = mockInventory.findIndex(i => i.id === item.id);
  if (index !== -1) {
    mockInventory[index] = item;
    return item;
  }
  throw new Error('Item não encontrado');
};

export const deleteInventoryItem = async (itemId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  mockInventory = mockInventory.filter(i => i.id !== itemId);
};

// --- Movement Tracking ---

export const registerMovement = async (movement: Omit<InventoryMovement, 'id'>): Promise<InventoryMovement> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  const item = mockInventory.find(i => i.id === movement.itemId);
  if (!item) {
    throw new Error('Item do inventário não encontrado para registrar a movimentação.');
  }

  // Update quantity
  if (movement.type === MovementType.Entry) {
    item.quantity += movement.quantity;
  } else if (movement.type === MovementType.Exit) {
    if (item.quantity < movement.quantity) {
      throw new Error('Quantidade insuficiente em estoque.');
    }
    item.quantity -= movement.quantity;
  }

  // Update status
  if (item.quantity <= 0) {
    item.status = InventoryStatus.OutOfStock;
  } else if (item.quantity <= item.minQuantity) {
    item.status = InventoryStatus.LowStock;
  } else {
    item.status = InventoryStatus.InStock;
  }

  const newMovement: InventoryMovement = {
    id: (mockMovements.length + 1).toString(),
    ...movement,
  };
  mockMovements.push(newMovement);
  
  return newMovement;
};

export const getMovementHistory = async (itemId: string): Promise<InventoryMovement[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  return mockMovements.filter(m => m.itemId === itemId);
};

export const getMovementsByItem = async (itemId: string): Promise<InventoryMovement[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  return mockMovements.filter(m => m.itemId === itemId);
};

// --- Stock Level Monitoring ---

export const checkStockLevels = async (): Promise<InventoryItem[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  mockInventory.forEach(item => {
    if (item.quantity <= 0) {
      item.status = InventoryStatus.OutOfStock;
    } else if (item.quantity <= item.minQuantity) {
      item.status = InventoryStatus.LowStock;
    } else {
      item.status = InventoryStatus.InStock;
    }
  });
  return mockInventory.filter(item => item.status === InventoryStatus.LowStock || item.status === InventoryStatus.OutOfStock);
};

export const getLowStockItems = async (): Promise<InventoryItem[]> => {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
    return mockInventory.filter(item => item.status === InventoryStatus.LowStock || item.status === InventoryStatus.OutOfStock);
};

// --- Alert Integration ---

export const checkAndSendLowStockAlerts = async (): Promise<void> => {
    console.log("Verificando itens com estoque baixo...");
    const lowStockItems = await getLowStockItems();
    if (lowStockItems.length > 0) {
        console.log(`Alerta: ${lowStockItems.length} itens com estoque baixo ou fora de estoque.`);
        // Here you would integrate with a real notification service
        // For example: notificationService.sendAlert('Estoque Baixo', `Existem ${lowStockItems.length} itens precisando de atenção.`);
    }
};