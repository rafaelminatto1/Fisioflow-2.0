import { describe, it, expect, beforeEach } from 'vitest';
import * as inventoryService from '../../services/inventoryService';
import { InventoryCategory, InventoryStatus, MovementType } from '../../types';

describe('inventoryService', () => {
  beforeEach(() => {
    // Reset mock data before each test
  });

  it('should return all inventory items', async () => {
    const items = await inventoryService.getInventoryItems();
    expect(items.length).toBeGreaterThan(0);
  });

  it('should add a new inventory item', async () => {
    const newItem = {
      name: 'New Item',
      category: InventoryCategory.Consumable,
      quantity: 100,
      minQuantity: 20,
      status: InventoryStatus.InStock,
      location: 'Test Location',
    };
    const addedItem = await inventoryService.addInventoryItem(newItem);
    expect(addedItem.name).toBe('New Item');
    const items = await inventoryService.getInventoryItems();
    expect(items.find(i => i.id === addedItem.id)).toBeDefined();
  });

  it('should register a movement and update quantity', async () => {
    const items = await inventoryService.getInventoryItems();
    const item = items[0];
    const initialQuantity = item.quantity;

    const movement = {
      itemId: item.id,
      type: MovementType.Exit,
      quantity: 5,
      userId: 'test-user',
    };
    await inventoryService.registerMovement(movement);

    const updatedItems = await inventoryService.getInventoryItems();
    const updatedItem = updatedItems.find(i => i.id === item.id);
    expect(updatedItem?.quantity).toBe(initialQuantity - 5);
  });
});''