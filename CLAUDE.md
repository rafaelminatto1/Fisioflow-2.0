# Fisioflow 2.0 - Documentação do Projeto

## Visão Geral
Fisioflow 2.0 é uma aplicação React completa para gestão de clínicas de fisioterapia, desenvolvida em TypeScript com Vite. O sistema oferece três portais distintos: Terapeuta, Paciente e Parceiro (Educador Físico).

## Tecnologias Principais
- **Frontend**: React 19.1.1 + TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Roteamento**: React Router DOM 7.7.1
- **Ícones**: Lucide React 0.534.0
- **Gráficos**: Recharts 3.1.0
- **Formulários**: React Hook Form 7.52.1 + Zod 3.23.8
- **IA**: Google Gemini API 1.12.0
- **Testes**: Vitest 3.2.4 + Testing Library

## Estrutura do Projeto

### Diretórios Principais
```
/components/          # Componentes reutilizáveis
  /analytics/         # Componentes de análise clínica
  /dashboard/         # Componentes do dashboard principal
  /forms/             # Formulários especializados
  /partner-portal/    # Componentes do portal de parceiros
  /patient-portal/    # Componentes do portal de pacientes
  /reports/           # Componentes de relatórios
  /ui/                # Componentes de interface base

/contexts/            # Contextos React (Auth, Toast)
/data/                # Dados mock e simulações
/hooks/               # Custom hooks
/layouts/             # Layouts principais dos portais
/pages/               # Páginas da aplicação
/services/            # Lógica de negócio e APIs
  /ai/                # Serviços de IA/orchestração
  /ai-economica/      # Sistema de IA econômica
  /scheduling/        # Serviços de agendamento
/tests/               # Testes automatizados
```

### Portais da Aplicação

#### Portal do Terapeuta (/) 
**Roles**: Admin, Therapist
- Dashboard com métricas e KPIs
- Gestão de pacientes e prontuários
- Agenda e agendamentos
- Biblioteca de exercícios
- Análises clínicas e financeiras
- Relatórios e auditoria
- Configurações e assinaturas

#### Portal do Paciente (/portal/)
**Role**: Patient
- Dashboard pessoal
- Diário de dor e progresso
- Consultas agendadas
- Loja de vouchers de parceiros
- Documentos e atestados

#### Portal do Parceiro (/partner/)
**Role**: EducadorFisico
- Dashboard de educador físico
- Gestão de clientes
- Biblioteca de exercícios específica
- Relatórios financeiros

## Arquitetura de Serviços

### Serviços Core
- `authService.ts` - Autenticação e sessões
- `patientService.ts` - Gestão de pacientes
- `appointmentService.ts` - Sistema de agendamentos
- `soapNoteService.ts` - Prontuários SOAP
- `exerciseService.ts` - Biblioteca de exercícios
- `groupService.ts` - Gestão de grupos terapêuticos
- `taskService.ts` - Sistema de tarefas Kanban

### Sistema de IA
- `ai/aiOrchestratorService.ts` - Orquestração de múltiplos provedores
- `ai-economica/aiService.ts` - IA para análises econômicas
- `geminiService.ts` - Integração específica com Gemini
- Cache inteligente para otimização de custos

### Agendamento Avançado
- `schedulingRulesEngine.ts` - Motor de regras
- `scheduling/conflictDetection.ts` - Detecção de conflitos
- `scheduling/recurrenceService.ts` - Recorrência de consultas

### Sistema de Parceria
- `partnershipService.ts` - Gestão de parcerias
- `voucherService.ts` - Sistema de vouchers

## Tipos TypeScript Principais

### Core Types
```typescript
enum Role {
  Admin = 'Admin',
  Therapist = 'Fisioterapeuta', 
  Patient = 'Paciente',
  EducadorFisico = 'EducadorFisico'
}

interface Patient {
  id: string;
  name: string;
  cpf: string;
  // ... demais campos
  trackedMetrics?: TrackedMetric[];
}

interface Appointment {
  id: string;
  patientId: string;
  therapistId: string;
  startTime: Date;
  endTime: Date;
  type: AppointmentType;
  status: AppointmentStatus;
  recurrenceRule?: RecurrenceRule;
}
```

## Funcionalidades Principais

### 1. Gestão de Pacientes
- Cadastro completo com dados médicos
- Histórico clínico e anexos
- Métricas personalizadas de acompanhamento
- Status de atividade e alta

### 2. Sistema de Agendamento
- Agendamento individual e recorrente
- Detecção automática de conflitos
- Diferentes tipos de consulta (Avaliação, Sessão, Retorno)
- Heatmap de ocupação

### 3. Prontuário Eletrônico (SOAP)
- Metodologia SOAP (Subjetivo, Objetivo, Avaliação, Plano)
- Anexos e resultados de métricas
- Mapa corporal interativo
- Escala de dor

### 4. Biblioteca de Exercícios
- Categorização por tipo e dificuldade
- Vídeos demonstrativos
- Contraindicações e modificações
- Sistema de aprovação

### 5. Grupos Terapêuticos
- Gestão de grupos com gamificação
- Métricas de adesão e progresso
- Sistema de pontos e badges
- Agendamento de sessões em grupo

### 6. Sistema de IA
- Múltiplos provedores (Gemini, ChatGPT, Claude, etc.)
- Cache inteligente para economia
- Base de conhecimento interna
- Análises econômicas automatizadas

### 7. Analytics e Relatórios
- Dashboard com KPIs clínicos
- Análise de fluxo de pacientes
- Relatórios financeiros
- Auditoria de ações

## Comandos de Desenvolvimento

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview da build
```

## Configurações

### Vite Config
- Alias `@/*` para raiz do projeto
- Variáveis de ambiente para Gemini API
- Configuração para desenvolvimento local

### TypeScript
- Target ES2022 com JSX
- Module resolution: bundler
- Decorators experimentais habilitados

## Padrões de Código
- Componentes funcionais com TypeScript
- Custom hooks para lógica reutilizável
- Context API para estado global
- Separação clara entre apresentação e lógica
- Mock data para desenvolvimento

## Status do Projeto
- **Versão**: 0.0.0 (desenvolvimento inicial)
- **Branch principal**: main
- **Commits recentes**: Estrutura inicial e componentes core implementados

## Análise de Melhorias

### Prioridade Crítica (Imediato)

#### 1. Segurança
- **authService.ts:12** - Senha hardcoded `password123` deve ser substituída
- **Armazenamento de sessão** - Dados sensíveis sem criptografia
- **Variáveis de ambiente** - API keys expostas no build
- **Sanitização de entrada** - Falta validação XSS

#### 2. Qualidade do Código
- **Padrões React** - Imports desnecessários do React (105 arquivos)
- **Gerenciamento de estado** - Falta estratégia centralizada
- **Tratamento de erro** - Ausência de error boundaries adequados
- **Cliente API** - Serviços individuais precisam ser centralizados

### Prioridade Alta (1-2 semanas)

#### 3. Performance
- **usePatients.ts** - Dependencies desnecessárias causando re-renders
- **Code splitting** - Implementar lazy loading para rotas
- **Memoização** - Adicionar React.memo em componentes pesados
- **Bundle size** - Otimizar tamanho do pacote

#### 4. Workflow de Desenvolvimento
- **Testes** - Apenas 1 arquivo de teste encontrado
- **Linting** - ESLint/Prettier configurados mas não implementados
- **Pre-commit hooks** - Implementar Husky
- **CI/CD** - Pipeline automatizado ausente

### Prioridade Média (1 mês)

#### 5. TypeScript
- **Validação runtime** - Implementar schemas Zod
- **Type guards** - Adicionar para respostas de API
- **Strict mode** - Configuração mais rigorosa
- **Utility types** - Melhor aproveitamento dos tipos avançados

#### 6. Arquitetura
- **Composition patterns** - Melhorar reutilização de componentes
- **Context optimization** - Valores recriados a cada render
- **Estado global** - Considerar Redux ou Zustand
- **Error boundaries** - Implementar em todas as seções

### Implementação Sugerida

```bash
# Fase 1 - Segurança
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken

# Fase 2 - Desenvolvimento  
npm install --save-dev eslint prettier husky lint-staged
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Fase 3 - Testes
npm install --save-dev @testing-library/user-event msw
npm install --save-dev cypress @cypress/react

# Fase 4 - Performance
npm install --save-dev @vitejs/plugin-react-swc
npm install react-virtualized react-window
```

### Arquivos Prioritários para Correção

1. **services/authService.ts** - Refatoração completa de segurança
2. **hooks/usePatients.ts** - Otimização de performance  
3. **vite.config.ts** - Segurança das variáveis de ambiente
4. **tsconfig.json** - Configuração strict mode
5. **components/ErrorBoundary.tsx** - Implementar tratamento global

### Métricas de Sucesso
- [ ] Cobertura de testes > 70%
- [ ] Tempo de build < 30s
- [ ] Bundle size < 1MB
- [ ] Zero vulnerabilidades de segurança
- [ ] Lighthouse score > 90
- [ ] TypeScript strict mode ativo