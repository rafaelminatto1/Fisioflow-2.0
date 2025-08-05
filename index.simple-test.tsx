import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import AppSimpleTest from './App.simple-test';

console.log('🧪 Simple Test: Starting application initialization...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Simple Test: Root element not found!');
  throw new Error("Could not find root element to mount to");
}

console.log('✅ Simple Test: Root element found, creating React root...');

const root = ReactDOM.createRoot(rootElement);

try {
  console.log('🎯 Simple Test: Rendering React application...');
  root.render(
    <StrictMode>
      <AppSimpleTest />
    </StrictMode>
  );
  console.log('✅ Simple Test: React render completed successfully!');
} catch (error) {
  console.error('❌ Simple Test: Error during React render:', error);
}