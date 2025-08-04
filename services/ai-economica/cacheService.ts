
import { 
  CacheEntry, 
  CacheConfig, 
  CacheStats, 
  QueryType, 
  AIResponse,
  CacheStrategy
} from '../../types/ai-economica.types';
import { aiEconomicaLogger } from './logger';
import { AI_ECONOMICA_CONFIG, QUERY_TYPE_CONFIGS } from '../../config/ai-economica.config';

interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

class LocalStorageAdapter implements StorageAdapter {
  private prefix = 'ai_cache_';

  async get(key: string): Promise<string | null> {
    return localStorage.getItem(this.prefix + key);
  }

  async set(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, value);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Try to free up space
        await this.cleanup();
        localStorage.setItem(this.prefix + key, value);
      } else {
        throw error;
      }
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    keys.forEach(key => localStorage.removeItem(this.prefix + key));
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }

  async size(): Promise<number> {
    let totalSize = 0;
    const keys = await this.keys();
    for (const key of keys) {
      const value = await this.get(key);
      if (value) {
        totalSize += new Blob([value]).size;
      }
    }
    return totalSize;
  }

  private async cleanup(): Promise<void> {
    const keys = await this.keys();
    const entries: Array<{ key: string; lastAccessed: number }> = [];
    
    for (const key of keys) {
      const value = await this.get(key);
      if (value) {
        try {
          const entry: CacheEntry = JSON.parse(value);
          entries.push({ key, lastAccessed: entry.lastAccessed.getTime() });
        } catch {
          // Remove malformed entries
          await this.remove(key);
        }
      }
    }
    
    // Remove oldest 25% of entries
    entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
    const toRemove = entries.slice(0, Math.floor(entries.length * 0.25));
    
    for (const { key } of toRemove) {
      await this.remove(key);
    }
  }
}

class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'ai_economica_cache';
  private version = 1;
  private storeName = 'cache_entries';
  private db: IDBDatabase | null = null;

  private async initDB(): Promise<IDBDatabase> {
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

  async get(key: string): Promise<string | null> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
    });
  }

  async set(key: string, value: string): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ key, value, timestamp: Date.now() });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async remove(key: string): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async keys(): Promise<string[]> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAllKeys();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async size(): Promise<number> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.count();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

class AIEconomicaCacheService {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private localStorageAdapter: LocalStorageAdapter;
  private indexedDBAdapter: IndexedDBAdapter;
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private prefetchQueue: Set<string> = new Set();

  constructor() {
    this.config = AI_ECONOMICA_CONFIG.cache;
    this.localStorageAdapter = new LocalStorageAdapter();
    this.indexedDBAdapter = new IndexedDBAdapter();
    this.stats = this.initializeStats();
    this.setupCleanupSchedule();
  }

  private initializeStats(): CacheStats {
    return {
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0,
      totalSize: 0,
      entryCount: 0,
      oldestEntry: new Date(),
      newestEntry: new Date(),
      averageSize: 0,
      compressionRatio: 0,
      typeDistribution: {
        [QueryType.PROTOCOL]: 0,
        [QueryType.DIAGNOSIS]: 0,
        [QueryType.EXERCISE]: 0,
        [QueryType.GENERAL]: 0,
        [QueryType.RESEARCH]: 0,
        [QueryType.EMERGENCY]: 0
      }
    };
  }

  // Core cache operations
  async get<T = any>(key: string, type?: QueryType): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Check memory cache first (L1)
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        this.updateAccessStats(memoryEntry);
        this.recordHit('memory');
        
        aiEconomicaLogger.logCache('hit', key, { 
          layer: 'memory', 
          responseTime: Date.now() - startTime 
        });
        
        return memoryEntry.data as T;
      }

      // Check localStorage (L2)
      const localData = await this.localStorageAdapter.get(key);
      if (localData) {
        const entry: CacheEntry = JSON.parse(localData);
        if (!this.isExpired(entry)) {
          // Promote to memory cache
          this.memoryCache.set(key, entry);
          this.updateAccessStats(entry);
          this.recordHit('localStorage');
          
          aiEconomicaLogger.logCache('hit', key, { 
            layer: 'localStorage', 
            responseTime: Date.now() - startTime 
          });
          
          return entry.data as T;
        } else {
          await this.localStorageAdapter.remove(key);
        }
      }

      // Check IndexedDB (L3) for larger entries
      if (this.shouldUseIndexedDB(key)) {
        const indexedData = await this.indexedDBAdapter.get(key);
        if (indexedData) {
          const entry: CacheEntry = JSON.parse(indexedData);
          if (!this.isExpired(entry)) {
            // Promote to appropriate upper level
            if (entry.size < 50000) { // 50KB threshold
              this.memoryCache.set(key, entry);
            }
            await this.localStorageAdapter.set(key, indexedData);
            
            this.updateAccessStats(entry);
            this.recordHit('indexedDB');
            
            aiEconomicaLogger.logCache('hit', key, { 
              layer: 'indexedDB', 
              responseTime: Date.now() - startTime 
            });
            
            return entry.data as T;
          } else {
            await this.indexedDBAdapter.remove(key);
          }
        }
      }

      // Cache miss
      this.recordMiss();
      aiEconomicaLogger.logCache('miss', key, { 
        responseTime: Date.now() - startTime 
      });
      
      return null;
    } catch (error) {
      aiEconomicaLogger.error('Cache get failed', error as Error, { key, type });
      return null;
    }
  }

  async set<T = any>(key: string, data: T, type: QueryType, customTTL?: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      const ttl = customTTL || this.getTTLForType(type);
      const serializedData = JSON.stringify(data);
      const size = new Blob([serializedData]).size;
      const compressed = this.config.compressionEnabled ? await this.compress(serializedData) : serializedData;
      
      const entry: CacheEntry = {
        key,
        data,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 0,
        ttl,
        expiresAt: new Date(Date.now() + ttl),
        size,
        type,
        tags: this.generateTags(key, type),
        compressed: this.config.compressionEnabled
      };

      // Memory cache (L1) - for frequently accessed small items
      if (size < 10000 && this.memoryCache.size < 100) { // 10KB and max 100 items
        this.memoryCache.set(key, entry);
      }

      // localStorage (L2) - for medium-sized items
      if (size < 100000) { // 100KB
        await this.localStorageAdapter.set(key, compressed);
      }

      // IndexedDB (L3) - for large items or when localStorage is full
      if (size >= 100000 || this.shouldUseIndexedDB(key)) {
        await this.indexedDBAdapter.set(key, compressed);
      }

      this.updateStats(entry);
      
      aiEconomicaLogger.logCache('set', key, { 
        type, 
        size, 
        ttl, 
        responseTime: Date.now() - startTime,
        compressed: this.config.compressionEnabled
      });

      // Schedule prefetch if enabled
      if (this.config.prefetchEnabled) {
        this.schedulePrefetch(key, type);
      }

    } catch (error) {
      aiEconomicaLogger.error('Cache set failed', error as Error, { key, type });
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      await this.localStorageAdapter.remove(key);
      await this.indexedDBAdapter.remove(key);
      
      aiEconomicaLogger.logCache('clear', key);
    } catch (error) {
      aiEconomicaLogger.error('Cache remove failed', error as Error, { key });
    }
  }

  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      await this.localStorageAdapter.clear();
      await this.indexedDBAdapter.clear();
      this.stats = this.initializeStats();
      
      aiEconomicaLogger.logCache('clear', 'all_entries');
    } catch (error) {
      aiEconomicaLogger.error('Cache clear failed', error as Error);
    }
  }

  // Cache management and optimization
  async cleanup(): Promise<void> {
    const startTime = Date.now();
    let removedCount = 0;
    
    try {
      // Clean memory cache
      for (const [key, entry] of this.memoryCache.entries()) {
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
          removedCount++;
        }
      }

      // Clean localStorage
      const localKeys = await this.localStorageAdapter.keys();
      for (const key of localKeys) {
        const data = await this.localStorageAdapter.get(key);
        if (data) {
          try {
            const entry: CacheEntry = JSON.parse(data);
            if (this.isExpired(entry)) {
              await this.localStorageAdapter.remove(key);
              removedCount++;
            }
          } catch {
            await this.localStorageAdapter.remove(key);
            removedCount++;
          }
        }
      }

      // Clean IndexedDB
      const indexedKeys = await this.indexedDBAdapter.keys();
      for (const key of indexedKeys) {
        const data = await this.indexedDBAdapter.get(key);
        if (data) {
          try {
            const entry: CacheEntry = JSON.parse(data);
            if (this.isExpired(entry)) {
              await this.indexedDBAdapter.remove(key);
              removedCount++;
            }
          } catch {
            await this.indexedDBAdapter.remove(key);
            removedCount++;
          }
        }
      }

      const duration = Date.now() - startTime;
      
      aiEconomicaLogger.logPerformance('cache_cleanup', duration, {
        removedEntries: removedCount,
        totalEntries: this.memoryCache.size + localKeys.length + indexedKeys.length
      });

    } catch (error) {
      aiEconomicaLogger.error('Cache cleanup failed', error as Error);
    }
  }

  async optimize(): Promise<void> {
    try {
      // Implement LRU eviction if memory cache is too large
      if (this.memoryCache.size > 100) {
        const entries = Array.from(this.memoryCache.entries())
          .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
        
        const toRemove = entries.slice(0, 20); // Remove oldest 20 entries
        toRemove.forEach(([key]) => this.memoryCache.delete(key));
      }

      // Check size limits and cleanup if necessary
      const totalSize = await this.getTotalSize();
      const maxSize = this.config.maxSize * 1024 * 1024; // Convert MB to bytes
      
      if (totalSize > maxSize) {
        await this.evictLeastUsed();
      }

      // Prefetch commonly accessed items
      if (this.config.prefetchEnabled) {
        await this.prefetchCommonItems();
      }

    } catch (error) {
      aiEconomicaLogger.error('Cache optimization failed', error as Error);
    }
  }

  // Statistics and monitoring
  getStats(): CacheStats {
    this.updateRealTimeStats();
    return { ...this.stats };
  }

  async getCacheHealth(): Promise<{
    health: 'good' | 'degraded' | 'poor';
    hitRate: number;
    size: number;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    const hitRate = this.stats.hitRate;
    const totalSize = await this.getTotalSize();
    const maxSize = this.config.maxSize * 1024 * 1024;
    
    if (hitRate < 70) {
      issues.push('Low hit rate');
      recommendations.push('Consider adjusting TTL values or prefetch strategy');
    }
    
    if (totalSize > maxSize * 0.9) {
      issues.push('Cache near capacity');
      recommendations.push('Increase cache size or implement more aggressive cleanup');
    }
    
    if (this.stats.entryCount > this.config.maxEntries * 0.9) {
      issues.push('Too many cache entries');
      recommendations.push('Implement better eviction strategy');
    }
    
    const health = issues.length === 0 ? 'good' : issues.length < 3 ? 'degraded' : 'poor';
    
    return {
      health,
      hitRate,
      size: totalSize,
      issues,
      recommendations
    };
  }

  // Prefetching and warming
  async warmCache(commonQueries: Array<{ key: string; type: QueryType }>): Promise<void> {
    for (const { key, type } of commonQueries) {
      if (!this.prefetchQueue.has(key)) {
        this.prefetchQueue.add(key);
        // In a real implementation, this would trigger the actual query to warm the cache
        aiEconomicaLogger.logCache('warm', key, { type });
      }
    }
  }

  // Private helper methods
  private getTTLForType(type: QueryType): number {
    const config = QUERY_TYPE_CONFIGS[type];
    return config?.cacheTTL || this.config.defaultTTL;
  }

  private isExpired(entry: CacheEntry): boolean {
    return new Date() > entry.expiresAt;
  }

  private shouldUseIndexedDB(key: string): boolean {
    // Use IndexedDB for large responses or specific types
    return key.includes('large') || key.includes('research') || key.includes('report');
  }

  private updateAccessStats(entry: CacheEntry): void {
    entry.lastAccessed = new Date();
    entry.accessCount++;
  }

  private recordHit(layer: 'memory' | 'localStorage' | 'indexedDB'): void {
    this.stats.totalHits++;
    this.updateHitRate();
  }

  private recordMiss(): void {
    this.stats.totalMisses++;
    this.updateHitRate();
  }

  private updateHitRate(): void {
    const total = this.stats.totalHits + this.stats.totalMisses;
    this.stats.hitRate = total > 0 ? (this.stats.totalHits / total) * 100 : 0;
  }

  private updateStats(entry: CacheEntry): void {
    this.stats.entryCount++;
    this.stats.totalSize += entry.size;
    this.stats.averageSize = this.stats.totalSize / this.stats.entryCount;
    this.stats.typeDistribution[entry.type]++;
    
    if (entry.createdAt > this.stats.newestEntry) {
      this.stats.newestEntry = entry.createdAt;
    }
    
    if (entry.createdAt < this.stats.oldestEntry || this.stats.entryCount === 1) {
      this.stats.oldestEntry = entry.createdAt;
    }
  }

  private updateRealTimeStats(): void {
    // Update real-time statistics
    this.stats.entryCount = this.memoryCache.size;
    // Note: In a real implementation, you'd also count localStorage and IndexedDB entries
  }

  private async getTotalSize(): Promise<number> {
    let totalSize = 0;
    
    // Memory cache size
    for (const entry of this.memoryCache.values()) {
      totalSize += entry.size;
    }
    
    // Add localStorage and IndexedDB sizes
    totalSize += await this.localStorageAdapter.size();
    // Note: IndexedDB size calculation would be more complex in a real implementation
    
    return totalSize;
  }

  private async evictLeastUsed(): Promise<void> {
    // Implement LRU eviction across all cache layers
    const allEntries: Array<{ key: string; lastAccessed: Date; layer: string }> = [];
    
    // Collect entries from all layers
    for (const [key, entry] of this.memoryCache.entries()) {
      allEntries.push({ key, lastAccessed: entry.lastAccessed, layer: 'memory' });
    }
    
    // Sort by last accessed time
    allEntries.sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
    
    // Remove oldest 10%
    const toRemove = allEntries.slice(0, Math.floor(allEntries.length * 0.1));
    
    for (const { key } of toRemove) {
      await this.remove(key);
    }
  }

  private async prefetchCommonItems(): Promise<void> {
    // Implement prefetching logic for commonly accessed items
    // This would analyze access patterns and pre-load likely-to-be-requested items
  }

  private schedulePrefetch(key: string, type: QueryType): void {
    // Schedule prefetch of related items
    if (this.config.prefetchEnabled && !this.prefetchQueue.has(key)) {
      this.prefetchQueue.add(key);
      
      // Remove from queue after processing
      setTimeout(() => {
        this.prefetchQueue.delete(key);
      }, 60000); // 1 minute timeout
    }
  }

  private generateTags(key: string, type: QueryType): string[] {
    const tags = [type];
    
    // Add contextual tags based on key content
    if (key.includes('patient')) tags.push('patient-specific');
    if (key.includes('protocol')) tags.push('protocol');
    if (key.includes('emergency')) tags.push('urgent');
    
    return tags;
  }

  private async compress(data: string): Promise<string> {
    if (!this.config.compressionEnabled) return data;
    
    try {
      // Simple compression using browser's built-in compression
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new TextEncoder().encode(data));
      writer.close();
      
      const compressedChunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) compressedChunks.push(value);
      }
      
      const compressedData = new Uint8Array(
        compressedChunks.reduce((acc, chunk) => acc + chunk.length, 0)
      );
      
      let offset = 0;
      for (const chunk of compressedChunks) {
        compressedData.set(chunk, offset);
        offset += chunk.length;
      }
      
      return btoa(String.fromCharCode(...compressedData));
    } catch (error) {
      aiEconomicaLogger.warn('Compression failed, storing uncompressed', { error });
      return data;
    }
  }

  private setupCleanupSchedule(): void {
    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
      this.optimize();
    }, this.config.cleanupInterval);
  }

  // Cleanup on destruction
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const aiEconomicaCacheService = new AIEconomicaCacheService();

// Legacy compatibility
export const cacheService = {
  get: (key: string) => aiEconomicaCacheService.get(key),
  set: (key: string, data: any, type: QueryType = QueryType.GENERAL, ttl?: number) => 
    aiEconomicaCacheService.set(key, data, type, ttl),
  remove: (key: string) => aiEconomicaCacheService.remove(key),
  clear: () => aiEconomicaCacheService.clear(),
  cleanup: () => aiEconomicaCacheService.cleanup()
};

export default aiEconomicaCacheService;
