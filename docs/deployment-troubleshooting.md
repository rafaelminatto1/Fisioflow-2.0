# Deployment Troubleshooting Guide

## Common Deployment Issues and Solutions

### Build Failures

#### TypeScript Errors
**Problem**: Build fails with TypeScript compilation errors.

**Symptoms**:
```
error TS2551: Property 'xyz' does not exist on type
error TS2339: Property 'abc' does not exist on type
```

**Solutions**:
1. Enable strict mode gradually:
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noUnusedLocals": false,      // Disable initially
       "noUnusedParameters": false   // Disable initially
     }
   }
   ```

2. Fix type issues:
   ```typescript
   // Use proper typing
   interface Patient {
     id: string;
     name: string;
     email?: string; // Optional properties
   }
   
   // Use type guards
   function isPatient(obj: any): obj is Patient {
     return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
   }
   ```

3. Add type declarations for missing modules:
   ```typescript
   // types/global.d.ts
   declare module 'some-untyped-library' {
     export function someFunction(): void;
   }
   ```

#### Vite Build Issues
**Problem**: Vite build fails or produces incorrect bundles.

**Symptoms**:
```
Build failed with errors
Rollup failed to resolve import
Dynamic import not found
```

**Solutions**:
1. Check import paths:
   ```typescript
   // Correct: Use @ alias
   import { Component } from '@/components/Component';
   
   // Incorrect: Relative paths from root
   import { Component } from '../../../components/Component';
   ```

2. Fix dynamic imports:
   ```typescript
   // Correct: Proper dynamic import
   const LazyComponent = lazy(() => import('@/components/LazyComponent'));
   
   // Incorrect: Invalid import path
   const LazyComponent = lazy(() => import('./non-existent'));
   ```

3. Configure Vite properly:
   ```typescript
   // vite.config.ts
   export default defineConfig({
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom'],
             utils: ['lodash', 'date-fns']
           }
         }
       }
     }
   });
   ```

### Vercel Deployment Issues

#### Environment Variables
**Problem**: Environment variables not available in production.

**Symptoms**:
```
undefined is not an object (evaluating 'process.env.VITE_API_URL')
API calls failing with undefined URLs
```

**Solutions**:
1. Use VITE_ prefix for client-side variables:
   ```bash
   # .env.production
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Set variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all VITE_ prefixed variables
   - Ensure correct environment (Production/Preview/Development)

3. Verify in build:
   ```typescript
   // Check at build time
   console.log('Environment check:', {
     supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
     isDev: import.meta.env.DEV,
     isProd: import.meta.env.PROD
   });
   ```

#### Build Command Issues
**Problem**: Vercel uses wrong build command or configuration.

**Solutions**:
1. Configure vercel.json:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm install --prefer-offline --no-audit",
     "framework": "vite"
   }
   ```

2. Optimize package.json scripts:
   ```json
   {
     "scripts": {
       "build": "tsc && vite build",
       "preview": "vite preview",
       "typecheck": "tsc --noEmit"
     }
   }
   ```

#### Memory Issues
**Problem**: Build fails due to memory limitations.

**Symptoms**:
```
FATAL ERROR: Ineffective mark-compacts near heap limit
JavaScript heap out of memory
```

**Solutions**:
1. Increase Node.js memory:
   ```json
   // package.json
   {
     "scripts": {
       "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
     }
   }
   ```

2. Optimize bundle splitting:
   ```typescript
   // vite.config.ts - Better chunk splitting
   build: {
     rollupOptions: {
       output: {
         manualChunks: (id) => {
           if (id.includes('node_modules')) {
             if (id.includes('react')) {
               return 'react-vendor';
             }
             if (id.includes('date-fns') || id.includes('lodash')) {
               return 'utils-vendor';
             }
             return 'vendor';
           }
         }
       }
     }
   }
   ```

### Supabase Connection Issues

#### Authentication Errors
**Problem**: Authentication fails in production.

**Symptoms**:
```
Auth session missing!
Invalid JWT token
User not authenticated
```

**Solutions**:
1. Check Supabase configuration:
   ```typescript
   // Verify environment variables
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
   
   if (!supabaseUrl || !supabaseKey) {
     console.error('Missing Supabase configuration');
   }
   ```

2. Configure authentication properly:
   ```typescript
   const supabase = createClient(supabaseUrl, supabaseKey, {
     auth: {
       persistSession: true,
       autoRefreshToken: true,
       detectSessionInUrl: true,
       flowType: 'pkce' // Important for security
     }
   });
   ```

3. Handle authentication state:
   ```typescript
   useEffect(() => {
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         if (event === 'SIGNED_IN' && session) {
           setUser(session.user);
         }
         if (event === 'SIGNED_OUT') {
           setUser(null);
         }
       }
     );
     
     return () => subscription.unsubscribe();
   }, []);
   ```

#### Database Connection Issues
**Problem**: Database queries fail in production.

**Solutions**:
1. Implement retry logic:
   ```typescript
   async function queryWithRetry<T>(
     queryFn: () => Promise<T>,
     maxRetries: number = 3
   ): Promise<T> {
     for (let attempt = 1; attempt <= maxRetries; attempt++) {
       try {
         return await queryFn();
       } catch (error) {
         if (attempt === maxRetries) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
       }
     }
     throw new Error('Max retries exceeded');
   }
   ```

2. Add connection pooling:
   ```typescript
   const supabase = createClient(url, key, {
     db: {
       schema: 'public',
     },
     global: {
       headers: {
         'x-application-name': 'FisioFlow',
       },
     },
     // Add connection timeout
     realtime: {
       params: {
         eventsPerSecond: 10,
       },
     },
   });
   ```

### Performance Issues

#### Slow Loading Times
**Problem**: Application loads slowly in production.

**Solutions**:
1. Implement code splitting:
   ```typescript
   // Use React.lazy for route components
   const Dashboard = lazy(() => import('@/pages/Dashboard'));
   const Patients = lazy(() => import('@/pages/Patients'));
   
   // Wrap in Suspense
   <Suspense fallback={<LoadingSpinner />}>
     <Dashboard />
   </Suspense>
   ```

2. Optimize images:
   ```typescript
   // Use modern image formats
   <img 
     src="/images/logo.webp"
     alt="Logo"
     loading="lazy"
     width={200}
     height={100}
   />
   ```

3. Preload critical resources:
   ```typescript
   // In index.html
   <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
   <link rel="preload" href="/css/critical.css" as="style">
   ```

#### Large Bundle Sizes
**Problem**: JavaScript bundles are too large.

**Solutions**:
1. Analyze bundle:
   ```bash
   npm install --save-dev rollup-plugin-visualizer
   ```

2. Remove unused dependencies:
   ```bash
   npm audit
   npm uninstall unused-package
   npx depcheck
   ```

3. Use tree shaking:
   ```typescript
   // Import only what you need
   import { format } from 'date-fns';
   // Instead of
   import * as dateFns from 'date-fns';
   ```

### Runtime Errors

#### Client-Side Errors
**Problem**: Application crashes in production.

**Solutions**:
1. Implement error boundaries:
   ```typescript
   class ErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props);
       this.state = { hasError: false };
     }
   
     static getDerivedStateFromError(error: Error): State {
       return { hasError: true };
     }
   
     componentDidCatch(error: Error, errorInfo: ErrorInfo) {
       console.error('Error caught by boundary:', error, errorInfo);
       // Report to error tracking service
     }
   
     render() {
       if (this.state.hasError) {
         return <ErrorFallback />;
       }
       return this.props.children;
     }
   }
   ```

2. Add global error handling:
   ```typescript
   window.addEventListener('error', (event) => {
     console.error('Global error:', event.error);
     // Report to error tracking service
   });
   
   window.addEventListener('unhandledrejection', (event) => {
     console.error('Unhandled promise rejection:', event.reason);
     // Report to error tracking service
   });
   ```

#### API Errors
**Problem**: API calls fail in production.

**Solutions**:
1. Add comprehensive error handling:
   ```typescript
   async function apiCall<T>(url: string): Promise<T> {
     try {
       const response = await fetch(url);
       
       if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
       }
       
       return await response.json();
     } catch (error) {
       if (error instanceof TypeError) {
         throw new Error('Network error - check your connection');
       }
       throw error;
     }
   }
   ```

2. Implement circuit breaker pattern:
   ```typescript
   class CircuitBreaker {
     private failures = 0;
     private readonly threshold = 5;
     private readonly timeout = 60000;
     private nextAttempt = Date.now();
   
     async call<T>(fn: () => Promise<T>): Promise<T> {
       if (this.failures >= this.threshold) {
         if (Date.now() < this.nextAttempt) {
           throw new Error('Circuit breaker is OPEN');
         }
         // Try to reset
         this.failures = 0;
       }
   
       try {
         const result = await fn();
         this.failures = 0;
         return result;
       } catch (error) {
         this.failures++;
         this.nextAttempt = Date.now() + this.timeout;
         throw error;
       }
     }
   }
   ```

## Monitoring and Debugging

### Production Debugging
1. **Enable source maps for production debugging**:
   ```typescript
   // vite.config.ts
   build: {
     sourcemap: process.env.NODE_ENV === 'development' ? true : 'hidden'
   }
   ```

2. **Add performance monitoring**:
   ```typescript
   // Monitor Core Web Vitals
   import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
   
   getCLS(console.log);
   getFID(console.log);
   getFCP(console.log);
   getLCP(console.log);
   getTTFB(console.log);
   ```

3. **Add error reporting**:
   ```typescript
   // Simple error reporting
   function reportError(error: Error, context?: string) {
     const errorData = {
       message: error.message,
       stack: error.stack,
       context,
       timestamp: new Date().toISOString(),
       url: window.location.href,
       userAgent: navigator.userAgent
     };
     
     // Send to your error tracking service
     console.error('Error reported:', errorData);
   }
   ```

### Health Checks
1. **Application health endpoint**:
   ```typescript
   // Add to your API
   app.get('/health', (req, res) => {
     res.json({
       status: 'healthy',
       timestamp: new Date().toISOString(),
       version: process.env.npm_package_version,
       environment: process.env.NODE_ENV
     });
   });
   ```

2. **Client-side health monitoring**:
   ```typescript
   async function checkApplicationHealth() {
     const checks = {
       supabase: await testSupabaseConnection(),
       localStorage: testLocalStorage(),
       performance: checkPerformanceMetrics()
     };
     
     return {
       healthy: Object.values(checks).every(Boolean),
       checks,
       timestamp: new Date().toISOString()
     };
   }
   ```

## Quick Reference

### Pre-deployment Checklist
- [ ] All TypeScript errors resolved
- [ ] Build completes successfully
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Bundle size within limits
- [ ] Performance benchmarks met
- [ ] Error boundaries implemented
- [ ] Security headers configured

### Emergency Rollback
If deployment fails:
1. Revert to previous version in Vercel dashboard
2. Check error logs in Vercel Functions tab
3. Verify environment variables
4. Test locally with production build: `npm run build && npm run preview`

### Useful Commands
```bash
# Local production testing
npm run build && npm run preview

# Type checking
npm run typecheck

# Bundle analysis
npm run build -- --analyze

# Clear caches
rm -rf node_modules/.vite
rm -rf dist
npm install

# Test specific deployment scenario
NODE_ENV=production npm run build
```