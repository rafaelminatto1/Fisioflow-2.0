import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { ModalProvider } from '../../contexts/ModalContext';

// Mock user data for testing
export const mockUsers = {
  admin: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@test.com',
    role: 'admin' as const,
    profile: {
      firstName: 'Admin',
      lastName: 'User',
      phone: '+55 11 99999-9999',
      avatar: null,
      preferences: {
        language: 'pt-BR' as const,
        timezone: 'America/Sao_Paulo',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
        theme: 'light' as const,
      },
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  therapist: {
    id: '234e5678-e89b-12d3-a456-426614174001',
    email: 'therapist@test.com',
    role: 'therapist' as const,
    profile: {
      firstName: 'João',
      lastName: 'Santos',
      phone: '+55 11 98888-8888',
      avatar: null,
      preferences: {
        language: 'pt-BR' as const,
        timezone: 'America/Sao_Paulo',
        notifications: {
          email: true,
          sms: true,
          push: true,
        },
        theme: 'light' as const,
      },
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  patient: {
    id: '345e6789-e89b-12d3-a456-426614174002',
    email: 'patient@test.com',
    role: 'patient' as const,
    profile: {
      firstName: 'Ana',
      lastName: 'Costa',
      phone: '+55 11 97777-7777',
      avatar: null,
      preferences: {
        language: 'pt-BR' as const,
        timezone: 'America/Sao_Paulo',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
        theme: 'light' as const,
      },
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  partner: {
    id: '456e7890-e89b-12d3-a456-426614174003',
    email: 'partner@test.com',
    role: 'partner' as const,
    profile: {
      firstName: 'Carlos',
      lastName: 'Oliveira',
      phone: '+55 11 96666-6666',
      avatar: null,
      preferences: {
        language: 'pt-BR' as const,
        timezone: 'America/Sao_Paulo',
        notifications: {
          email: true,
          sms: true,
          push: false,
        },
        theme: 'dark' as const,
      },
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

// Mock auth context values
export const createMockAuthContext = (user: typeof mockUsers.admin | null = null) => ({
  user,
  loading: false,
  signIn: vi.fn().mockResolvedValue({ user, error: null }),
  signUp: vi.fn().mockResolvedValue({ user, error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  updateProfile: vi.fn().mockResolvedValue({ user, error: null }),
  refreshUser: vi.fn().mockResolvedValue(user),
  hasRole: vi.fn((role: string) => user?.role === role),
  hasAnyRole: vi.fn((roles: string[]) => user ? roles.includes(user.role) : false),
});

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: typeof mockUsers.admin | null;
  authContextValue?: ReturnType<typeof createMockAuthContext>;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    initialEntries = ['/'],
    user = null,
    authContextValue,
    ...renderOptions
  } = options;

  const mockAuthValue = authContextValue || createMockAuthContext(user);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <AuthProvider value={mockAuthValue}>
          <ToastProvider>
            <ModalProvider>
              {children}
            </ModalProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
  };

  return {
    from: vi.fn().mockReturnValue(mockQuery),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: mockUsers.admin }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: mockUsers.admin }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: mockUsers.admin }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/file.jpg' } }),
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
};

// Mock database service responses
export const createMockDatabaseResponse = <T>(data: T, error: string | null = null) => ({
  data,
  error,
  count: Array.isArray(data) ? data.length : data ? 1 : 0,
});

// Mock form data
export const mockFormData = {
  patient: {
    firstName: 'João',
    lastName: 'Silva',
    email: 'joao.silva@email.com',
    phone: '+55 11 99999-9999',
    cpf: '123.456.789-00',
    dateOfBirth: '1990-01-01',
    address: {
      street: 'Rua das Flores, 123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
    },
  },
  appointment: {
    title: 'Consulta Inicial',
    description: 'Primeira consulta para avaliação',
    startTime: '2024-02-01T09:00:00-03:00',
    endTime: '2024-02-01T10:00:00-03:00',
    patientId: mockUsers.patient.id,
    therapistId: mockUsers.therapist.id,
    type: 'consultation',
    location: 'Sala 1',
  },
};

// Test utilities for async operations
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

// Mock file for testing file uploads
export const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock event objects
export const createMockEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  currentTarget: { value: '' },
  ...overrides,
});

// Mock intersection observer entry
export const createMockIntersectionObserverEntry = (isIntersecting = true) => ({
  isIntersecting,
  target: document.createElement('div'),
  intersectionRatio: isIntersecting ? 1 : 0,
  boundingClientRect: {} as DOMRectReadOnly,
  intersectionRect: {} as DOMRectReadOnly,
  rootBounds: {} as DOMRectReadOnly,
  time: Date.now(),
});

// Custom matchers for better assertions
export const customMatchers = {
  toBeInTheDocument: (received: any) => {
    const pass = document.body.contains(received);
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
      pass,
    };
  },
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { vi } from 'vitest';

// Export the custom render as the default render
export { renderWithProviders as render };