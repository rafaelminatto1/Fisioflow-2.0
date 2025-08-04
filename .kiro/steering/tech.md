---
inclusion: always
---

# Technology Stack & Development Guidelines

## Core Technologies
- **React 19.1.1** with TypeScript 5.8.2 (ES2022 target)
- **Vite** for build tooling and development server
- **React Router DOM 7.7.1** - ALWAYS use HashRouter, never BrowserRouter
- **Path aliases**: `@/*` maps to project root - use consistently

## Essential Libraries
- **Forms**: React Hook Form + Zod validation + Hookform Resolvers
- **Icons**: Lucide React only
- **Charts**: Recharts for all data visualization
- **AI**: Google GenAI (Gemini API via `GEMINI_API_KEY` env var)
- **Testing**: Vitest + Testing Library React + Jest DOM

## Critical Development Rules

### Import Patterns (Strict)
```typescript
// Services - always namespace import
import * as PatientService from '@/services/patientService'

// React Router - always namespace import
import * as ReactRouterDOM from 'react-router-dom'

// Components - named imports only
import { Button, Modal } from '@/components/ui'

// Never use default exports for services or utilities
```

### Service Layer Requirements
- All services MUST be async/await with artificial delays
- Mock data implementations only - no real API calls
- Services return Promises, handle errors gracefully
- Import pattern: `import * as ServiceName from '@/services/serviceName'`

### TypeScript Conventions
- All types in central `types.ts` file - never create separate type files
- Functional components only with proper TypeScript interfaces
- Props interfaces: inline for simple, exported for reusable
- Strict mode enabled - handle all type errors

### State Management
- Custom hooks for business logic (usePatients, useAppointments, etc.)
- Context providers for global state (AuthContext, ToastContext, ModalContext)
- useState/useEffect for component state
- Delegate complex logic to custom hooks

### Error Handling
- Wrap components in ErrorBoundary
- Try/catch in all service functions
- Toast notifications for user feedback
- Graceful degradation for failed operations

### Environment & Build
- Environment variables via Vite's loadEnv
- Process.env variables defined in vite.config.ts
- Commands: `npm run dev`, `npm run build`, `npm run preview`

## Architecture Enforcement
- **Service Layer**: Separate files with mock implementations
- **Protected Routes**: Role-based access with ProtectedRoute component
- **Portal Layouts**: Dedicated layouts for therapist/patient/partner portals
- **Form Validation**: React Hook Form + Zod schemas consistently