import { useState, useEffect } from 'react';

const AppDebug = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('App Debug component mounted');
    
    // Test if we're in the right environment
    addLog(`Environment: ${import.meta.env.MODE}`);
    addLog(`Base URL: ${import.meta.env.BASE_URL}`);
    addLog(`Production: ${import.meta.env.PROD}`);
    
    // Test if we can access localStorage
    try {
      localStorage.setItem('debug-test', 'working');
      addLog('localStorage: working');
    } catch (error) {
      addLog(`localStorage error: ${error}`);
    }
    
    // Test if we can access the DOM
    try {
      const root = document.getElementById('root');
      addLog(`Root element: ${root ? 'found' : 'not found'}`);
    } catch (error) {
      addLog(`DOM error: ${error}`);
    }
    
    return () => {
      addLog('App Debug component unmounting');
    };
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1>FisioFlow Debug Mode</h1>
      <p>If you see this, React is working!</p>
      
      <h2>Debug Information:</h2>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '10px', 
        border: '1px solid #ccc',
        maxHeight: '300px',
        overflow: 'auto'
      }}>
        {debugInfo.map((log, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {log}
          </div>
        ))}
      </div>
      
      <h2>Test Button:</h2>
      <button 
        onClick={() => addLog('Button clicked!')}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          marginRight: '10px'
        }}
      >
        Test Click
      </button>
      
      <button 
        onClick={() => {
          addLog('Attempting to load main app...');
          // We could dynamically import the main app here
          window.location.hash = '#/login';
        }}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none'
        }}
      >
        Try Load Main App
      </button>
    </div>
  );
};

export default AppDebug;