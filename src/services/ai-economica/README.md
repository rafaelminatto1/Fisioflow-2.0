# Sistema de IA Econômica - FisioFlow 2.0

## Visão Geral

O Sistema de IA Econômica é uma solução completa que prioriza economia e eficiência ao utilizar recursos de Inteligência Artificial. O sistema implementa uma estratégia em cascata que busca primeiro na base de conhecimento interna, depois no cache, e por último utiliza contas premium pagas, evitando completamente APIs pagas por uso.

## 🎯 Objetivos

- **Economia**: Maximizar ROI das assinaturas premium existentes
- **Eficiência**: Resposta rápida através de cache inteligente
- **Conhecimento**: Construir base proprietária valiosa
- **Qualidade**: Manter alta qualidade nas respostas
- **Monitoramento**: Analytics completos de uso e economia

## 🏗️ Arquitetura

### Componentes Principais

1. **AIService** - Orquestrador principal que coordena todo o fluxo
2. **KnowledgeBaseService** - Gerencia a base de conhecimento interna
3. **CacheService** - Sistema de cache multi-camada (Memory + LocalStorage + IndexedDB)
4. **PremiumAccountManager** - Gerencia contas premium e balanceamento de carga
5. **AnalyticsService** - Coleta métricas e gera relatórios de economia

### Fluxo de Processamento

```
Consulta → Base Interna → Cache → Provedor Premium → Resposta
    ↓           ↓          ↓           ↓
 [Analytics] [Analytics] [Analytics] [Analytics]
```

## 🚀 Instalação e Uso

### Uso Básico

```typescript
import { processAIQuery, QueryType } from '@/services/ai-economica';

// Processar consulta
const response = await processAIQuery(
  "Como tratar dor lombar crônica?",
  QueryType.PROTOCOL_SUGGESTION,
  {
    userRole: 'Fisioterapeuta',
    symptoms: ['dor lombar', 'rigidez'],
    diagnosis: 'Lombalgia crônica'
  }
);

console.log(response.content);
```

### Adicionar Conhecimento

```typescript
import { addKnowledge } from '@/services/ai-economica';

const entryId = await addKnowledge({
  type: 'protocol',
  title: 'Protocolo para Dor Lombar',
  content: 'Descrição detalhada do protocolo...',
  techniques: ['Mobilização', 'Exercícios'],
  conditions: ['Lombalgia'],
  author: {
    id: 'user123',
    name: 'Dr. João',
    role: 'Fisioterapeuta',
    experience: 10
  }
});
```

### Componentes React

```typescript
import { KnowledgeContribution, AdminPanel } from '@/components/ai-economica';

// Formulário para contribuir conhecimento
<KnowledgeContribution 
  onSaved={(entryId) => console.log('Salvo:', entryId)}
  onClose={() => setShowForm(false)}
/>

// Painel administrativo
<AdminPanel className="w-full h-screen" />
```

## 📊 Analytics e Monitoramento

### Métricas Disponíveis

- **Consultas**: Total, por fonte, por tipo, por provedor
- **Performance**: Tempo de resposta, cache hit rate, taxa de sucesso
- **Economia**: Savings estimados, uso por provedor, ROI
- **Qualidade**: Confiança média, satisfação do usuário

### Relatórios

```typescript
import { getAnalytics, getDetailedReport } from '@/services/ai-economica';

// Analytics em tempo real
const analytics = await getAnalytics();

// Relatório detalhado
const report = await getDetailedReport('30d');
console.log('Economia no mês:', report.summary.economy.estimatedSavings);
```

## 🔧 Configuração

### Arquivo de Configuração

O sistema é configurado através do arquivo `config/ai-economica.config.ts`:

```typescript
export const AI_ECONOMICA_CONFIG = {
  system: {
    enabled: true,
    maxConcurrentQueries: 10,
    defaultTimeout: 30000
  },
  
  knowledgeBase: {
    enabled: true,
    minConfidenceThreshold: 0.7,
    maxResults: 10
  },
  
  cache: {
    enabled: true,
    maxSize: 100 * 1024 * 1024, // 100MB
    defaultTTL: 24 * 60 * 60 * 1000 // 24h
  },
  
  providers: {
    [PremiumProvider.CHATGPT_PLUS]: {
      enabled: true,
      limits: { monthly: 2000, daily: 100, perHour: 10 }
    }
    // ... outros provedores
  }
};
```

### Variáveis de Ambiente

```env
# Gemini Pro API Key (se usando API direta)
VITE_GEMINI_API_KEY=your_api_key_here

# Configurações de desenvolvimento
VITE_AI_ECONOMICA_DEBUG=true
```

## 🔐 Segurança e Privacidade

### Anonimização Automática

O sistema automaticamente remove informações pessoais antes de enviar para provedores externos:

- CPFs, telefones, emails são mascarados
- Nomes próprios são substituídos por placeholders
- IDs de pacientes são hasheados

### Criptografia

- Cache sensível é criptografado com AES-256
- Dados em trânsito usam HTTPS/TLS
- Logs não incluem informações pessoais

## 📈 Performance

### Benchmarks

- **Tempo de resposta médio**: < 2 segundos
- **Cache hit rate alvo**: > 70%
- **Economia estimada**: 80-90% vs APIs pagas por uso
- **Disponibilidade**: > 99.5%

### Otimizações

- Cache multi-camada com promoção automática
- Busca fuzzy para aumentar hit rate da base interna
- Balanceamento inteligente entre provedores premium
- Pré-aquecimento de cache para consultas frequentes

## 🏥 Casos de Uso Específicos

### 1. Sugestão de Protocolo Clínico

```typescript
const response = await processAIQuery(
  "Protocolo para reabilitação pós-cirúrgica de LCA",
  QueryType.PROTOCOL_SUGGESTION,
  {
    userRole: 'Fisioterapeuta',
    diagnosis: 'Reconstrução de LCA',
    previousTreatments: ['Fisioterapia pré-operatória']
  }
);
```

### 2. Recomendação de Exercícios

```typescript
const response = await processAIQuery(
  "Exercícios para fortalecimento de core em paciente idoso",
  QueryType.EXERCISE_RECOMMENDATION,
  {
    userRole: 'Fisioterapeuta',
    patientAge: 70,
    contraindications: ['Osteoporose']
  }
);
```

### 3. Auxílio Diagnóstico

```typescript
const response = await processAIQuery(
  "Análise de dor no ombro com limitação de movimento",
  QueryType.DIAGNOSIS_HELP,
  {
    userRole: 'Fisioterapeuta',
    symptoms: ['dor no ombro', 'limitação ROM', 'dor noturna'],
    duration: '3 semanas'
  }
);
```

## 🧪 Testes

### Estrutura de Testes

```bash
src/services/ai-economica/
├── __tests__/
│   ├── aiService.test.ts
│   ├── knowledgeBaseService.test.ts
│   ├── cacheService.test.ts
│   ├── premiumAccountManager.test.ts
│   └── analyticsService.test.ts
```

### Executar Testes

```bash
# Todos os testes
npm test ai-economica

# Testes específicos
npm test aiService.test.ts

# Testes com coverage
npm run test:coverage ai-economica
```

## 📋 Tipos Principais

### AIQuery

```typescript
interface AIQuery {
  id: string;
  text: string;
  type: QueryType;
  context: {
    patientId?: string;
    symptoms?: string[];
    diagnosis?: string;
    userRole: string;
  };
  priority: 'low' | 'normal' | 'high';
  maxResponseTime: number;
  hash: string;
  createdAt: string;
}
```

### AIResponse

```typescript
interface AIResponse {
  id: string;
  queryId: string;
  content: string;
  confidence: number;
  source: 'internal' | 'cache' | 'premium';
  provider?: PremiumProvider;
  references: Reference[];
  suggestions: string[];
  followUpQuestions: string[];
  responseTime: number;
  metadata: {
    evidenceLevel?: 'low' | 'moderate' | 'high';
    reliability: number;
    relevance: number;
  };
}
```

## 🚦 Status e Saúde do Sistema

### Verificação de Status

```typescript
import { getSystemStatus } from '@/services/ai-economica';

const status = await getSystemStatus();
console.log('Sistema:', status.status); // 'operational' | 'degraded' | 'error'
console.log('Uptime:', status.uptime);
console.log('Queries processadas:', status.stats.requests.total);
```

### Health Checks

O sistema realiza verificações automáticas:

- Conectividade com provedores premium
- Integridade da base de conhecimento
- Performance do cache
- Uso de recursos

## 🔄 Ciclo de Vida

### Inicialização

```typescript
import { initializeAIEconomica } from '@/services/ai-economica';

const result = await initializeAIEconomica({
  // Configurações customizadas
  cache: { maxSize: 200 * 1024 * 1024 }
});

if (result.success) {
  console.log('Sistema inicializado:', result.status);
} else {
  console.error('Erro na inicialização:', result.error);
}
```

### Cleanup

```typescript
import { destroyServices } from '@/services/ai-economica';

// Limpar recursos antes de sair
window.addEventListener('beforeunload', () => {
  destroyServices();
});
```

## 📚 Exemplos Avançados

### Hook React Personalizado

```typescript
import { useEffect, useState } from 'react';
import { useAIEconomica } from '@/services/ai-economica';

export const useAIQuery = (query: string, type: QueryType, context: any) => {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { processQuery } = useAIEconomica();

  useEffect(() => {
    if (query) {
      setLoading(true);
      processQuery(query, type, context)
        .then(setResponse)
        .catch(setError)
        .finally(() => setLoading(false));
    }
  }, [query, type, context]);

  return { response, loading, error };
};
```

### Integração com Formulários

```typescript
const DiagnosisForm = () => {
  const [symptoms, setSymptoms] = useState([]);
  const { response, loading } = useAIQuery(
    symptoms.length > 0 ? `Análise de sintomas: ${symptoms.join(', ')}` : '',
    QueryType.DIAGNOSIS_HELP,
    { userRole: 'Fisioterapeuta', symptoms }
  );

  return (
    <form>
      {/* Campos do formulário */}
      {response && (
        <div className="ai-suggestion">
          <h3>Sugestão da IA:</h3>
          <p>{response.content}</p>
          <div className="confidence">
            Confiança: {(response.confidence * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </form>
  );
};
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Cache não funciona**
   - Verificar se localStorage/IndexedDB estão disponíveis
   - Verificar limites de quota do navegador

2. **Provedores premium offline**
   - Verificar conectividade de rede
   - Verificar credenciais e limites de uso

3. **Base de conhecimento vazia**
   - Importar dados iniciais ou incentivar contribuições
   - Verificar permissões de escrita

### Logs e Debug

```typescript
import { aiLogger, LogLevel } from '@/services/ai-economica';

// Habilitar logs detalhados
aiLogger.setLevel(LogLevel.DEBUG);

// Buscar logs específicos
const recentLogs = aiLogger.getLogs({
  level: LogLevel.ERROR,
  limit: 50,
  since: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
});
```

## 🤝 Contribuindo

### Adicionando Novo Provedor

1. Criar cliente no `premiumAccountManager.ts`
2. Adicionar configuração em `ai-economica.config.ts`
3. Atualizar tipos em `ai-economica.types.ts`
4. Adicionar testes correspondentes

### Melhorando Performance

- Otimizar algoritmos de busca na base interna
- Implementar compressão de cache
- Melhorar estratégias de pré-aquecimento

## 📞 Suporte

Para dúvidas ou problemas:

1. Verificar logs do sistema
2. Consultar documentação detalhada
3. Verificar issues conhecidos
4. Contatar equipe de desenvolvimento

---

**Versão**: 1.0.0  
**Última atualização**: Janeiro 2025  
**Compatibilidade**: React 19+, TypeScript 5+