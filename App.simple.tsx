import React from 'react';

const SimpleApp = () => {
  return (
    <div style={{ 
      padding: '40px', 
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
        padding: '60px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: '500px'
      }}>
        <h1 style={{ 
          color: '#007bff', 
          margin: '0 0 20px 0',
          fontSize: '2.5rem'
        }}>
          🏥 FisioFlow 2.0
        </h1>
        <p style={{ 
          color: '#666', 
          margin: '0 0 30px 0',
          fontSize: '1.1rem',
          lineHeight: '1.6'
        }}>
          ✅ React está funcionando!<br/>
          ✅ JavaScript está carregando!<br/>
          ✅ CSS está aplicado!
        </p>
        
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>Informações do Sistema:</h3>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px',
            fontSize: '14px',
            textAlign: 'left'
          }}>
            <div><strong>URL:</strong> {window.location.href}</div>
            <div><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</div>
            <div><strong>LocalStorage:</strong> {typeof localStorage !== 'undefined' ? '✅ Disponível' : '❌ Indisponível'}</div>
            <div><strong>React:</strong> {typeof React !== 'undefined' ? '✅ Carregado' : '❌ Não carregado'}</div>
          </div>
        </div>
        
        <button 
          onClick={() => {
            console.log('Botão clicado!');
            alert('FisioFlow está funcionando! 🎉');
          }}
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🧪 Testar Interação
        </button>
        
        <button 
          onClick={() => {
            localStorage.setItem('fisioflow_debug', 'false');
            window.location.reload();
          }}
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🚀 Tentar App Completo
        </button>
      </div>
    </div>
  );
};

export default SimpleApp;