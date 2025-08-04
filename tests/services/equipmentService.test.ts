import { describe, it, expect, beforeEach } from 'vitest';
import * as equipmentService from '../../services/equipmentService';

describe('equipmentService', () => {
  beforeEach(() => {
    // Reset mock data before each test
  });

  it('should return all equipment', async () => {
    const equipment = await equipmentService.getEquipment();
    expect(equipment.length).toBeGreaterThan(0);
  });

  it('should schedule maintenance for an equipment', async () => {
    const equipmentList = await equipmentService.getEquipment();
    const equipment = equipmentList[0];
    const newMaintenanceDate = '2025-12-31';

    const updatedEquipment = await equipmentService.scheduleMaintenance(equipment.id, newMaintenanceDate);
    expect(updatedEquipment.nextMaintenanceDate).toBe(newMaintenanceDate);
  });
});''