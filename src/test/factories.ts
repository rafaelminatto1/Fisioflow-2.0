import { vi } from 'vitest';

// Factory function type
type Factory<T> = (overrides?: Partial<T>) => T;

// User factory
export const createUser: Factory<any> = (overrides = {}) => ({
  id: `user-${Math.random().toString(36).substr(2, 9)}`,
  email: `user-${Math.random().toString(36).substr(2, 5)}@test.com`,
  role: 'patient',
  profile: {
    firstName: 'Test',
    lastName: 'User',
    phone: '+55 11 99999-9999',
    avatar: null,
    preferences: {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      theme: 'light',
    },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Patient factory
export const createPatient: Factory<any> = (overrides = {}) => ({
  id: `patient-${Math.random().toString(36).substr(2, 9)}`,
  organizationId: `org-${Math.random().toString(36).substr(2, 9)}`,
  medicalRecordNumber: `MR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
  emergencyContact: {
    name: 'Emergency Contact',
    relationship: 'Spouse',
    phone: '+55 11 98888-8888',
    email: 'emergency@test.com',
  },
  medicalHistory: {
    allergies: ['Penicillin'],
    medications: ['Ibuprofen'],
    conditions: ['Hypertension'],
    surgeries: [],
    familyHistory: ['Diabetes - Mother'],
  },
  insuranceInfo: {
    provider: 'Test Insurance',
    planNumber: '123456789',
    validUntil: '2024-12-31',
    coverage: 'Full coverage',
  },
  notes: 'Test patient notes',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Therapist factory
export const createTherapist: Factory<any> = (overrides = {}) => ({
  id: `therapist-${Math.random().toString(36).substr(2, 9)}`,
  organizationId: `org-${Math.random().toString(36).substr(2, 9)}`,
  licenseNumber: `LIC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
  specialties: ['Orthopedics', 'Sports Medicine'],
  qualifications: {
    degree: 'Physical Therapy - Test University',
    postGraduate: ['Orthopedic Specialization'],
    certifications: ['Manual Therapy', 'Dry Needling'],
    experience: '5 years',
  },
  scheduleSettings: {
    workingHours: {
      monday: { start: '08:00', end: '18:00', break: { start: '12:00', end: '13:00' } },
      tuesday: { start: '08:00', end: '18:00', break: { start: '12:00', end: '13:00' } },
      wednesday: { start: '08:00', end: '18:00', break: { start: '12:00', end: '13:00' } },
      thursday: { start: '08:00', end: '18:00', break: { start: '12:00', end: '13:00' } },
      friday: { start: '08:00', end: '17:00', break: { start: '12:00', end: '13:00' } },
      saturday: { start: '08:00', end: '12:00' },
      sunday: { closed: true },
    },
    appointmentDuration: 60,
    bufferTime: 15,
    maxAppointmentsPerDay: 8,
  },
  isAvailable: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Appointment factory
export const createAppointment: Factory<any> = (overrides = {}) => ({
  id: `appointment-${Math.random().toString(36).substr(2, 9)}`,
  organizationId: `org-${Math.random().toString(36).substr(2, 9)}`,
  patientId: `patient-${Math.random().toString(36).substr(2, 9)}`,
  therapistId: `therapist-${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Appointment',
  description: 'Test appointment description',
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  endTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
  status: 'scheduled',
  appointmentType: 'consultation',
  location: 'Room 1',
  notes: 'Test appointment notes',
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Organization factory
export const createOrganization: Factory<any> = (overrides = {}) => ({
  id: `org-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Clinic',
  cnpj: '12.345.678/0001-90',
  email: 'clinic@test.com',
  phone: '+55 11 99999-9999',
  address: {
    street: 'Test Street, 123',
    neighborhood: 'Test Neighborhood',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
    country: 'Brasil',
  },
  settings: {
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    businessHours: {
      monday: { start: '08:00', end: '18:00' },
      tuesday: { start: '08:00', end: '18:00' },
      wednesday: { start: '08:00', end: '18:00' },
      thursday: { start: '08:00', end: '18:00' },
      friday: { start: '08:00', end: '17:00' },
      saturday: { start: '08:00', end: '12:00' },
      sunday: { closed: true },
    },
    appointmentDuration: 60,
    allowOnlineBooking: true,
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Notification factory
export const createNotification: Factory<any> = (overrides = {}) => ({
  id: `notification-${Math.random().toString(36).substr(2, 9)}`,
  organizationId: `org-${Math.random().toString(36).substr(2, 9)}`,
  userId: `user-${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Notification',
  message: 'This is a test notification message',
  type: 'info',
  data: {},
  read: false,
  readAt: null,
  expiresAt: null,
  createdAt: new Date(),
  ...overrides,
});

// Error log factory
export const createErrorLog: Factory<any> = (overrides = {}) => ({
  id: `error-${Math.random().toString(36).substr(2, 9)}`,
  organizationId: `org-${Math.random().toString(36).substr(2, 9)}`,
  userId: `user-${Math.random().toString(36).substr(2, 9)}`,
  errorType: 'TestError',
  errorMessage: 'This is a test error message',
  errorStack: 'Error stack trace here',
  context: {
    url: '/test-page',
    userAgent: 'Test User Agent',
    timestamp: new Date().toISOString(),
  },
  severity: 'error',
  resolved: false,
  resolvedAt: null,
  resolvedBy: null,
  createdAt: new Date(),
  ...overrides,
});

// Audit log factory
export const createAuditLog: Factory<any> = (overrides = {}) => ({
  id: `audit-${Math.random().toString(36).substr(2, 9)}`,
  organizationId: `org-${Math.random().toString(36).substr(2, 9)}`,
  userId: `user-${Math.random().toString(36).substr(2, 9)}`,
  tableName: 'test_table',
  recordId: `record-${Math.random().toString(36).substr(2, 9)}`,
  action: 'INSERT',
  oldValues: null,
  newValues: { name: 'Test Record' },
  ipAddress: '127.0.0.1',
  userAgent: 'Test User Agent',
  createdAt: new Date(),
  ...overrides,
});

// Mock API response factory
export const createApiResponse = <T>(data: T, error: string | null = null) => ({
  data,
  error,
  status: error ? 'error' : 'success',
  message: error || 'Success',
});

// Mock API error factory
export const createApiError = (message = 'Test error', code = 'TEST_ERROR') => ({
  data: null,
  error: {
    message,
    code,
    details: {},
  },
  status: 'error',
});

// Mock form validation error factory
export const createValidationError = (field: string, message: string) => ({
  [field]: {
    type: 'validation',
    message,
  },
});

// Mock file factory for testing uploads
export const createMockFile = (
  name = 'test.jpg',
  type = 'image/jpeg',
  size = 1024,
  content = 'test file content'
) => {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock event factory
export const createMockEvent = (type = 'click', overrides = {}) => ({
  type,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  currentTarget: { value: '' },
  ...overrides,
});

// Mock React Hook Form methods
export const createMockFormMethods = (overrides = {}) => ({
  register: vi.fn(),
  handleSubmit: vi.fn((fn) => (e: any) => {
    e?.preventDefault?.();
    return fn({});
  }),
  formState: {
    errors: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
    isLoading: false,
  },
  setValue: vi.fn(),
  getValue: vi.fn(),
  getValues: vi.fn(() => ({})),
  watch: vi.fn(),
  reset: vi.fn(),
  clearErrors: vi.fn(),
  setError: vi.fn(),
  trigger: vi.fn(),
  control: {},
  ...overrides,
});

// Batch factory for creating multiple items
export const createBatch = <T>(factory: Factory<T>, count: number, overrides: Partial<T> = {}): T[] => {
  return Array.from({ length: count }, (_, index) => 
    factory({ ...overrides, id: `${overrides.id || 'item'}-${index}` } as Partial<T>)
  );
};

// Export all factories
export const factories = {
  user: createUser,
  patient: createPatient,
  therapist: createTherapist,
  appointment: createAppointment,
  organization: createOrganization,
  notification: createNotification,
  errorLog: createErrorLog,
  auditLog: createAuditLog,
  apiResponse: createApiResponse,
  apiError: createApiError,
  validationError: createValidationError,
  mockFile: createMockFile,
  mockEvent: createMockEvent,
  mockFormMethods: createMockFormMethods,
  batch: createBatch,
};