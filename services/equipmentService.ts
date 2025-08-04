import { Equipment, InventoryStatus } from '../types';

// Mock data
let mockEquipment: Equipment[] = [
  {
    id: '101',
    name: 'Ultrasound Machine',
    category: 'Equipment' as any,
    quantity: 1,
    minQuantity: 1,
    status: InventoryStatus.InStock,
    location: 'Sala de Terapia 1',
    serialNumber: 'SN12345',
    purchaseDate: '2023-01-15',
    warrantyExpires: '2025-01-15',
    lastMaintenanceDate: '2024-07-01',
    nextMaintenanceDate: '2025-01-01',
    condition: 'used',
  },
  {
    id: '102',
    name: 'Laser Therapy Unit',
    category: 'Equipment' as any,
    quantity: 1,
    minQuantity: 1,
    status: InventoryStatus.InMaintenance,
    location: 'Manutenção',
    serialNumber: 'SN67890',
    purchaseDate: '2022-05-20',
    warrantyExpires: '2024-05-20',
    lastMaintenanceDate: '2024-06-15',
    nextMaintenanceDate: '2024-12-15',
    condition: 'needs_repair',
  },
];

const ARTIFICIAL_DELAY = 500;

// --- Equipment Management ---

export const getEquipment = async (): Promise<Equipment[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  return mockEquipment;
};

export const addEquipment = async (equipment: Omit<Equipment, 'id'>): Promise<Equipment> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  const newEquipment: Equipment = {
    id: (mockEquipment.length + 200).toString(), // Avoid ID collision with inventory
    ...equipment,
  };
  mockEquipment.push(newEquipment);
  return newEquipment;
};

export const updateEquipment = async (equipment: Equipment): Promise<Equipment> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  const index = mockEquipment.findIndex(e => e.id === equipment.id);
  if (index !== -1) {
    mockEquipment[index] = equipment;
    return equipment;
  }
  throw new Error('Equipamento não encontrado');
};

export const scheduleMaintenance = async (equipmentId: string, maintenanceDate: string): Promise<Equipment> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  const equipment = mockEquipment.find(e => e.id === equipmentId);
  if (equipment) {
    equipment.nextMaintenanceDate = maintenanceDate;
    equipment.status = InventoryStatus.InMaintenance;
    return equipment;
  }
  throw new Error('Equipamento não encontrado');
};

// --- Maintenance and Warranty ---

export const getUpcomingMaintenance = async (): Promise<Equipment[]> => {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);

    return mockEquipment.filter(e => {
        if (!e.nextMaintenanceDate) return false;
        const maintenanceDate = new Date(e.nextMaintenanceDate);
        return maintenanceDate > today && maintenanceDate <= nextMonth;
    });
};

export const getExpiredWarranties = async (): Promise<Equipment[]> => {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
    const today = new Date();
    return mockEquipment.filter(e => {
        const warrantyDate = new Date(e.warrantyExpires);
        return warrantyDate < today;
    });
};

// --- Alert Integration ---

export const checkAndSendMaintenanceAlerts = async (): Promise<void> => {
    console.log("Verificando manutenções futuras...");
    const upcomingMaintenance = await getUpcomingMaintenance();
    if (upcomingMaintenance.length > 0) {
        console.log(`Alerta: ${upcomingMaintenance.length} equipamentos com manutenção próxima.`);
        // notificationService.sendAlert('Manutenção Próxima', ...);
    }
};

export const checkAndSendWarrantyAlerts = async (): Promise<void> => {
    console.log("Verificando garantias expiradas...");
    const expiredWarranties = await getExpiredWarranties();
    if (expiredWarranties.length > 0) {
        console.log(`Alerta: ${expiredWarranties.length} equipamentos com garantia expirada.`);
        // notificationService.sendAlert('Garantia Expirada', ...);
    }
};