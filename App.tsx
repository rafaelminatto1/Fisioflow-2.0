
import React, { useState, useEffect, Suspense } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import AppDebug from './App.debug';
import SimpleApp from './App.simple';

// Lazy load components to avoid blocking the main thread
const AppRoutes = React.lazy(() => import('./AppRoutes'));
const ErrorBoundaryProvider = React.lazy(() => import('./components/ErrorBoundaryProvider').then(module => ({ default: module.ErrorBoundaryProvider })));

const App = () => {
  // Check modes first, before any state initialization
  const isDebugMode = (
    window.location.search.includes('debug=true') || 
    localStorage.getItem('fisioflow_debug') === 'true'
  );
  
  const isSimpleMode = (
    window.location.search.includes('simple=true') || 
    localStorage.getItem('fisioflow_simple') === 'true'
  );
  
  // Return early for special modes
  if (isDebugMode) {
    return <AppDebug />;
  }
  
  if (isSimpleMode) {
    return <SimpleApp />;
  }
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Basic initialization checks
        console.log('🚀 FisioFlow App initializing...');
        console.log('Environment:', {
          userAgent: navigator.userAgent,
          location: window.location.href,
          localStorage: typeof localStorage !== 'undefined',
          document: typeof document !== 'undefined'
        });
        
        // Check if we have access to DOM
        if (!document.getElementById('root')) {
          throw new Error('Root element not found');
        }
        
        // Check if localStorage is available
        localStorage.setItem('fisioflow_init_test', 'ok');
        localStorage.removeItem('fisioflow_init_test');
        
        // Test if we can import React
        if (typeof React === 'undefined') {
          throw new Error('React is not available');
        }
        
        // Unregister any existing service workers
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
              console.log('Unregistering service worker:', registration);
              registration.unregister();
            });
          });
        }
        
        // Add a small delay to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('✅ FisioFlow App initialization complete');
        setIsInitialized(true);
        
      } catch (error) {
        console.error('❌ FisioFlow App initialization failed:', error);
        setHasError(true);
      }
    };
    
    initializeApp();
  }, []);
  
  if (hasError) {
    return (
      <div style={{ 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>
            🚨 Erro de Inicialização
          </h1>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            A aplicação FisioFlow encontrou um erro durante a inicialização.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              marginRight: '10px'
            }}
          >
            🔄 Recarregar Página
          </button>
          <button 
            onClick={() => {
              localStorage.setItem('fisioflow_debug', 'true');
              window.location.reload();
            }}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔍 Modo Debug
          </button>
        </div>
      </div>
    );
  }
  
  if (!isInitialized) {
    return (
      <div style={{ 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h2 style={{ color: '#007bff', margin: '0 0 10px 0' }}>
            🏥 FisioFlow
          </h2>
          <p style={{ color: '#666', margin: 0 }}>
            Inicializando aplicação...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div style={{ 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#007bff', margin: '0 0 10px 0' }}>
            🏥 FisioFlow
          </h2>
          <p style={{ color: '#666', margin: 0 }}>
            Carregando componentes...
          </p>
        </div>
      </div>
    }>
      <ErrorBoundaryProvider>
        <ReactRouterDOM.HashRouter>
          <AppRoutes />
        </ReactRouterDOM.HashRouter>
      </ErrorBoundaryProvider>
    </Suspense>
  );
};

export default App;