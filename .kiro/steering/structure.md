---
inclusion: always
---

# Project Structure & Architecture Patterns

## File Organization Rules

### Root Level Structure
- `App.tsx` - Main app with HashRouter, never use BrowserRouter
- `AppRoutes.tsx` - Central routing with role-based access control
- `types.ts` - All TypeScript interfaces and types (never create separate type files)
- Entry points: `index.tsx`, `index.html`

### Directory Patterns
- `/components` - React components with clear functional grouping
- `/pages` - Page components organized by portal (root = therapist portal)
- `/services` - API layer with mock implementations, always async/await
- `/hooks` - Custom hooks for business logic and state management
- `/contexts` - React Context providers for global state
- `/data` - Mock data files only
- `/tests` - Mirror source structure for test organization

## Naming Conventions (Strict)
- **Components**: PascalCase with descriptive suffixes (`*FormModal.tsx`, `*Card.tsx`, `*Manager.tsx`)
- **Services**: `*Service.ts` pattern, imported as `* as ServiceName`
- **Hooks**: `use*` pattern for all custom hooks
- **Pages**: `*Page.tsx` suffix for all page components
- **Types**: Define in central `types.ts`, use descriptive interface names
- **Mock Data**: `mock*` prefix for all mock data files

## Import Rules
- Always use `@/*` path alias for project imports
- React Router DOM: `import * as ReactRouterDOM from 'react-router-dom'`
- Services: `import * as serviceName from '@/services/serviceName'`
- Components: Named imports only
- Never use default exports for services or utilities

## Component Architecture
- Functional components only with TypeScript interfaces
- Props interfaces: Define inline for simple props, export for reusable interfaces
- State management: useState/useEffect, delegate complex logic to custom hooks
- Error handling: Wrap components in ErrorBoundary, use try/catch in services
- Form handling: React Hook Form with Zod validation

## Service Layer Patterns
- All services return Promises with artificial delays (simulate API calls)
- Use async/await syntax consistently
- Mock data should be realistic and comprehensive
- Service functions should handle errors gracefully
- Never mix real API calls with mock implementations

## Portal-Specific Rules
- **Therapist Portal** (root): Full clinical functionality, admin features
- **Patient Portal** (`/patient-portal`): Limited self-service features
- **Partner Portal** (`/partner-portal`): External healthcare provider features
- Each portal has dedicated layouts and components in subdirectories

## Code Style Requirements
- TypeScript strict mode enabled
- Functional components with proper TypeScript typing
- Custom hooks for business logic separation
- Context providers for cross-component state
- Consistent error boundary usage
- Path aliases for clean imports