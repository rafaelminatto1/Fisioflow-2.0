# Design Document

## Overview

O sistema de gestão de estoque e equipamentos será implementado seguindo a arquitetura existente do Fisioflow 2.0, utilizando React com TypeScript, serviços mock com delays simulados, e integração com o sistema de notificações existente. O sistema permitirá controle completo do inventário da clínica, desde materiais de consumo até equipamentos médicos, com alertas automáticos e relatórios detalhados.

## Architecture

### Component Architecture
```
InventoryPage (Main container)
├── InventoryHeader (Search, filters, add button)
├── InventoryStats (Dashboard cards with key metrics)
├── InventoryTable (Main data grid)
│   ├── InventoryItemRow (Individual item display)
│   └── InventoryActions (Quick actions per item)
├── InventoryFormModal (Add/Edit items)
├── MovementModal (Register entries/exits)
└── InventoryReportsModal (Generate reports)

EquipmentPage (Equipment-specific management)
├── EquipmentHeader
├── EquipmentGrid (Card-based layout for equipment)
│   └── EquipmentCard (Individual equipment with status)
├── EquipmentFormModal (Equipment-specific fields)
└── MaintenanceModal (Maintenance scheduling)
```

### Service Layer Architecture
```
inventoryService.ts
├── Item Management (CRUD operations)
├── Movement Tracking (entries/exits)
├── Stock Level Monitoring
└── Report Generation

equipmentService.ts
├── Equipment-specific operations
├── Maintenance scheduling
├── Warranty tracking
└── Asset management

stockAlertService.ts
├── Automatic alert generation
├── Notification integration
└── Alert management
```

## Components and Interfaces

### Core Data Models

#### InventoryItem Interface
```typescript
interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: InventoryCategory;
  currentQuantity: number;
  minimumQuantity: number;
  unit: string; // 'unidade', 'caixa', 'litro', etc.
  status: InventoryStatus;
  location?: string;
  supplier?: string;
  lastUpdated: string;
  createdAt: string;
  createdBy: string;
  cost?: number;
  barcode?: string;
}

enum InventoryCategory {
  EQUIPMENT = 'Equipamentos',
  CONSUMABLES = 'Materiais de Consumo',
  MEDICATIONS = 'Medicamentos',
  CLEANING = 'Produtos de Limpeza',
  OFFICE = 'Material de Escritório',
  OTHER = 'Outros'
}

enum InventoryStatus {
  AVAILABLE = 'Disponível',
  LOW_STOCK = 'Estoque Baixo',
  OUT_OF_STOCK = 'Sem Estoque',
  DISCONTINUED = 'Descontinuado'
}
```

#### Equipment Interface (extends InventoryItem)
```typescript
interface Equipment extends InventoryItem {
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  purchaseDate?: string;
  purchaseValue?: number;
  warrantyExpiration?: string;
  maintenanceSchedule?: MaintenanceSchedule[];
  condition: EquipmentCondition;
  isActive: boolean;
}

interface MaintenanceSchedule {
  id: string;
  equipmentId: string;
  type: 'Preventiva' | 'Corretiva' | 'Calibração';
  scheduledDate: string;
  completedDate?: string;
  description: string;
  cost?: number;
  technician?: string;
  status: 'Agendada' | 'Concluída' | 'Cancelada';
}

enum EquipmentCondition {
  EXCELLENT = 'Excelente',
  GOOD = 'Bom',
  FAIR = 'Regular',
  POOR = 'Ruim',
  OUT_OF_ORDER = 'Fora de Uso'
}
```

#### Movement Interface
```typescript
interface InventoryMovement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  notes?: string;
  date: string;
  userId: string;
  userName: string;
  reference?: string; // Purchase order, patient ID, etc.
}

enum MovementType {
  ENTRY = 'Entrada',
  EXIT = 'Saída',
  ADJUSTMENT = 'Ajuste',
  TRANSFER = 'Transferência',
  LOSS = 'Perda',
  RETURN = 'Devolução'
}
```

### Component Specifications

#### InventoryPage Component
- **Purpose**: Main inventory management interface
- **Features**: 
  - Real-time stock levels display
  - Advanced filtering and search
  - Bulk operations support
  - Export functionality
- **State Management**: Custom hook `useInventory`
- **Integration**: Notification system for alerts

#### InventoryFormModal Component
- **Purpose**: Add/edit inventory items
- **Validation**: React Hook Form + Zod schemas
- **Features**:
  - Category-specific field rendering
  - Barcode scanning integration (future)
  - Supplier management
  - Cost tracking

#### MovementModal Component
- **Purpose**: Register inventory movements
- **Features**:
  - Quick entry/exit registration
  - Reason code selection
  - Batch processing for multiple items
  - Integration with patient records for usage tracking

#### EquipmentCard Component
- **Purpose**: Visual representation of equipment status
- **Features**:
  - Status indicators (operational, maintenance, etc.)
  - Warranty expiration alerts
  - Quick maintenance scheduling
  - Asset photo display

## Data Models

### Database Schema (Mock Implementation)

```typescript
// Mock data structure for inventory items
const mockInventoryItems: InventoryItem[] = [
  {
    id: 'inv-001',
    name: 'Ultrassom Terapêutico',
    category: InventoryCategory.EQUIPMENT,
    currentQuantity: 2,
    minimumQuantity: 1,
    unit: 'unidade',
    status: InventoryStatus.AVAILABLE,
    location: 'Sala 1',
    supplier: 'Ibramed',
    cost: 15000,
    // ... other fields
  }
];

// Mock data for movements
const mockMovements: InventoryMovement[] = [
  {
    id: 'mov-001',
    itemId: 'inv-001',
    type: MovementType.ENTRY,
    quantity: 1,
    previousQuantity: 1,
    newQuantity: 2,
    reason: 'Compra',
    date: '2024-01-15T10:00:00Z',
    userId: 'user-001',
    userName: 'Dr. Silva'
  }
];
```

### Service Integration Points

#### Notification Service Integration
```typescript
// Integration with existing notification system
const checkStockLevels = async (): Promise<void> => {
  const lowStockItems = await inventoryService.getLowStockItems();
  
  for (const item of lowStockItems) {
    await notificationService.sendNotification(
      'manager-user-id',
      `Item "${item.name}" está com estoque baixo (${item.currentQuantity} ${item.unit})`,
      'stock-alert'
    );
  }
};
```

#### Analytics Integration
```typescript
// Integration with analytics for reporting
const generateInventoryReport = async (filters: ReportFilters): Promise<InventoryReport> => {
  const movements = await inventoryService.getMovements(filters);
  const items = await inventoryService.getItems(filters);
  
  return {
    totalValue: calculateTotalValue(items),
    movementSummary: summarizeMovements(movements),
    lowStockAlerts: items.filter(item => item.status === InventoryStatus.LOW_STOCK),
    topConsumedItems: getTopConsumedItems(movements)
  };
};
```

## Error Handling

### Service Layer Error Handling
```typescript
export const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'lastUpdated'>): Promise<InventoryItem> => {
  try {
    await delay(400);
    
    // Validation
    if (!itemData.name || !itemData.category) {
      throw new Error('Nome e categoria são obrigatórios');
    }
    
    if (itemData.minimumQuantity < 0) {
      throw new Error('Quantidade mínima não pode ser negativa');
    }
    
    const newItem: InventoryItem = {
      ...itemData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: itemData.currentQuantity <= itemData.minimumQuantity 
        ? InventoryStatus.LOW_STOCK 
        : InventoryStatus.AVAILABLE
    };
    
    mockInventoryItems.push(newItem);
    
    // Check if stock alert is needed
    if (newItem.status === InventoryStatus.LOW_STOCK) {
      await stockAlertService.createAlert(newItem);
    }
    
    return newItem;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Erro ao adicionar item: ${error.message}`);
    }
    throw new Error('Erro desconhecido ao adicionar item');
  }
};
```

### Component Error Boundaries
- Wrap inventory components in ErrorBoundary
- Display user-friendly error messages
- Provide retry mechanisms for failed operations
- Log errors for debugging

## Testing Strategy

### Unit Tests
```typescript
// inventoryService.test.ts
describe('InventoryService', () => {
  test('should add inventory item successfully', async () => {
    const itemData = {
      name: 'Test Item',
      category: InventoryCategory.CONSUMABLES,
      currentQuantity: 10,
      minimumQuantity: 5,
      unit: 'unidade'
    };
    
    const result = await inventoryService.addInventoryItem(itemData);
    
    expect(result).toHaveProperty('id');
    expect(result.name).toBe(itemData.name);
    expect(result.status).toBe(InventoryStatus.AVAILABLE);
  });
  
  test('should create low stock alert when quantity is below minimum', async () => {
    const itemData = {
      name: 'Low Stock Item',
      category: InventoryCategory.CONSUMABLES,
      currentQuantity: 2,
      minimumQuantity: 5,
      unit: 'unidade'
    };
    
    const result = await inventoryService.addInventoryItem(itemData);
    
    expect(result.status).toBe(InventoryStatus.LOW_STOCK);
  });
});
```

### Integration Tests
```typescript
// InventoryPage.test.tsx
describe('InventoryPage', () => {
  test('should display inventory items', async () => {
    render(<InventoryPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Ultrassom Terapêutico')).toBeInTheDocument();
    });
  });
  
  test('should open add item modal when button is clicked', async () => {
    render(<InventoryPage />);
    
    const addButton = screen.getByText('Adicionar Item');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Novo Item do Estoque')).toBeInTheDocument();
  });
});
```

### E2E Tests
- Complete inventory management workflow
- Stock alert generation and notification
- Report generation and export
- Equipment maintenance scheduling

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Load inventory data on demand
2. **Pagination**: Implement server-side pagination for large inventories
3. **Caching**: Cache frequently accessed items and categories
4. **Debounced Search**: Prevent excessive API calls during search
5. **Virtual Scrolling**: For large item lists

### Monitoring
- Track inventory operation response times
- Monitor stock alert generation performance
- Log slow queries and operations
- Implement performance metrics dashboard

## Security Considerations

### Access Control
- Role-based permissions for inventory operations
- Audit logging for all inventory changes
- Secure handling of cost and financial data
- LGPD compliance for supplier information

### Data Validation
- Server-side validation for all inputs
- Sanitization of user-provided data
- Prevention of SQL injection (when moving to real database)
- Rate limiting for API endpoints

## Integration Points

### Existing System Integration
1. **Notification System**: Stock alerts and maintenance reminders
2. **User Management**: Role-based access control
3. **Analytics**: Inventory reports and dashboards
4. **Audit System**: Track all inventory operations
5. **Patient System**: Link material usage to patient treatments

### Future Integrations
1. **Barcode Scanning**: Mobile app integration
2. **Supplier APIs**: Automated ordering and price updates
3. **Accounting System**: Cost tracking and financial reporting
4. **IoT Sensors**: Automated stock level monitoring
5. **Mobile App**: Field inventory management