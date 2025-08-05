import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('🚀 FisioFlow: Starting React application initialization...');

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
      <App />
    </StrictMode>
  );
  console.log('✅ FisioFlow: React render completed successfully!');
} catch (error) {
  console.error('❌ FisioFlow: Error during React render:', error);
  // Fallback error display
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        height: 100vh; 
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        font-family: system-ui, sans-serif;
      ">
        <div style="text-align: center; padding: 2rem;">
          <h1>❌ Erro ao carregar FisioFlow</h1>
          <p>Erro: ${error.message}</p>
          <button onclick="location.reload()" style="
            padding: 0.75rem 1.5rem;
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 1rem;
          ">
            Recarregar Página
          </button>
        </div>
      </div>
    `;
  }
}