# Design Document - Gestão de Pacientes (Melhorias)

## Overview

Este documento detalha o design técnico para as melhorias da funcionalidade de Gestão de Pacientes do FisioFlow. O foco está em aprimorar a experiência do usuário através de funcionalidades avançadas de busca, analytics, gestão de documentos e compliance LGPD, mantendo a arquitetura existente e adicionando novos componentes modulares.

## Architecture

### Current Architecture Enhancement
A arquitetura atual será estendida com novos serviços e componentes:

```
Frontend (React + TypeScript)
├── pages/
│   ├── PatientListPage.tsx (enhanced)
│   ├── PatientDetailPage.tsx (enhanced)
│   └── PatientAnalyticsPage.tsx (new)
├── components/
│   ├── patient/
│   │   ├── AdvancedSearchPanel.tsx (new)
│   │   ├── PatientImportModal.tsx (new)
│   │   ├── DocumentManager.tsx (enhanced)
│   │   ├── MetricsDashboard.tsx (enhanced)
│   │   └── CompliancePanel.tsx (new)
├── services/
│   ├── patientService.ts (enhanced)
│   ├── searchService.ts (new)
│   ├── analyticsService.ts (new)
│   ├── documentService.ts (enhanced)
│   └── complianceService.ts (new)
└── hooks/
    ├── useAdvancedSearch.ts (new)
    ├── usePatientAnalytics.ts (new)
    └── useComplianceTracking.ts (new)
```

### New Service Layer Components

#### SearchService
- Advanced filtering and search capabilities
- Saved search management
- Intelligent suggestions
- Full-text search in documents

#### AnalyticsService
- Patient segmentation and demographics
- Predictive analytics for demand forecasting
- Retention and churn analysis
- Performance metrics calculation

#### ComplianceService
- LGPD audit trail management
- Data access logging
- Consent management
- Right to be forgotten implementation

## Components and Interfaces

### 1. Advanced Search Panel

**Component:** `AdvancedSearchPanel.tsx`

```typescript
interface AdvancedSearchProps {
  onSearchChange: (filters: SearchFilters) => void;
  savedSearches: SavedSearch[];
  onSaveSearch: (search: SavedSearch) => void;
}

interface SearchFilters {
  text: string;
  status: PatientStatus[];
  ageRange: [number, number];
  registrationDateRange: [Date, Date];
  lastVisitRange: [Date, Date];
  therapistIds: string[];
  hasConditions: string[];
  hasSurgeries: boolean;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
  userId: string;
}
```

**Features:**
- Multi-criteria filtering with real-time results
- Visual filter chips with individual removal
- Saved searches with custom names
- Search suggestions based on typing patterns
- Export filtered results functionality

### 2. Patient Import/Export Modal

**Component:** `PatientImportModal.tsx`

```typescript
interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (results: ImportResults) => void;
}

interface ImportResults {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  duplicatesFound: number;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
  value: string;
}
```

**Features:**
- CSV/Excel file upload with validation
- Template download for correct format
- Real-time validation feedback
- Duplicate detection and resolution
- Detailed error reporting
- Batch processing with progress indicator

### 3. Enhanced Document Manager

**Component:** `DocumentManager.tsx`

```typescript
interface DocumentManagerProps {
  patientId: string;
  documents: PatientDocument[];
  onDocumentUpdate: (documents: PatientDocument[]) => void;
}

interface PatientDocument extends PatientAttachment {
  category: DocumentCategory;
  tags: string[];
  annotations: Annotation[];
  version: number;
  extractedText?: string;
  shareLinks: ShareLink[];
}

interface DocumentCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Annotation {
  id: string;
  userId: string;
  text: string;
  position: { x: number; y: number };
  createdAt: Date;
}

interface ShareLink {
  id: string;
  url: string;
  expiresAt: Date;
  accessCount: number;
  maxAccess: number;
}
```

**Features:**
- Drag-and-drop categorization
- Full-text search within documents
- Annotation and markup tools
- Version control with diff view
- Temporary sharing links
- Folder organization system

### 4. Metrics Dashboard

**Component:** `MetricsDashboard.tsx`

```typescript
interface MetricsDashboardProps {
  patientId: string;
  metrics: TrackedMetric[];
  onMetricsUpdate: (metrics: TrackedMetric[]) => void;
}

interface EnhancedMetric extends TrackedMetric {
  template?: MetricTemplate;
  predictions: MetricPrediction[];
  alerts: MetricAlert[];
  correlations: MetricCorrelation[];
}

interface MetricTemplate {
  id: string;
  name: string;
  specialty: string;
  defaultUnit: string;
  normalRanges: { min: number; max: number; ageGroup: string }[];
  alertThresholds: { value: number; severity: 'low' | 'medium' | 'high' }[];
}

interface MetricPrediction {
  date: Date;
  predictedValue: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface MetricAlert {
  id: string;
  type: 'threshold' | 'trend' | 'anomaly';
  severity: 'low' | 'medium' | 'high';
  message: string;
  triggeredAt: Date;
  acknowledged: boolean;
}
```

**Features:**
- Specialty-specific metric templates
- Predictive trend analysis
- Automated alert system
- Correlation detection between metrics
- Customizable dashboard widgets
- Statistical analysis tools

### 5. Compliance Panel

**Component:** `CompliancePanel.tsx`

```typescript
interface CompliancePanelProps {
  patientId: string;
  auditLogs: AuditLog[];
  consentStatus: ConsentStatus;
  onConsentUpdate: (consent: ConsentStatus) => void;
}

interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: 'patient' | 'document' | 'metric' | 'note';
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

interface ConsentStatus {
  dataProcessing: ConsentRecord;
  dataSharing: ConsentRecord;
  marketing: ConsentRecord;
  research: ConsentRecord;
}

interface ConsentRecord {
  granted: boolean;
  grantedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  version: string;
}
```

**Features:**
- Complete audit trail visualization
- Consent management interface
- Data access logging
- LGPD compliance reports
- Right to be forgotten workflow
- Security alert monitoring

## Data Models

### Enhanced Patient Model

```typescript
interface EnhancedPatient extends Patient {
  // Analytics fields
  riskScore: number;
  engagementLevel: 'low' | 'medium' | 'high';
  predictedChurn: number;
  lifetimeValue: number;
  
  // Compliance fields
  consentStatus: ConsentStatus;
  dataRetentionPolicy: DataRetentionPolicy;
  lastAuditDate: Date;
  
  // Enhanced tracking
  tags: PatientTag[];
  customFields: CustomField[];
  preferences: PatientPreferences;
}

interface PatientTag {
  id: string;
  name: string;
  color: string;
  category: string;
}

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  value: any;
  required: boolean;
}

interface PatientPreferences {
  communicationChannel: 'email' | 'sms' | 'whatsapp';
  appointmentReminders: boolean;
  marketingEmails: boolean;
  dataSharing: boolean;
}
```

### Search and Analytics Models

```typescript
interface SearchIndex {
  patientId: string;
  searchableText: string;
  tags: string[];
  lastUpdated: Date;
  documentContent: string[];
}

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  trend: number;
  period: 'day' | 'week' | 'month' | 'year';
  calculatedAt: Date;
  filters?: Record<string, any>;
}

interface PatientSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  patientCount: number;
  lastUpdated: Date;
}

interface SegmentCriteria {
  ageRange?: [number, number];
  conditions?: string[];
  treatmentDuration?: [number, number];
  engagementLevel?: string[];
  customFilters?: Record<string, any>;
}
```

## Error Handling

### Enhanced Error Management

```typescript
interface PatientManagementError extends Error {
  code: string;
  category: 'validation' | 'permission' | 'system' | 'compliance';
  details?: Record<string, any>;
  userMessage: string;
  technicalMessage: string;
}

// Error categories and handling
const ErrorHandlers = {
  DUPLICATE_PATIENT: (error: PatientManagementError) => ({
    message: 'Paciente já cadastrado. Deseja visualizar o cadastro existente?',
    actions: ['view_existing', 'force_create', 'cancel']
  }),
  
  COMPLIANCE_VIOLATION: (error: PatientManagementError) => ({
    message: 'Ação não permitida devido a restrições de compliance.',
    actions: ['request_permission', 'cancel']
  }),
  
  IMPORT_VALIDATION: (error: PatientManagementError) => ({
    message: 'Erros encontrados na importação. Deseja corrigir?',
    actions: ['download_errors', 'fix_and_retry', 'import_valid_only']
  })
};
```

### Validation Framework

```typescript
interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'unique' | 'custom';
  message: string;
  validator?: (value: any, context: any) => boolean;
}

const PatientValidationRules: ValidationRule[] = [
  {
    field: 'cpf',
    type: 'unique',
    message: 'CPF já cadastrado no sistema',
    validator: async (cpf: string) => !(await patientService.existsByCpf(cpf))
  },
  {
    field: 'email',
    type: 'format',
    message: 'Formato de email inválido',
    validator: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
];
```

## Testing Strategy

### Unit Testing Approach

```typescript
// Example test structure for enhanced components
describe('AdvancedSearchPanel', () => {
  describe('Filter Management', () => {
    it('should apply multiple filters correctly', () => {});
    it('should save and load search configurations', () => {});
    it('should suggest filters based on user input', () => {});
  });
  
  describe('Performance', () => {
    it('should debounce search input', () => {});
    it('should handle large result sets efficiently', () => {});
  });
});

describe('PatientImportService', () => {
  describe('Validation', () => {
    it('should validate CSV format and required fields', () => {});
    it('should detect and handle duplicates', () => {});
    it('should provide detailed error reporting', () => {});
  });
  
  describe('Processing', () => {
    it('should process large files in batches', () => {});
    it('should handle partial failures gracefully', () => {});
  });
});
```

### Integration Testing

```typescript
describe('Patient Management Integration', () => {
  describe('Search and Analytics', () => {
    it('should update search index when patient data changes', () => {});
    it('should recalculate analytics when new patients are added', () => {});
  });
  
  describe('Compliance Tracking', () => {
    it('should log all data access attempts', () => {});
    it('should enforce consent requirements', () => {});
    it('should handle data deletion requests', () => {});
  });
});
```

### Performance Testing

- Search response time < 200ms for up to 10,000 patients
- Import processing: 1,000 patients per minute
- Analytics calculation: Real-time for basic metrics, batch for complex analysis
- Document search: Full-text search < 500ms
- Audit log queries: < 1s for 30-day period

## Security Considerations

### Data Protection

1. **Encryption**: All patient data encrypted at rest and in transit
2. **Access Control**: Role-based permissions with audit logging
3. **Data Masking**: Sensitive data masked in non-production environments
4. **Backup Security**: Encrypted backups with access controls

### LGPD Compliance

1. **Consent Management**: Granular consent tracking and management
2. **Data Minimization**: Only collect and store necessary data
3. **Right to Access**: Patients can request their data
4. **Right to Deletion**: Secure data deletion with audit trail
5. **Data Portability**: Export patient data in standard formats

### Audit and Monitoring

1. **Access Logging**: All data access logged with user, time, and purpose
2. **Anomaly Detection**: Unusual access patterns trigger alerts
3. **Regular Audits**: Automated compliance checks and reports
4. **Incident Response**: Defined procedures for security incidents

## Performance Optimization

### Frontend Optimization

1. **Virtual Scrolling**: Handle large patient lists efficiently
2. **Lazy Loading**: Load patient details on demand
3. **Caching**: Cache frequently accessed data
4. **Debouncing**: Optimize search input handling

### Backend Optimization

1. **Database Indexing**: Optimize queries for search and filtering
2. **Caching Layer**: Redis for frequently accessed data
3. **Batch Processing**: Handle bulk operations efficiently
4. **CDN**: Serve static assets and documents via CDN

### Search Optimization

1. **Full-text Search**: Elasticsearch for document content search
2. **Faceted Search**: Pre-calculated filter options
3. **Search Suggestions**: Auto-complete based on existing data
4. **Result Ranking**: Relevance-based result ordering

## Migration Strategy

### Phase 1: Core Enhancements (Weeks 1-2)
- Advanced search implementation
- Enhanced document management
- Basic analytics dashboard

### Phase 2: Advanced Features (Weeks 3-4)
- Import/export functionality
- Predictive metrics
- Compliance panel

### Phase 3: Analytics and Optimization (Weeks 5-6)
- Advanced analytics
- Performance optimization
- Full LGPD compliance features

### Data Migration
- Existing patient data remains unchanged
- New fields added with default values
- Search index built from existing data
- Audit logs start from implementation date

## Monitoring and Maintenance

### Key Metrics to Monitor

1. **Performance Metrics**
   - Search response time
   - Page load times
   - Import/export processing time
   - Database query performance

2. **Usage Metrics**
   - Feature adoption rates
   - Search patterns
   - Document access frequency
   - Error rates

3. **Compliance Metrics**
   - Audit log completeness
   - Consent status tracking
   - Data retention compliance
   - Security incident frequency

### Maintenance Tasks

1. **Regular Updates**
   - Security patches
   - Performance optimizations
   - Feature enhancements
   - Bug fixes

2. **Data Maintenance**
   - Search index optimization
   - Archive old audit logs
   - Clean up expired share links
   - Update analytics calculations

3. **Compliance Maintenance**
   - Review consent statuses
   - Update data retention policies
   - Conduct security audits
   - Update privacy documentation