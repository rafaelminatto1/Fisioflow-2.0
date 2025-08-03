import { 
  AIResponse, 
  CacheEntry, 
  QueryType,
  CACHE_TTL 
} from '../../types/ai-economica.types';
import aiEconomicaConfig from '../../config/ai-economica.config';
import aiLogger, { LogCategory } from './logger';

interface CacheStorage {
  get(key: string): Promise<CacheEntry | null>;
  set(key: string, entry: CacheEntry): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  size(): Promise<number>;
  keys(): Promise<string[]>;
}

class LocalStorageCache implements CacheStorage {
  private prefix = 'ai_cache_';

  async get(key: string): Promise<CacheEntry | null> {
    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (!stored) return null;

      const entry: CacheEntry = JSON.parse(stored);
      
      // Verificar expiração
      if (entry.expiresAt <= Date.now()) {
        await this.delete(key);
        return null;
      }

      return entry;
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao buscar no localStorage', error as Error, { key });
      return null;
    }
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    try {
      const serialized = JSON.stringify(entry);
      
      // Verificar se cabe no localStorage
      if (serialized.length > aiEconomicaConfig.cache.localStorageMaxSize) {
        throw new Error('Entry too large for localStorage');
      }

      localStorage.setItem(this.prefix + key, serialized);
      aiLogger.logCacheOperation('set', key, serialized.length);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Tentar limpar espaço
        await this.cleanup();
        try {
          localStorage.setItem(this.prefix + key, JSON.stringify(entry));
        } catch (retryError) {
          aiLogger.error(LogCategory.CACHE, 'Quota do localStorage excedida após limpeza', retryError as Error);
          throw retryError;
        }
      } else {
        aiLogger.error(LogCategory.CACHE, 'Erro ao salvar no localStorage', error as Error, { key });
        throw error;
      }
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
    aiLogger.logCacheOperation('cleanup', key);
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    keys.forEach(key => localStorage.removeItem(this.prefix + key));
  }

  async size(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }

  private async cleanup(): Promise<void> {
    const keys = await this.keys();
    const entries: Array<{ key: string; entry: CacheEntry }> = [];

    // Coletar todas as entradas com metadados
    for (const key of keys) {
      const entry = await this.get(key);
      if (entry) {
        entries.push({ key, entry });
      }
    }

    // Ordenar por último acesso (menos recente primeiro)
    entries.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

    // Remover 25% das entradas mais antigas
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      await this.delete(entries[i].key);
    }
  }
}

class IndexedDBCache implements CacheStorage {
  private dbName = 'AIEconomicaCache';
  private storeName = 'cache';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });
  }

  async get(key: string): Promise<CacheEntry | null> {
    try {
      const db = await this.initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          
          if (!result || result.expiresAt <= Date.now()) {
            if (result) this.delete(key); // Limpar entrada expirada
            resolve(null);
          } else {
            resolve(result);
          }
        };
      });
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao buscar no IndexedDB', error as Error, { key });
      return null;
    }
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    try {
      const db = await this.initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(entry);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          aiLogger.logCacheOperation('set', key, JSON.stringify(entry).length);
          resolve();
        };
      });
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao salvar no IndexedDB', error as Error, { key });
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          aiLogger.logCacheOperation('cleanup', key);
          resolve();
        };
      });
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao deletar do IndexedDB', error as Error, { key });
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao limpar IndexedDB', error as Error);
    }
  }

  async size(): Promise<number> {
    try {
      const db = await this.initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.count();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao contar entradas no IndexedDB', error as Error);
      return 0;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const db = await this.initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAllKeys();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as string[]);
      });
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao buscar chaves no IndexedDB', error as Error);
      return [];
    }
  }
}

export class CacheService {
  private localStorageCache: CacheStorage;
  private indexedDBCache: CacheStorage;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.localStorageCache = new LocalStorageCache();
    this.indexedDBCache = new IndexedDBCache();
    
    this.setupPeriodicCleanup();
    this.preloadFrequentlyUsed();
  }

  async get(key: string): Promise<AIResponse | null> {
    if (!aiEconomicaConfig.cache.enabled) return null;

    try {
      // 1. Verificar cache em memória primeiro (mais rápido)
      let entry = this.memoryCache.get(key);
      
      if (entry && entry.expiresAt > Date.now()) {
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        aiLogger.logCacheOperation('hit', key);
        return entry.response;
      }

      // 2. Verificar localStorage
      if (aiEconomicaConfig.cache.enableLocalStorage) {
        entry = await this.localStorageCache.get(key);
        
        if (entry) {
          entry.accessCount++;
          entry.lastAccessed = Date.now();
          
          // Promover para memória cache
          this.memoryCache.set(key, entry);
          
          // Atualizar localStorage com novos contadores
          await this.localStorageCache.set(key, entry);
          
          aiLogger.logCacheOperation('hit', key);
          return entry.response;
        }
      }

      // 3. Verificar IndexedDB
      if (aiEconomicaConfig.cache.enableIndexedDB) {
        entry = await this.indexedDBCache.get(key);
        
        if (entry) {
          entry.accessCount++;
          entry.lastAccessed = Date.now();
          
          // Promover para caches superiores
          this.memoryCache.set(key, entry);
          
          if (aiEconomicaConfig.cache.enableLocalStorage) {
            const entrySize = JSON.stringify(entry).length;
            if (entrySize <= aiEconomicaConfig.cache.localStorageMaxSize) {
              await this.localStorageCache.set(key, entry);
            }
          }
          
          // Atualizar IndexedDB com novos contadores
          await this.indexedDBCache.set(key, entry);
          
          aiLogger.logCacheOperation('hit', key);
          return entry.response;
        }
      }

      aiLogger.logCacheOperation('miss', key);
      return null;
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao buscar no cache', error as Error, { key });
      return null;
    }
  }

  async set(key: string, response: AIResponse, customTTL?: number): Promise<void> {
    if (!aiEconomicaConfig.cache.enabled) return;

    try {
      const ttl = customTTL || this.getDefaultTTL(response.metadata?.evidenceLevel);
      
      const entry: CacheEntry = {
        key,
        response,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttl,
        accessCount: 0,
        lastAccessed: Date.now()
      };

      const entrySize = JSON.stringify(entry).length;

      // Sempre armazenar em memória (limitado)
      this.memoryCache.set(key, entry);
      this.limitMemoryCache();

      // Decidir onde armazenar baseado no tamanho
      if (entrySize <= aiEconomicaConfig.cache.localStorageMaxSize && 
          aiEconomicaConfig.cache.enableLocalStorage) {
        await this.localStorageCache.set(key, entry);
      } else if (aiEconomicaConfig.cache.enableIndexedDB) {
        await this.indexedDBCache.set(key, entry);
      }

      aiLogger.logCacheOperation('set', key, entrySize);
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao salvar no cache', error as Error, { key });
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      
      if (aiEconomicaConfig.cache.enableLocalStorage) {
        await this.localStorageCache.delete(key);
      }
      
      if (aiEconomicaConfig.cache.enableIndexedDB) {
        await this.indexedDBCache.delete(key);
      }
      
      aiLogger.logCacheOperation('cleanup', key);
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao invalidar cache', error as Error, { key });
    }
  }

  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      
      if (aiEconomicaConfig.cache.enableLocalStorage) {
        await this.localStorageCache.clear();
      }
      
      if (aiEconomicaConfig.cache.enableIndexedDB) {
        await this.indexedDBCache.clear();
      }
      
      aiLogger.info(LogCategory.CACHE, 'Cache completamente limpo');
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao limpar cache', error as Error);
    }
  }

  async getStats(): Promise<{
    memoryEntries: number;
    localStorageEntries: number;
    indexedDBEntries: number;
    totalSize: number;
    hitRate: number;
    topKeys: Array<{ key: string; hits: number; lastAccessed: Date }>;
  }> {
    try {
      const stats = {
        memoryEntries: this.memoryCache.size,
        localStorageEntries: 0,
        indexedDBEntries: 0,
        totalSize: 0,
        hitRate: 0,
        topKeys: [] as Array<{ key: string; hits: number; lastAccessed: Date }>
      };

      if (aiEconomicaConfig.cache.enableLocalStorage) {
        stats.localStorageEntries = await this.localStorageCache.size();
      }

      if (aiEconomicaConfig.cache.enableIndexedDB) {
        stats.indexedDBEntries = await this.indexedDBCache.size();
      }

      // Calcular estatísticas do cache em memória
      const memoryEntries = Array.from(this.memoryCache.entries());
      stats.totalSize = memoryEntries.reduce((total, [_, entry]) => {
        return total + JSON.stringify(entry).length;
      }, 0);

      // Top keys por acesso
      stats.topKeys = memoryEntries
        .map(([key, entry]) => ({
          key,
          hits: entry.accessCount,
          lastAccessed: new Date(entry.lastAccessed)
        }))
        .sort((a, b) => b.hits - a.hits)
        .slice(0, 10);

      return stats;
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao calcular estatísticas do cache', error as Error);
      return {
        memoryEntries: 0,
        localStorageEntries: 0,
        indexedDBEntries: 0,
        totalSize: 0,
        hitRate: 0,
        topKeys: []
      };
    }
  }

  async warmup(frequentQueries: string[]): Promise<void> {
    // Implementar pré-aquecimento do cache com consultas frequentes
    aiLogger.info(LogCategory.CACHE, `Iniciando warmup do cache com ${frequentQueries.length} consultas`);
    
    // Esta função seria chamada com dados históricos de consultas frequentes
    for (const queryHash of frequentQueries) {
      try {
        const cached = await this.get(queryHash);
        if (cached) {
          // Promover para memory cache se ainda não estiver
          const key = queryHash;
          if (!this.memoryCache.has(key)) {
            // Re-buscar para promover
            await this.get(queryHash);
          }
        }
      } catch (error) {
        aiLogger.warn(LogCategory.CACHE, 'Erro durante warmup', { queryHash, error });
      }
    }
  }

  generateCacheKey(queryText: string, context?: any): string {
    // Gerar chave determinística para cache
    const contextString = context ? JSON.stringify(context) : '';
    const combined = queryText + contextString;
    
    // Simples hash para chave do cache
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  private getDefaultTTL(evidenceLevel?: string): number {
    // TTL baseado no nível de evidência
    switch (evidenceLevel) {
      case 'high':
        return 30 * 24 * 60 * 60 * 1000; // 30 dias
      case 'moderate':
        return 14 * 24 * 60 * 60 * 1000; // 14 dias
      case 'low':
        return 7 * 24 * 60 * 60 * 1000;  // 7 dias
      default:
        return aiEconomicaConfig.cache.defaultTTL;
    }
  }

  private limitMemoryCache(): void {
    const maxEntries = 1000; // Limite do cache em memória
    
    if (this.memoryCache.size > maxEntries) {
      // Remover entradas menos acessadas
      const entries = Array.from(this.memoryCache.entries())
        .sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);
      
      const toRemove = entries.slice(0, this.memoryCache.size - maxEntries);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  private setupPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanup();
    }, aiEconomicaConfig.cache.cleanupInterval);
  }

  private async cleanup(): Promise<void> {
    try {
      aiLogger.debug(LogCategory.CACHE, 'Iniciando limpeza periódica do cache');
      
      const now = Date.now();
      let cleanedEntries = 0;

      // Limpar cache em memória
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expiresAt <= now) {
          this.memoryCache.delete(key);
          cleanedEntries++;
        }
      }

      // Limpar localStorage
      if (aiEconomicaConfig.cache.enableLocalStorage) {
        const localKeys = await this.localStorageCache.keys();
        for (const key of localKeys) {
          const entry = await this.localStorageCache.get(key);
          if (!entry || entry.expiresAt <= now) {
            await this.localStorageCache.delete(key);
            cleanedEntries++;
          }
        }
      }

      // Limpar IndexedDB
      if (aiEconomicaConfig.cache.enableIndexedDB) {
        const indexedKeys = await this.indexedDBCache.keys();
        for (const key of indexedKeys) {
          const entry = await this.indexedDBCache.get(key);
          if (!entry || entry.expiresAt <= now) {
            await this.indexedDBCache.delete(key);
            cleanedEntries++;
          }
        }
      }

      if (cleanedEntries > 0) {
        aiLogger.info(LogCategory.CACHE, `Limpeza concluída: ${cleanedEntries} entradas removidas`);
      }
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro durante limpeza do cache', error as Error);
    }
  }

  private async preloadFrequentlyUsed(): Promise<void> {
    // Implementar pré-carregamento de entradas frequentemente usadas
    try {
      // Esta seria uma implementação mais sofisticada que analisaria
      // padrões de uso histórico para pré-carregar cache relevante
      aiLogger.debug(LogCategory.CACHE, 'Pré-carregamento de cache iniciado');
    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro no pré-carregamento', error as Error);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export default CacheService;