import { useState, useEffect } from 'react';

const AppDebug = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const addError = (message: string) => {
    console.error(`[ERROR] ${message}`);
    setErrors(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('App Debug component mounted');
    
    // Capture any global errors
    const errorHandler = (event: ErrorEvent) => {
      addError(`Global error: ${event.message} at ${event.filename}:${event.lineno}`);
    };
    
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      addError(`Unhandled promise rejection: ${event.reason}`);
    };
    
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    
    // Test environment
    addLog(`Environment: ${import.meta.env.MODE}`);
    addLog(`Base URL: ${import.meta.env.BASE_URL}`);
    addLog(`Production: ${import.meta.env.PROD}`);
    addLog(`User Agent: ${navigator.userAgent}`);
    addLog(`Location: ${window.location.href}`);
    
    // Test localStorage
    try {
      localStorage.setItem('debug-test', 'working');
      localStorage.removeItem('debug-test');
      addLog('localStorage: working');
    } catch (error) {
      addError(`localStorage error: ${error}`);
    }
    
    // Test DOM
    try {
      const root = document.getElementById('root');
      addLog(`Root element: ${root ? 'found' : 'not found'}`);
      if (root) {
        addLog(`Root innerHTML length: ${root.innerHTML.length}`);
      }
    } catch (error) {
      addError(`DOM error: ${error}`);
    }
    
    // Test CSS loading
    try {
      const stylesheets = document.styleSheets;
      addLog(`Stylesheets loaded: ${stylesheets.length}`);
      for (let i = 0; i < stylesheets.length; i++) {
        const sheet = stylesheets[i];
        addLog(`Stylesheet ${i}: ${sheet.href || 'inline'}`);
      }
    } catch (error) {
      addError(`CSS error: ${error}`);
    }
    
    // Test if we can import modules
    addLog('Testing dynamic imports...');
    import('./AppRoutes').then(() => {
      addLog('AppRoutes import: success');
    }).catch((error) => {
      addError(`AppRoutes import failed: ${error}`);
    });
    
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
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
      <h1>🔍 FisioFlow Debug Mode</h1>
      <p>✅ React is working! This debug panel is rendering correctly.</p>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h2>📋 Debug Logs ({debugInfo.length})</h2>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '10px', 
            border: '1px solid #ccc',
            maxHeight: '300px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {debugInfo.map((log, index) => (
              <div key={index} style={{ marginBottom: '3px', color: '#333' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
        
        {errors.length > 0 && (
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h2>❌ Errors ({errors.length})</h2>
            <div style={{ 
              backgroundColor: '#ffe6e6', 
              padding: '10px', 
              border: '1px solid #ff9999',
              maxHeight: '300px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {errors.map((error, index) => (
                <div key={index} style={{ marginBottom: '3px', color: '#cc0000' }}>
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <h2>🧪 Test Actions:</h2>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button 
          onClick={() => addLog('Button clicked!')}
          style={{ 
            padding: '10px 20px', 
            fontSize: '14px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Click
        </button>
        
        <button 
          onClick={() => {
            addLog('Clearing debug mode...');
            localStorage.removeItem('fisioflow_debug');
            window.location.reload();
          }}
          style={{ 
            padding: '10px 20px', 
            fontSize: '14px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Exit Debug & Reload
        </button>
        
        <button 
          onClick={() => {
            addLog('Testing error handler...');
            throw new Error('Test error from debug panel');
          }}
          style={{ 
            padding: '10px 20px', 
            fontSize: '14px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Error
        </button>
        
        <button 
          onClick={() => {
            addLog('Copying debug info to clipboard...');
            const debugText = [...debugInfo, ...errors].join('\n');
            navigator.clipboard.writeText(debugText).then(() => {
              addLog('Debug info copied to clipboard!');
            }).catch(() => {
              addLog('Failed to copy to clipboard');
            });
          }}
          style={{ 
            padding: '10px 20px', 
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Copy Debug Info
        </button>
      </div>
      
      <div style={{ 
        backgroundColor: '#e9ecef', 
        padding: '15px', 
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>💡 Debug Instructions:</strong>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Add <code>?debug=true</code> to URL to enable debug mode</li>
          <li>Or set <code>localStorage.setItem('fisioflow_debug', 'true')</code> in console</li>
          <li>Check browser console for additional error details</li>
          <li>Use "Copy Debug Info" to share debug information</li>
        </ul>
      </div>
    </div>
  );
};

export default AppDebug;