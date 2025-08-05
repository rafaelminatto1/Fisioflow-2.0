import React, { useState } from 'react';

const LoginApp = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', formData);
    // Aqui seria a lógica de autenticação
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#1e293b',
            margin: '0 0 0.5rem 0'
          }}>
            🏥 FisioFlow
          </h1>
          <p style={{ 
            color: '#64748b', 
            margin: '0',
            fontSize: '0.875rem'
          }}>
            Sistema de Gestão de Clínicas
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Senha
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              marginTop: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0ea5e9'}
          >
            Entrar
          </button>
        </form>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{ 
            fontSize: '0.75rem', 
            color: '#9ca3af',
            margin: '0'
          }}>
            FisioFlow 2.0 - Sistema completo de gestão
          </p>
          <p style={{ 
            fontSize: '0.75rem', 
            color: '#9ca3af',
            margin: '0.25rem 0 0 0'
          }}>
            Build: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginApp;