
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';

// Debug logging for production troubleshooting
console.log('🚀 FisioFlow: Starting application initialization...');

// Re-rendering the application to refresh the preview.
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ FisioFlow: Root element not found!');
  throw new Error("Could not find root element to mount to");
}

console.log('✅ FisioFlow: Root element found, creating React root...');

const root = ReactDOM.createRoot(rootElement);

try {
  console.log('🎯 FisioFlow: Rendering React application...');
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </StrictMode>
  );
  console.log('✅ FisioFlow: React render completed successfully!');
} catch (error) {
  console.error('❌ FisioFlow: Error during React render:', error);
  rootElement.innerHTML = '<div class="loading-fallback"><div><h2>Erro durante inicialização</h2><p>' + error.message + '</p><button onclick="location.reload()">Recarregar</button></div></div>';
}