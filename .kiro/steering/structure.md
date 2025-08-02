# Project Structure

## Root Level
- `App.tsx` - Main application component with HashRouter
- `AppRoutes.tsx` - Central routing configuration with role-based access
- `types.ts` - Centralized TypeScript type definitions
- `index.tsx` - Application entry point
- `index.html` - HTML template

## Core Directories

### `/components`
React components organized by functionality:
- **Modal Components**: `*FormModal.tsx`, `*DetailModal.tsx` patterns
- **Card Components**: `*Card.tsx` for data display
- **Specialized**: `InteractiveBodyMap.tsx`, `PainScale.tsx`, etc.
- **Subdirectories**: 
  - `ui/` - Reusable UI components
  - `forms/` - Form-specific components
  - `dashboard/` - Dashboard widgets
  - `analytics/` - Analytics components
  - `reports/` - Report components
  - `patient-portal/` - Patient-specific components
  - `partner-portal/` - Partner-specific components

### `/pages`
Page components organized by portal:
- **Root level**: Main therapist portal pages
- `patient-portal/` - Patient portal pages
- `partner-portal/` - Partner portal pages

### `/contexts`
React Context providers:
- `AuthContext.tsx` - Authentication state
- `ToastContext.tsx` - Toast notifications

### `/hooks`
Custom React hooks following `use*` naming:
- Business logic hooks (e.g., `usePatients.ts`, `useAppointments.ts`)
- Data fetching and state management

### `/services`
API service layer with mock implementations:
- Service files follow `*Service.ts` naming
- Subdirectories for complex services:
  - `ai/` - AI service implementations
  - `ai-economica/` - Economic AI services
  - `scheduling/` - Scheduling-related services

### `/data`
Mock data files:
- `mockData.ts` - Core mock data
- `mock*.ts` - Specialized mock data files

### `/layouts`
Layout components for different portals:
- `MainLayout` - Therapist portal layout
- `PatientPortalLayout` - Patient portal layout
- `PartnerLayout` - Partner portal layout

### `/tests`
Test files organized by feature area

## Naming Conventions
- **Components**: PascalCase with descriptive names
- **Files**: camelCase for utilities, PascalCase for components
- **Services**: `*Service.ts` pattern
- **Hooks**: `use*` pattern
- **Types**: Defined in central `types.ts` file
- **Mock Data**: `mock*` prefix

## Import Patterns
- Use `@/*` path alias for imports from project root
- Import React Router DOM as `* as ReactRouterDOM`
- Services imported with `* as serviceName` pattern
- Components use named imports

## Component Structure
- Functional components with TypeScript interfaces
- Props interfaces defined inline or exported
- State management with useState/useEffect
- Custom hooks for business logic
- Error boundaries for error handling