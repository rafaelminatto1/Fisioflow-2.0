# Technology Stack

## Frontend Framework
- **React 19.1.1** with TypeScript
- **Vite** as build tool and development server
- **React Router DOM 7.7.1** for routing with HashRouter

## Key Libraries
- **UI Components**: Lucide React for icons
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation and Hookform Resolvers
- **AI Integration**: Google GenAI for Gemini API integration
- **Testing**: Vitest, Testing Library React, Jest DOM

## Development Setup
- **TypeScript 5.8.2** with ES2022 target
- **Path aliases**: `@/*` maps to project root
- **Module system**: ESNext with bundler resolution
- **JSX**: React JSX transform

## Environment Configuration
- Environment variables loaded via Vite's loadEnv
- Gemini API key configured through `GEMINI_API_KEY` env var
- Process.env variables defined in vite.config.ts

## Common Commands
```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run preview      # Preview production build
```

## Architecture Patterns
- **Service Layer**: Separate service files for API interactions with mock data
- **Custom Hooks**: Business logic encapsulated in custom hooks (usePatients, useAppointments, etc.)
- **Context Providers**: Global state management (AuthContext, ToastContext)
- **Protected Routes**: Role-based access control with ProtectedRoute component
- **Layout Components**: Dedicated layouts for different user portals

## Code Organization
- Services use async/await with artificial delays to simulate API calls
- Mock data stored in `/data` directory
- Type definitions centralized in `types.ts`
- Components follow functional component pattern with TypeScript interfaces