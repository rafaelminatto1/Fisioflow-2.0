
import { GoogleGenAI } from "@google/genai";
import { AIProvider, AIResponse, AIQueryLog } from '../../types';
import { cacheService } from './cacheService';
import { knowledgeService } from './knowledgeService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key is missing. AI features will be limited. Please set VITE_GEMINI_API_KEY environment variable.");
}

const PROMPT_TEMPLATE_SCHEDULING = `
# Persona
Você é o Rafa, o assistente virtual da Clínica FisioFlow. Sua personalidade é amigável, prestativa e eficiente. Seu objetivo é facilitar ao máximo a vida do cliente. Você se comunica em Português do Brasil.

# Contexto
Um cliente acessou o chat para agendar uma consulta. A conversa completa até agora é:
{{chat_history}}

# Tarefa
Continue a conversa para agendar uma consulta, seguindo estritamente o fluxo abaixo. Aja como se você tivesse acesso real à agenda da clínica para verificar horários.

1.  **Apresentação (se for o início da conversa):** Se o histórico estiver vazio ou contiver apenas sua saudação, apresente-se como "Rafa" e pergunte se o cliente já é paciente da FisioFlow.
2.  **Identificar Intenção:** Se o cliente disser que quer agendar, prossiga.
3.  **Novo Cliente:** Se ele disser que é a primeira vez, explique que a primeira consulta é uma "Avaliação Completa" de 50 minutos. Pergunte sobre sua disponibilidade (dias da semana e períodos como "manhã" ou "tarde").
4.  **Cliente Recorrente:** Se ele disser que já é paciente, pergunte se ele deseja marcar uma "Sessão de Tratamento" e se tem preferência por algum fisioterapeuta (Dra. Ana, Dr. Roberto, Dr. Fernando) ou dia/período.
5.  **Oferecer Horários:** Com base nas respostas do cliente, **INVENTE 3 OPÇÕES DE HORÁRIOS VAGOS E REALISTAS** para a próxima semana (ex: "próxima quarta-feira", "terça-feira que vem"). Apresente-as de forma clara (ex: "14:00, 15:00 ou 16:30"). NÃO diga que está simulando, aja como se fossem horários reais.
6.  **Confirmação:** Após o cliente escolher um horário, confirme TODOS os detalhes: nome do procedimento (Avaliação ou Sessão), nome do fisioterapeuta (se aplicável), dia da semana, data e hora.
7.  **Finalização:** Termine informando que um lembrete será enviado via WhatsApp 24h antes da consulta. Despeça-se cordialmente.

# Exemplo de Fluxo
**Cliente:** "Quero marcar uma consulta."
**Você:** "Claro! Para eu poder ajudar melhor, você já é nosso paciente aqui na FisioFlow?"
... (continua o fluxo) ...
`;


class AiOrchestratorService {
  private ai: GoogleGenAI;
  private logs: AIQueryLog[] = [];
  private stats = {
      totalQueries: 0,
      cacheHits: 0,
      knowledgeBaseHits: 0,
      apiHits: 0
  };
  private providerRotation: AIProvider[] = [
    AIProvider.GEMINI,
    AIProvider.CHATGPT,
    AIProvider.CLAUDE,
    AIProvider.PERPLEXITY,
    AIProvider.MARS,
  ];
  private currentProviderIndex = 0;
  
  constructor() {
    if (API_KEY && API_KEY !== 'dummy-key-for-development') {
      this.ai = new GoogleGenAI({ apiKey: API_KEY });
    } else {
      // Mock para desenvolvimento sem API key
      this.ai = {
        models: {
          generateContent: async () => ({
            text: 'Recurso de IA não disponível no momento. Configure a API key do Gemini.'
          })
        }
      } as any;
    }
  }

  private logQuery(prompt: string, response: AIResponse) {
    this.stats.totalQueries++;
    this.logs.unshift({
        id: Date.now(),
        prompt,
        timestamp: new Date(),
        ...response
    });
    // Keep logs to a reasonable size
    if (this.logs.length > 50) {
        this.logs.pop();
    }
  }

  /**
   * Retrieves an answer for a given prompt, following the RAG strategy:
   * 1. Check for scheduling intent.
   * 2. Check session Cache.
   * 3. Search internal Knowledge Base.
   * 4. Query external premium AI provider (simulated rotation).
   * @param prompt The user's question.
   * @param chatHistory The full conversation history.
   * @returns A promise that resolves to an AIResponse.
   */
  async getResponse(prompt: string, chatHistory: { text: string; sender: 'user' | 'bot' }[] = []): Promise<AIResponse> {
    const lowerCasePrompt = prompt.toLowerCase();
    const schedulingKeywords = ['agendar', 'marcar', 'consulta', 'horário', 'agenda', 'sessão'];

    // 1. Prioritize scheduling intent if keywords are present
    if (schedulingKeywords.some(keyword => lowerCasePrompt.includes(keyword))) {
        this.stats.apiHits++;
        const provider = this.providerRotation[this.currentProviderIndex];
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providerRotation.length;

        const formattedHistory = chatHistory
            .map(m => `${m.sender === 'user' ? 'Cliente' : 'Você'}: ${m.text}`)
            .join('\n');
        
        const schedulingPrompt = PROMPT_TEMPLATE_SCHEDULING.replace('{{chat_history}}', formattedHistory);

        try {
            if (!this.ai || !API_KEY || API_KEY === 'dummy-key-for-development') {
                const fallbackResponse: AIResponse = {
                    content: "Olá! Sou o Rafa, assistente virtual da FisioFlow. Para agendar uma consulta, por favor entre em contato conosco pelo telefone ou WhatsApp. No momento, estou com acesso limitado à agenda.",
                    source: provider
                };
                this.logQuery(prompt, fallbackResponse);
                return fallbackResponse;
            }

            const result = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: schedulingPrompt,
            });

            const response: AIResponse = {
                content: result.text,
                source: provider,
            };
            this.logQuery(prompt, response);
            // Don't cache conversational responses as they are context-dependent
            return response;
        } catch (error) {
            console.error("Error calling Gemini API for scheduling:", error);
            const fallbackResponse: AIResponse = {
                content: "Desculpe, estou com problemas para acessar a agenda no momento. Por favor, tente novamente em alguns instantes.",
                source: AIProvider.GEMINI
            };
            this.logQuery(prompt, fallbackResponse);
            return fallbackResponse;
        }
    }
    
    // 2. Check Cache
    const cachedResponse = cacheService.get(prompt);
    if (cachedResponse) {
        this.stats.cacheHits++;
        const response: AIResponse = { ...cachedResponse, source: AIProvider.CACHE };
        this.logQuery(prompt, response);
        return response;
    }
    
    // 3. Search Knowledge Base
    const kbResult = knowledgeService.search(prompt);
    if (kbResult) {
        this.stats.knowledgeBaseHits++;
        const response: AIResponse = {
            content: kbResult.content,
            source: AIProvider.INTERNAL_KB
        };
        this.logQuery(prompt, response);
        cacheService.set(prompt, response); // Cache the KB response
        return response;
    }

    // 4. Query External AI (Generic)
    this.stats.apiHits++;
    const provider = this.providerRotation[this.currentProviderIndex];
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providerRotation.length;

    try {
        if (!this.ai || !API_KEY || API_KEY === 'dummy-key-for-development') {
            const fallbackResponse: AIResponse = {
                content: "Desculpe, o recurso de IA não está disponível no momento. Configure a API key do Gemini para usar esta funcionalidade.",
                source: provider
            };
            this.logQuery(prompt, fallbackResponse);
            return fallbackResponse;
        }

        const result = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const response: AIResponse = {
            content: result.text,
            source: provider
        };
        this.logQuery(prompt, response);
        cacheService.set(prompt, response);
        return response;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get response from external AI provider.");
    }
  }
  
  /**
   * Returns the collected logs of AI queries.
   */
  getLogs(): AIQueryLog[] {
      return this.logs;
  }
  
  /**
   * Returns the collected statistics on AI query sources.
   */
  getStats() {
      return this.stats;
  }
}

// Export a singleton instance of the service
export const aiOrchestratorService = new AiOrchestratorService();
