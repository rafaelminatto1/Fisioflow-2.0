import React, { memo, useMemo, lazy, Suspense, ComponentType } from 'react';

// Performance optimization utilities for React components

// Enhanced memo with deep comparison for complex props
export const memoWithDeepCompare = <P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(Component, propsAreEqual || deepEqual);
};

// Deep equality check for complex objects
function deepEqual<T>(prevProps: T, nextProps: T): boolean {
  if (prevProps === nextProps) return true;
  
  if (typeof prevProps !== 'object' || typeof nextProps !== 'object') {
    return false;
  }
  
  if (!prevProps || !nextProps) return false;
  
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  for (const key of prevKeys) {
    if (!nextKeys.includes(key)) return false;
    
    const prevValue = (prevProps as any)[key];
    const nextValue = (nextProps as any)[key];
    
    if (typeof prevValue === 'object' && typeof nextValue === 'object') {
      if (!deepEqual(prevValue, nextValue)) return false;
    } else if (prevValue !== nextValue) {
      return false;
    }
  }
  
  return true;
}

// Optimized lazy component loader with error boundary
export const lazyWithRetry = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  name: string = 'Component'
) => {
  return lazy(async () => {
    try {
      return await importFunc();
    } catch (error) {
      console.error(`Failed to load ${name}:`, error);
      // Retry once after a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await importFunc();
    }
  });
};

// Suspense wrapper with loading states
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback,
  name = 'Component'
}) => {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Carregando {name}...</span>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

// Virtual scrolling hook for large lists
export const useVirtualScroll = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleItems = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      itemCount
    );
    
    return {
      start: Math.max(0, visibleStart - 5), // Buffer
      end: Math.min(itemCount, visibleEnd + 5), // Buffer
      totalHeight: itemCount * itemHeight
    };
  }, [scrollTop, itemHeight, containerHeight, itemCount]);
  
  const handleScroll = React.useCallback((event: React.UIEvent) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);
  
  return { visibleItems, handleScroll };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = React.useRef(0);
  const startTime = React.useRef(performance.now());
  
  React.useEffect(() => {
    renderCount.current++;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render (render #${renderCount.current})`);
    }
    
    startTime.current = endTime;
  });
  
  return { renderCount: renderCount.current };
};

// Debounced state hook for performance
export const useDebouncedState = <T>(
  initialValue: T,
  delay: number = 300
): [T, T, React.Dispatch<React.SetStateAction<T>>] => {
  const [value, setValue] = React.useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState<T>(initialValue);
  
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return [value, debouncedValue, setValue];
};

// Memoized computation hook
export const useMemoizedComputation = <T, D extends readonly unknown[]>(
  factory: () => T,
  deps: D,
  isEqual?: (prev: T, next: T) => boolean
): T => {
  const memoizedValue = useMemo(factory, deps);
  const previousValue = React.useRef<T>();
  
  if (isEqual && previousValue.current !== undefined) {
    if (isEqual(previousValue.current, memoizedValue)) {
      return previousValue.current;
    }
  }
  
  previousValue.current = memoizedValue;
  return memoizedValue;
};

// Component render optimization utilities
export const withPerformanceOptimization = <P extends object>(
  Component: ComponentType<P>
) => {
  return memoWithDeepCompare((props: P) => {
    const { renderCount } = usePerformanceMonitor(Component.displayName || Component.name);
    
    return <Component {...props} />;
  });
};