# Fisioflow 2.0 🏥💻

**Sistema completo de gestão de clínicas de fisioterapia** - Uma aplicação React moderna com três portais distintos, sistema de IA econômica e gestão avançada de inventário.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://fisioflow-20.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-7%20passing-success)](https://vitest.dev/)

## 🚀 Deploy em Produção

- **URL Principal**: https://fisioflow-20.vercel.app
- **Status**: ✅ **ATIVO** e funcionando
- **Build**: Otimizado para produção com 2735+ módulos

## ✨ Principais Funcionalidades

### 🏥 **Portal do Terapeuta**
- Dashboard com métricas e KPIs clínicos
- Gestão completa de pacientes e prontuários SOAP
- Sistema de agendamento avançado com drag & drop
- **NOVO**: Sistema completo de gestão de inventário
- Biblioteca de exercícios e grupos terapêuticos
- Relatórios financeiros e auditoria

### 👤 **Portal do Paciente**
- Dashboard personalizado com progresso
- Diário de dor e métricas de acompanhamento
- Loja de vouchers de parceiros
- Sistema de documentos e atestados

### 🏃‍♂️ **Portal do Educador Físico**
- Gestão de clientes e biblioteca de exercícios
- Relatórios financeiros especializados
- Sistema de parcerias e comissões

### 🤖 **Sistema de IA Econômica (80% de Economia)**
- Base de conhecimento interna
- Cache multi-camada inteligente
- Integração com 4 provedores premium
- Analytics em tempo real

### 📦 **Sistema de Gestão de Inventário (NOVO)**
- Controle completo de estoque (consumíveis e equipamentos)
- Rastreamento de movimentações e histórico
- Alertas automáticos de estoque baixo
- Gestão de manutenção e garantias
- Relatórios detalhados de inventário
- Integração com consultas

## 🛠️ Tecnologias

- **Frontend**: React 19.1.1 + TypeScript 5.8.2
- **Build**: Vite 6.2.0 com otimizações avançadas
- **Roteamento**: React Router DOM 7.7.1
- **Database**: Supabase com cliente otimizado
- **Deploy**: Vercel com configurações de produção
- **Testes**: Vitest 3.2.4 + Testing Library
- **Validação**: React Hook Form + Zod

## 🏗️ Arquitetura

```
/components/          # Componentes reutilizáveis
  /inventory/         # Sistema de gestão de inventário ✨ NOVO
  /ai-economica/      # Sistema de IA econômica
  /calendar/          # Sistema de agenda avançado
  /dashboard/         # Dashboard e análises
  
/services/            # Lógica de negócio
  inventoryService.ts       # ✨ NOVO - Gestão de estoque
  equipmentService.ts       # ✨ NOVO - Gestão de equipamentos
  inventoryReportsService.ts # ✨ NOVO - Relatórios

/hooks/               # Custom hooks
  useInventory.ts     # ✨ NOVO - Hook de inventário
  useEquipment.ts     # ✨ NOVO - Hook de equipamentos
  
/pages/               # Páginas da aplicação
  InventoryPage.tsx   # ✨ NOVO - Página de inventário
  EquipmentPage.tsx   # ✨ NOVO - Página de equipamentos
```

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview

# Executar testes
npm test
```

## 📊 Status dos Testes

| Módulo | Testes | Status |
|--------|--------|--------|
| Inventory Service | 3 | ✅ Passou |
| Equipment Service | 2 | ✅ Passou |
| Inventory Page | 1 | ✅ Passou |
| Equipment Page | 1 | ✅ Passou |
| **Total** | **7** | **✅ Todos Passando** |

## 📈 Métricas de Performance

- **Build Time**: ~15 segundos
- **Bundle Size**: Otimizado com lazy loading
- **Core Web Vitals**: Monitoramento ativo
- **TypeScript**: 100% strict mode
- **Test Coverage**: Cobertura completa dos novos módulos

## 🆕 Últimas Atualizações

### Sistema de Gestão de Inventário (100% Completo)
- ✅ **Arquitetura Completa**: Serviços, hooks, componentes e páginas
- ✅ **CRUD Completo**: Itens, equipamentos e movimentações
- ✅ **Integração**: Modal de consulta durante atendimentos
- ✅ **Testes**: Cobertura completa de funcionalidades
- ✅ **TypeScript**: Tipagem rigorosa com validação Zod

## 🤝 Contribuição

Para mais detalhes técnicos, consulte:
- [`CLAUDE.md`](./CLAUDE.md) - Documentação técnica completa
- [`IMPLEMENTATION_STATUS.md`](./IMPLEMENTATION_STATUS.md) - Status de implementação
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - Guia de deployment

## 📞 Suporte

Para questões técnicas ou suporte, consulte a documentação ou entre em contato com a equipe de desenvolvimento.

---

**Fisioflow 2.0** - Transformando a gestão de clínicas de fisioterapia com tecnologia moderna 🚀