# FisioFlow 2.0 Deployment Guide

This document provides comprehensive instructions for deploying FisioFlow 2.0 to various environments.

## Prerequisites

Before deploying, ensure you have:

1. **Node.js 18+** installed
2. **Vercel CLI** installed globally: `npm install -g vercel`
3. **Git** repository set up
4. **Vercel account** with project configured
5. **Environment variables** configured in Vercel dashboard

## Environment Variables

Configure these environment variables in your Vercel dashboard:

### Required Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Configuration
VITE_GEMINI_API_KEY=your-gemini-api-key

# Application Configuration
VITE_APP_NAME=FisioFlow 2.0
VITE_APP_VERSION=2.0.0
VITE_APP_ENVIRONMENT=production
```

### Optional Variables

```bash
# Analytics & Monitoring
VITE_SENTRY_DSN=your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=your-ga-id

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Security
VITE_ENABLE_CSP=true
VITE_ENABLE_HTTPS_ONLY=true
```

## Deployment Methods

### 1. Automated Deployment (Recommended)

The project uses GitHub Actions for automated deployment:

- **Preview deployments**: Automatically created for pull requests
- **Production deployments**: Automatically deployed when pushing to `main` branch

#### Setup GitHub Actions

1. Add these secrets to your GitHub repository:
   ```
   VERCEL_TOKEN=your-vercel-token
   VERCEL_ORG_ID=your-vercel-org-id
   VERCEL_PROJECT_ID=your-vercel-project-id
   ```

2. Push to `main` branch or create a pull request to trigger deployment

### 2. Manual Deployment

#### Preview Deployment

```bash
# Deploy to preview environment
npm run deploy:preview

# Or with custom options
npm run deploy -- --preview --verbose
```

#### Production Deployment

```bash
# Deploy to production
npm run deploy:production

# Or with custom options
npm run deploy -- --production --skip-tests
```

#### Direct Vercel Commands

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### 3. Local Development Deployment

For testing deployment locally:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build application
npm run build

# Preview build locally
npm run preview
```

## Deployment Script Options

The deployment script (`scripts/deploy.ts`) supports various options:

```bash
# Basic usage
npm run deploy [options]

# Options:
--production, --prod    # Deploy to production
--preview              # Deploy to preview (default)
--branch <name>        # Specify git branch
--skip-build           # Skip build step
--skip-tests           # Skip test step
--verbose, -v          # Verbose output
--help, -h             # Show help
```

### Examples

```bash
# Deploy to preview with verbose output
npm run deploy -- --preview --verbose

# Deploy to production, skipping tests
npm run deploy -- --production --skip-tests

# Deploy specific branch to preview
npm run deploy -- --preview --branch feature/new-feature
```

## Build Process

The deployment process includes:

1. **Prerequisites Check**: Verifies Vercel CLI, Git status, and project structure
2. **Testing**: Runs unit tests, linting, and type checking
3. **Building**: Compiles the application for production
4. **Build Info Generation**: Creates build metadata
5. **Deployment**: Uploads to Vercel
6. **Post-deployment Checks**: Verifies deployment health

## Environment-Specific Configurations

### Preview Environment

- Used for testing features and pull requests
- Includes development tools and debugging
- Less strict security policies
- Temporary URLs that expire

### Production Environment

- Optimized for performance and security
- Strict security headers and CSP
- Error reporting and analytics enabled
- Permanent URLs with custom domain

## Monitoring and Analytics

### Performance Monitoring

- **Lighthouse CI**: Automated performance audits on pull requests
- **Core Web Vitals**: Monitored in production
- **Bundle Analysis**: Size tracking and optimization

### Error Monitoring

- **Sentry Integration**: Real-time error tracking
- **Custom Error Logging**: Application-specific error handling
- **Performance Metrics**: Response times and user experience

### Analytics

- **Google Analytics**: User behavior tracking
- **Custom Events**: Feature usage analytics
- **Conversion Tracking**: Business metrics

## Security Considerations

### Headers

The deployment includes security headers:

```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
}
```

### Content Security Policy

CSP is configured to prevent XSS attacks and unauthorized resource loading.

### HTTPS Enforcement

All traffic is redirected to HTTPS in production.

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build locally
   npm run build
   
   # Check for TypeScript errors
   npm run type-check
   
   # Check for linting issues
   npm run lint
   ```

2. **Environment Variable Issues**
   ```bash
   # Verify environment variables in Vercel
   vercel env ls
   
   # Pull environment variables locally
   vercel env pull .env.local
   ```

3. **Deployment Timeouts**
   ```bash
   # Deploy with verbose output
   npm run deploy -- --verbose
   
   # Check Vercel function logs
   vercel logs
   ```

### Debug Mode

Enable debug mode for detailed deployment information:

```bash
# Set debug environment variable
DEBUG=vercel* npm run deploy

# Or use verbose flag
npm run deploy -- --verbose
```

### Rollback

If a deployment fails, you can rollback to a previous version:

```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote <deployment-url>
```

## Performance Optimization

### Build Optimization

- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Removes unused code
- **Asset Optimization**: Images and fonts optimized
- **Compression**: Gzip and Brotli compression enabled

### Caching Strategy

- **Static Assets**: Long-term caching (1 year)
- **HTML Files**: Short-term caching (5 minutes)
- **API Responses**: Custom caching based on content

### CDN Configuration

Vercel's global CDN is configured for:
- **Edge Caching**: Static assets served from edge locations
- **Dynamic Content**: Server-side rendering at the edge
- **Geographic Distribution**: Optimized for global users

## Maintenance

### Regular Tasks

1. **Dependency Updates**: Monthly security updates
2. **Performance Audits**: Weekly Lighthouse checks
3. **Error Monitoring**: Daily error log reviews
4. **Analytics Review**: Weekly performance metrics

### Automated Maintenance

- **Dependabot**: Automated dependency updates
- **Security Scanning**: Automated vulnerability checks
- **Performance Monitoring**: Continuous performance tracking

## 🆕 Latest Features in Production

### Sistema de Gestão de Inventário (v2.1)

A aplicação agora inclui um sistema completo de gestão de inventário:

#### 📦 **Funcionalidades Implementadas**
- **Controle de Estoque**: CRUD completo para itens consumíveis e equipamentos
- **Movimentações**: Sistema de rastreamento com histórico detalhado
- **Alertas**: Notificações automáticas para estoque baixo e manutenção
- **Relatórios**: Geração de relatórios de inventário e movimentações
- **Integração**: Modal de consulta durante atendimentos

#### 🏗️ **Arquitetura**
- **Services**: `inventoryService.ts`, `equipmentService.ts`, `inventoryReportsService.ts`
- **Hooks**: `useInventory.ts`, `useEquipment.ts`, `useInventoryMovements.ts`
- **Components**: 9 componentes UI completos
- **Pages**: `InventoryPage.tsx`, `EquipmentPage.tsx`
- **Routes**: `/inventory` e `/equipment` integradas ao sistema

#### ✅ **Status de Deployment**
- **Build**: ✅ Compatível com produção (2735+ módulos)
- **Tests**: ✅ 7 testes passando (100% coverage)
- **TypeScript**: ✅ Tipagem completa com validação Zod
- **Integration**: ✅ Totalmente integrado ao sistema existente

#### 🔗 **Acesso**
- **Inventário**: `/inventory` - Lista e gestão de itens
- **Equipamentos**: `/equipment` - Gestão específica de equipamentos
- **Durante Consultas**: Modal de consulta integrado no AtendimentoPage

## Support

For deployment issues:

1. Check the [Vercel documentation](https://vercel.com/docs)
2. Review GitHub Actions logs
3. Check Vercel deployment logs
4. Contact the development team

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Supabase Deployment Guide](https://supabase.com/docs/guides/hosting/vercel)