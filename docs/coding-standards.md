# Coding Standards - Fisioflow 2.0

## Overview
This document outlines the coding standards and best practices for the Fisioflow 2.0 project to ensure code quality, maintainability, and deployment reliability.

## TypeScript Standards

### Type Safety
```typescript
// ✅ Good: Explicit interfaces
interface Patient {
  id: string;
  name: string;
  email?: string;
  createdAt: Date;
}

// ❌ Bad: Any types
const patient: any = getData();

// ✅ Good: Type guards
function isPatient(obj: unknown): obj is Patient {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    typeof (obj as Patient).id === 'string'
  );
}

// ✅ Good: Generic constraints
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  // Implementation
}
```

### Strict Mode Configuration
```json
// tsconfig.json - Required settings
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Import/Export Standards
```typescript
// ✅ Good: Named exports with explicit types
export interface PatientService {
  createPatient(data: CreatePatientRequest): Promise<Patient>;
  updatePatient(id: string, data: UpdatePatientRequest): Promise<Patient>;
}

export const patientService: PatientService = {
  // Implementation
};

// ✅ Good: Organized imports
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Patient, CreatePatientRequest } from '@/types/patient';
import { patientService } from '@/services/patientService';
import { Button } from '@/components/ui/Button';

// ❌ Bad: Mixed import styles
import * as React from 'react';
import { useState } from 'react';
```

## React Component Standards

### Component Structure
```typescript
// ✅ Good: Functional component with proper typing
interface PatientCardProps {
  patient: Patient;
  onEdit?: (patient: Patient) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onEdit,
  onDelete,
  className = ''
}) => {
  // Hooks at the top
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Event handlers
  const handleEdit = useCallback(() => {
    onEdit?.(patient);
  }, [onEdit, patient]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure?')) return;
    
    setIsLoading(true);
    try {
      await patientService.deletePatient(patient.id);
      onDelete?.(patient.id);
    } catch (error) {
      console.error('Failed to delete patient:', error);
    } finally {
      setIsLoading(false);
    }
  }, [patient.id, onDelete]);

  // Early returns
  if (!patient) return null;

  // Render
  return (
    <div className={`patient-card ${className}`}>
      <h3>{patient.name}</h3>
      <p>{patient.email}</p>
      <div className="actions">
        <Button onClick={handleEdit}>Edit</Button>
        <Button onClick={handleDelete} loading={isLoading}>
          Delete
        </Button>
      </div>
    </div>
  );
};

export default PatientCard;
```

### Hooks Standards
```typescript
// ✅ Good: Custom hook with proper error handling
interface UsePatientResult {
  patient: Patient | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function usePatient(id: string): UsePatientResult {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await patientService.getPatient(id);
      setPatient(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  return {
    patient,
    loading,
    error,
    refetch: fetchPatient
  };
}
```

### Performance Optimization
```typescript
// ✅ Good: Memoized components
const PatientList = memo<PatientListProps>(({ patients, onPatientSelect }) => {
  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => a.name.localeCompare(b.name));
  }, [patients]);

  const handlePatientClick = useCallback((patient: Patient) => {
    onPatientSelect(patient);
  }, [onPatientSelect]);

  return (
    <div className="patient-list">
      {sortedPatients.map((patient) => (
        <PatientCard
          key={patient.id}
          patient={patient}
          onClick={handlePatientClick}
        />
      ))}
    </div>
  );
});

PatientList.displayName = 'PatientList';
```

## Error Handling Standards

### API Error Handling
```typescript
// ✅ Good: Comprehensive error handling
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData.code
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error instanceof TypeError) {
      throw new ApiError('Network error', 0, 'NETWORK_ERROR');
    }
    
    throw new ApiError('Unknown error', 500, 'UNKNOWN_ERROR');
  }
}
```

### Component Error Boundaries
```typescript
// ✅ Good: Hierarchical error boundaries
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class PageErrorBoundary extends Component<
  { children: ReactNode; fallback?: ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Page Error Boundary:', error, errorInfo);
    
    // Report to error tracking service
    this.reportError(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Send to error tracking service
    console.error('Error reported:', errorData);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}
```

## Database Standards

### Supabase Integration
```typescript
// ✅ Good: Service layer with retry logic
class PatientService {
  async createPatient(data: CreatePatientRequest): Promise<Patient> {
    return supabase.withRetry(async () => {
      const { data: patient, error } = await supabase
        .from('patients')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create patient: ${error.message}`);
      }

      return patient;
    }, 'create patient');
  }

  async getPatients(filters?: PatientFilters): Promise<Patient[]> {
    return supabase.withRetry(async () => {
      let query = supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch patients: ${error.message}`);
      }

      return data || [];
    }, 'fetch patients');
  }
}

export const patientService = new PatientService();
```

### Query Optimization
```typescript
// ✅ Good: Optimized queries with proper indexing
interface DatabaseQuery {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
  offset?: number;
}

class QueryBuilder {
  static buildQuery(params: DatabaseQuery) {
    let query = supabase
      .from(params.table)
      .select(params.select || '*');

    // Apply filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply ordering
    if (params.orderBy) {
      query = query.order(params.orderBy.column, {
        ascending: params.orderBy.ascending
      });
    }

    // Apply pagination
    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    return query;
  }
}
```

## Performance Standards

### Code Splitting
```typescript
// ✅ Good: Strategic code splitting
import { lazy, Suspense } from 'react';
import { LazyWrapper } from '@/utils/performance';

// Split by routes
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Patients = lazy(() => import('@/pages/Patients'));
const Reports = lazy(() => import('@/pages/Reports'));

// Split heavy components
const DataVisualization = lazy(() => import('@/components/charts/DataVisualization'));
const PDFViewer = lazy(() => import('@/components/documents/PDFViewer'));

// Route configuration
const routes = [
  {
    path: '/dashboard',
    element: (
      <LazyWrapper name="Dashboard">
        <Dashboard />
      </LazyWrapper>
    )
  },
  // ... other routes
];
```

### Bundle Optimization
```typescript
// vite.config.ts - Optimized configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('node_modules/react')) {
            return 'react-vendor';
          }
          
          // Charts and visualization
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts-vendor';
          }
          
          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-vendor';
          }
          
          // Form handling
          if (id.includes('react-hook-form') || id.includes('zod')) {
            return 'forms-vendor';
          }
          
          // AI services
          if (id.includes('/services/ai') || id.includes('gemini')) {
            return 'ai-vendor';
          }
          
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug']
      }
    }
  }
});
```

## Security Standards

### Input Validation
```typescript
// ✅ Good: Zod validation schemas
import { z } from 'zod';

const PatientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number').optional(),
  dateOfBirth: z.date().max(new Date(), 'Date of birth cannot be in the future'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Invalid CPF format')
});

type CreatePatientRequest = z.infer<typeof PatientSchema>;

// Validate in components
const PatientForm: React.FC = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (formData: any) => {
    try {
      const validatedData = PatientSchema.parse(formData);
      await patientService.createPatient(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.reduce((acc, err) => {
          acc[err.path.join('.')] = err.message;
          return acc;
        }, {} as Record<string, string>);
        setErrors(formattedErrors);
      }
    }
  };
};
```

### Environment Variables
```typescript
// ✅ Good: Environment variable validation
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

function validateEnvironment() {
  const missing = requiredEnvVars.filter(
    (varName) => !import.meta.env[varName]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

// Call during app initialization
validateEnvironment();
```

## Testing Standards

### Unit Tests
```typescript
// ✅ Good: Comprehensive unit tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PatientCard } from './PatientCard';

describe('PatientCard', () => {
  const mockPatient = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date('2023-01-01')
  };

  const mockProps = {
    patient: mockPatient,
    onEdit: vi.fn(),
    onDelete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders patient information correctly', () => {
    render(<PatientCard {...mockProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    render(<PatientCard {...mockProps} />);
    
    fireEvent.click(screen.getByText('Edit'));
    
    await waitFor(() => {
      expect(mockProps.onEdit).toHaveBeenCalledWith(mockPatient);
    });
  });

  it('shows confirmation dialog when delete is clicked', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    render(<PatientCard {...mockProps} />);
    
    fireEvent.click(screen.getByText('Delete'));
    
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure?');
  });
});
```

### Integration Tests
```typescript
// ✅ Good: Integration tests for services
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '@/services/supabase/supabaseClient';
import { patientService } from '@/services/patientService';

describe('PatientService Integration', () => {
  let testPatientId: string;

  beforeAll(async () => {
    // Setup test data
    await supabase.from('patients').delete().eq('email', 'test@example.com');
  });

  afterAll(async () => {
    // Cleanup test data
    if (testPatientId) {
      await supabase.from('patients').delete().eq('id', testPatientId);
    }
  });

  it('creates and retrieves a patient successfully', async () => {
    const patientData = {
      name: 'Test Patient',
      email: 'test@example.com',
      phone: '+1234567890'
    };

    // Create patient
    const createdPatient = await patientService.createPatient(patientData);
    testPatientId = createdPatient.id;

    expect(createdPatient).toMatchObject(patientData);
    expect(createdPatient.id).toBeDefined();

    // Retrieve patient
    const retrievedPatient = await patientService.getPatient(testPatientId);
    expect(retrievedPatient).toMatchObject(patientData);
  });
});
```

## File Organization Standards

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Button, Input, etc.)
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   └── feature/        # Feature-specific components
├── pages/              # Page components
├── hooks/              # Custom hooks
├── services/           # API and business logic
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── constants/          # Application constants
└── tests/              # Test files
```

### File Naming Conventions
```typescript
// ✅ Good: Consistent naming
PatientCard.tsx         // PascalCase for components
patientService.ts       // camelCase for services
usePatient.ts          // camelCase for hooks
types.ts               // lowercase for types
constants.ts           // lowercase for constants
PatientCard.test.tsx   // .test.tsx for tests
PatientCard.stories.tsx // .stories.tsx for Storybook
```

## Git Standards

### Commit Messages
```bash
# ✅ Good: Conventional commits
feat: add patient search functionality
fix: resolve authentication timeout issue
docs: update API documentation
style: format code with prettier
refactor: extract common validation logic
test: add unit tests for patient service
chore: update dependencies

# ❌ Bad: Vague commits
fix stuff
update
wip
changes
```

### Branch Naming
```bash
# ✅ Good: Descriptive branch names
feature/patient-search
fix/auth-timeout
hotfix/critical-security-issue
refactor/service-layer
docs/api-documentation

# ❌ Bad: Unclear branch names
fix
new-feature
update
```

## Deployment Prevention Rules

### Pre-commit Checks
1. **No console.log in production code**
2. **No debugger statements**
3. **No .only in test files**
4. **No TODO comments without issue numbers**
5. **All TypeScript errors resolved**
6. **All tests passing**
7. **Lint errors resolved**

### Build Validation
```typescript
// Build-time checks
if (process.env.NODE_ENV === 'production') {
  // Ensure no development-only code
  if (typeof console.log !== 'undefined') {
    console.warn('Console.log found in production build');
  }
  
  // Validate environment variables
  const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  requiredVars.forEach(varName => {
    if (!import.meta.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  });
}
```

These standards ensure code quality, maintainability, and deployment reliability for the Fisioflow 2.0 project.