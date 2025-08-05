import React from 'react';

const AppSimpleTest = () => {
  console.log('🧪 Simple test App loading...');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>FisioFlow Test App</h1>
      <p>Esta é uma versão de teste simplificada para verificar se o build está funcionando.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
};

export default AppSimpleTest;