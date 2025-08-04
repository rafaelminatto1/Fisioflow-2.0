interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface CoreWebVitals {
  LCP: PerformanceMetric | null; // Largest Contentful Paint
  FID: PerformanceMetric | null; // First Input Delay
  CLS: PerformanceMetric | null; // Cumulative Layout Shift
  FCP: PerformanceMetric | null; // First Contentful Paint
  TTFB: PerformanceMetric | null; // Time to First Byte
}

export class PerformanceMonitor {
  private vitals: CoreWebVitals = {
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    TTFB: null
  };

  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Inicializa o monitoramento de Core Web Vitals
   */
  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor LCP (Largest Contentful Paint)
    this.observeLCP();
    
    // Monitor FID (First Input Delay)
    this.observeFID();
    
    // Monitor CLS (Cumulative Layout Shift)
    this.observeCLS();
    
    // Monitor FCP (First Contentful Paint)
    this.observeFCP();
    
    // Monitor TTFB (Time to First Byte)
    this.observeTTFB();

    // Monitor resource performance
    this.observeResourceTiming();

    // Monitor user interactions
    this.observeUserTiming();
  }

  /**
   * Observa Largest Contentful Paint
   */
  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        
        if (lastEntry) {
          this.vitals.LCP = {
            name: 'LCP',
            value: lastEntry.startTime,
            rating: this.rateLCP(lastEntry.startTime),
            timestamp: Date.now()
          };
          
          this.reportMetric(this.vitals.LCP);
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    } catch (error) {
      console.warn('LCP monitoring not supported:', error);
    }
  }

  /**
   * Observa First Input Delay
   */
  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.vitals.FID = {
            name: 'FID',
            value: entry.processingStart - entry.startTime,
            rating: this.rateFID(entry.processingStart - entry.startTime),
            timestamp: Date.now()
          };
          
          this.reportMetric(this.vitals.FID);
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    } catch (error) {
      console.warn('FID monitoring not supported:', error);
    }
  }

  /**
   * Observa Cumulative Layout Shift
   */
  private observeCLS(): void {
    try {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        this.vitals.CLS = {
          name: 'CLS',
          value: clsValue,
          rating: this.rateCLS(clsValue),
          timestamp: Date.now()
        };
        
        this.reportMetric(this.vitals.CLS);
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    } catch (error) {
      console.warn('CLS monitoring not supported:', error);
    }
  }

  /**
   * Observa First Contentful Paint
   */
  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.vitals.FCP = {
              name: 'FCP',
              value: entry.startTime,
              rating: this.rateFCP(entry.startTime),
              timestamp: Date.now()
            };
            
            this.reportMetric(this.vitals.FCP);
          }
        });
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('fcp', observer);
    } catch (error) {
      console.warn('FCP monitoring not supported:', error);
    }
  }

  /**
   * Observa Time to First Byte
   */
  private observeTTFB(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.entryType === 'navigation') {
            const ttfb = entry.responseStart - entry.requestStart;
            
            this.vitals.TTFB = {
              name: 'TTFB',
              value: ttfb,
              rating: this.rateTTFB(ttfb),
              timestamp: Date.now()
            };
            
            this.reportMetric(this.vitals.TTFB);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.set('ttfb', observer);
    } catch (error) {
      console.warn('TTFB monitoring not supported:', error);
    }
  }

  /**
   * Observa performance de recursos
   */
  private observeResourceTiming(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          // Identificar recursos lentos
          if (entry.duration > 1000) {
            this.reportSlowResource(entry);
          }
          
          // Identificar recursos grandes
          if (entry.transferSize > 1024 * 1024) { // > 1MB
            this.reportLargeResource(entry);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (error) {
      console.warn('Resource timing monitoring not supported:', error);
    }
  }

  /**
   * Observa timing de usuário personalizado
   */
  private observeUserTiming(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          this.reportCustomMetric({
            name: entry.name,
            value: entry.duration || entry.startTime,
            rating: 'good', // Personalizado baseado no contexto
            timestamp: Date.now()
          });
        });
      });

      observer.observe({ entryTypes: ['measure', 'mark'] });
      this.observers.set('user-timing', observer);
    } catch (error) {
      console.warn('User timing monitoring not supported:', error);
    }
  }

  // Rating functions
  private rateLCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private rateFID(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  private rateCLS(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private rateFCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  private rateTTFB(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Reporta métrica para analytics
   */
  private reportMetric(metric: PerformanceMetric): void {
    // Em produção, enviar para Google Analytics, Sentry, ou outro serviço
    console.log(`[Performance] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
    
    // Exemplo de envio para Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        non_interaction: true
      });
    }

    // Armazenar localmente para debug
    this.storeMetricLocally(metric);
  }

  /**
   * Reporta recurso lento
   */
  private reportSlowResource(entry: any): void {
    console.warn(`[Performance] Slow resource: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
    
    // Reportar para monitoramento
    this.reportCustomMetric({
      name: 'slow_resource',
      value: entry.duration,
      rating: 'poor',
      timestamp: Date.now()
    });
  }

  /**
   * Reporta recurso grande
   */
  private reportLargeResource(entry: any): void {
    const sizeMB = (entry.transferSize / (1024 * 1024)).toFixed(2);
    console.warn(`[Performance] Large resource: ${entry.name} (${sizeMB}MB)`);
    
    this.reportCustomMetric({
      name: 'large_resource',
      value: entry.transferSize,
      rating: 'needs-improvement',
      timestamp: Date.now()
    });
  }

  /**
   * Reporta métrica customizada
   */
  private reportCustomMetric(metric: PerformanceMetric): void {
    console.log(`[Performance] Custom: ${metric.name} = ${metric.value}`);
    this.storeMetricLocally(metric);
  }

  /**
   * Armazena métrica localmente para debug
   */
  private storeMetricLocally(metric: PerformanceMetric): void {
    try {
      const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
      metrics.push(metric);
      
      // Manter apenas os últimos 100 registros
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }
      
      localStorage.setItem('performance_metrics', JSON.stringify(metrics));
    } catch (error) {
      // Ignorar erros de localStorage
    }
  }

  /**
   * Marca início de uma operação personalizada
   */
  mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}_start`);
    }
  }

  /**
   * Marca fim de uma operação e calcula duração
   */
  measure(name: string): void {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, `${name}_start`);
      } catch (error) {
        console.warn(`Failed to measure ${name}:`, error);
      }
    }
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): CoreWebVitals {
    return { ...this.vitals };
  }

  /**
   * Obtém relatório de performance
   */
  getPerformanceReport(): {
    vitals: CoreWebVitals;
    summary: {
      overallRating: 'good' | 'needs-improvement' | 'poor';
      issues: string[];
      recommendations: string[];
    };
  } {
    const vitals = this.getMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Analisar cada métrica
    Object.values(vitals).forEach(metric => {
      if (metric && metric.rating === 'poor') {
        issues.push(`${metric.name} needs improvement (${metric.value.toFixed(2)}ms)`);
        
        switch (metric.name) {
          case 'LCP':
            recommendations.push('Optimize server response times and reduce resource load times');
            break;
          case 'FID':
            recommendations.push('Minimize JavaScript execution time and optimize event handlers');
            break;
          case 'CLS':
            recommendations.push('Ensure images and ads have size attributes and avoid dynamic content insertion');
            break;
          case 'FCP':
            recommendations.push('Eliminate render-blocking resources and optimize critical resource priority');
            break;
          case 'TTFB':
            recommendations.push('Optimize server performance and consider using a CDN');
            break;
        }
      }
    });

    // Determinar rating geral
    const poorCount = Object.values(vitals).filter(m => m && m.rating === 'poor').length;
    const needsImprovementCount = Object.values(vitals).filter(m => m && m.rating === 'needs-improvement').length;
    
    let overallRating: 'good' | 'needs-improvement' | 'poor' = 'good';
    if (poorCount > 0) {
      overallRating = 'poor';
    } else if (needsImprovementCount > 1) {
      overallRating = 'needs-improvement';
    }

    return {
      vitals,
      summary: {
        overallRating,
        issues,
        recommendations
      }
    };
  }

  /**
   * Limpa observadores
   */
  cleanup(): void {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Instância global
export const performanceMonitor = new PerformanceMonitor();

// Auto-inicializar no browser
if (typeof window !== 'undefined') {
  // Inicializar após carregamento da página
  if (document.readyState === 'complete') {
    // Página já carregada
  } else {
    window.addEventListener('load', () => {
      // Aguardar um pouco antes de começar a monitorar
      setTimeout(() => {
        performanceMonitor.mark('app_ready');
      }, 1000);
    });
  }

  // Cleanup ao sair da página
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup();
  });
}

export default performanceMonitor;