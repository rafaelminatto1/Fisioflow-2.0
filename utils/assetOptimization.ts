// Asset optimization utilities for images, fonts, and resources

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  lazy?: boolean;
}

interface FontOptimizationOptions {
  preload?: boolean;
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  subset?: string[];
}

// Image optimization utilities
export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private imageCache = new Map<string, string>();
  private observer: IntersectionObserver | null = null;

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  constructor() {
    this.initIntersectionObserver();
  }

  private initIntersectionObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              this.loadImage(img, src);
              this.observer?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );
  }

  private async loadImage(img: HTMLImageElement, src: string) {
    try {
      const optimizedSrc = await this.getOptimizedImageUrl(src);
      img.src = optimizedSrc;
      img.classList.remove('loading');
      img.classList.add('loaded');
    } catch (error) {
      console.error('Failed to load image:', error);
      img.src = src; // Fallback to original
    }
  }

  async getOptimizedImageUrl(
    src: string,
    options: ImageOptimizationOptions = {}
  ): Promise<string> {
    const cacheKey = `${src}_${JSON.stringify(options)}`;
    
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    const optimizedUrl = await this.processImage(src, options);
    this.imageCache.set(cacheKey, optimizedUrl);
    
    return optimizedUrl;
  }

  private async processImage(
    src: string,
    options: ImageOptimizationOptions
  ): Promise<string> {
    // In a real implementation, this would call an image optimization service
    // For now, we'll simulate optimization with query parameters
    const url = new URL(src, window.location.origin);
    
    if (options.quality) {
      url.searchParams.set('quality', options.quality.toString());
    }
    
    if (options.format) {
      url.searchParams.set('format', options.format);
    }
    
    if (options.width) {
      url.searchParams.set('w', options.width.toString());
    }
    
    if (options.height) {
      url.searchParams.set('h', options.height.toString());
    }

    return url.toString();
  }

  createOptimizedImage(
    src: string,
    alt: string,
    options: ImageOptimizationOptions = {}
  ): HTMLImageElement {
    const img = document.createElement('img');
    img.alt = alt;
    img.className = 'loading';
    
    // Add loading styles
    img.style.transition = 'opacity 0.3s ease';
    img.style.opacity = '0';
    
    if (options.lazy && this.observer) {
      img.dataset.src = src;
      this.observer.observe(img);
    } else {
      this.loadImage(img, src);
    }

    img.onload = () => {
      img.style.opacity = '1';
    };

    return img;
  }

  // Modern image format detection
  static supportsWebP(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  static supportsAVIF(): Promise<boolean> {
    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        resolve(avif.height === 2);
      };
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }
}

// Font optimization utilities
export class FontOptimizer {
  private static loadedFonts = new Set<string>();

  static async preloadFont(
    fontFamily: string,
    fontWeight: string = '400',
    fontStyle: string = 'normal',
    options: FontOptimizationOptions = {}
  ) {
    const fontKey = `${fontFamily}-${fontWeight}-${fontStyle}`;
    
    if (this.loadedFonts.has(fontKey)) {
      return;
    }

    try {
      // Create font face
      const fontFace = new FontFace(
        fontFamily,
        `url('/fonts/${fontFamily.toLowerCase()}-${fontWeight}.woff2') format('woff2')`,
        {
          weight: fontWeight,
          style: fontStyle,
          display: options.display || 'swap'
        }
      );

      await fontFace.load();
      (document as any).fonts.add(fontFace);
      this.loadedFonts.add(fontKey);

      // Preload link element for better caching
      if (options.preload) {
        this.createPreloadLink(fontFamily, fontWeight, fontStyle);
      }

    } catch (error) {
      console.warn(`Failed to preload font ${fontFamily}:`, error);
    }
  }

  private static createPreloadLink(
    fontFamily: string,
    fontWeight: string,
    fontStyle: string
  ) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = `/fonts/${fontFamily.toLowerCase()}-${fontWeight}.woff2`;
    
    document.head.appendChild(link);
  }

  static optimizeFontLoading() {
    // Add font-display: swap to all font faces
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }
}

// Resource caching utilities
export class ResourceCache {
  private static cache: Cache | null = null;
  private static readonly CACHE_NAME = 'fisioflow-resources-v1';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static async init() {
    if ('caches' in window) {
      try {
        this.cache = await caches.open(this.CACHE_NAME);
      } catch (error) {
        console.warn('Failed to initialize resource cache:', error);
      }
    }
  }

  static async cacheResource(url: string, response: Response) {
    if (!this.cache) return;

    try {
      // Clone response before caching
      const responseClone = response.clone();
      
      // Add cache timestamp
      const headers = new Headers(responseClone.headers);
      headers.set('fisioflow-cached-at', Date.now().toString());
      
      const cachedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers
      });

      await this.cache.put(url, cachedResponse);
    } catch (error) {
      console.warn('Failed to cache resource:', error);
    }
  }

  static async getCachedResource(url: string): Promise<Response | null> {
    if (!this.cache) return null;

    try {
      const cachedResponse = await this.cache.match(url);
      
      if (!cachedResponse) return null;

      // Check if cache is still valid
      const cachedAt = cachedResponse.headers.get('fisioflow-cached-at');
      if (cachedAt) {
        const age = Date.now() - parseInt(cachedAt);
        if (age > this.CACHE_DURATION) {
          await this.cache.delete(url);
          return null;
        }
      }

      return cachedResponse;
    } catch (error) {
      console.warn('Failed to get cached resource:', error);
      return null;
    }
  }

  static async clearExpiredCache() {
    if (!this.cache) return;

    try {
      const keys = await this.cache.keys();
      const expiredKeys = [];

      for (const request of keys) {
        const response = await this.cache.match(request);
        if (response) {
          const cachedAt = response.headers.get('fisioflow-cached-at');
          if (cachedAt) {
            const age = Date.now() - parseInt(cachedAt);
            if (age > this.CACHE_DURATION) {
              expiredKeys.push(request);
            }
          }
        }
      }

      await Promise.all(expiredKeys.map(key => this.cache!.delete(key)));
      console.log(`Cleared ${expiredKeys.length} expired cache entries`);
    } catch (error) {
      console.warn('Failed to clear expired cache:', error);
    }
  }
}

// Lazy loading utilities for non-critical resources
export class LazyResourceLoader {
  private static loadedResources = new Set<string>();

  static async loadCSS(href: string, media: string = 'all'): Promise<void> {
    if (this.loadedResources.has(href)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = media;

      link.onload = () => {
        this.loadedResources.add(href);
        resolve();
      };

      link.onerror = () => {
        reject(new Error(`Failed to load CSS: ${href}`));
      };

      document.head.appendChild(link);
    });
  }

  static async loadScript(src: string, defer: boolean = true): Promise<void> {
    if (this.loadedResources.has(src)) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = defer;

      script.onload = () => {
        this.loadedResources.add(src);
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  }

  static preloadResource(href: string, as: string, type?: string) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (type) {
      link.type = type;
    }
    
    if (as === 'font') {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
  }
}

// Initialize optimizations
export const initAssetOptimizations = async () => {
  // Initialize resource cache
  await ResourceCache.init();

  // Clear expired cache entries
  await ResourceCache.clearExpiredCache();

  // Optimize font loading
  FontOptimizer.optimizeFontLoading();

  // Preload critical fonts
  await FontOptimizer.preloadFont('Inter', '400');
  await FontOptimizer.preloadFont('Inter', '500');
  await FontOptimizer.preloadFont('Inter', '600');

  // Preload critical resources
  LazyResourceLoader.preloadResource('/icons/logo.svg', 'image', 'image/svg+xml');
  LazyResourceLoader.preloadResource('/css/critical.css', 'style', 'text/css');

  console.log('Asset optimizations initialized');
};

// Export singleton instances
export const imageOptimizer = ImageOptimizer.getInstance();
export { ResourceCache, FontOptimizer, LazyResourceLoader };