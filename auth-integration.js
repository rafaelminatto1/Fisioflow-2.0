// Authentication Integration for FisioFlow Login
class FisioFlowAuth {
  constructor() {
    this.currentUser = null;
    this.sessionKey = 'fisioflow_user_session';
    this.apiEndpoint = '/api/auth'; // Placeholder for future API
  }

  // Simulate authentication with mock users
  async authenticate(email, password) {
    console.log('🔐 FisioFlow: Iniciando autenticação...');
    
    // Mock users for demonstration
    const mockUsers = {
      'admin@fisioflow.com': {
        id: '1',
        name: 'Dr. Carlos Silva',
        email: 'admin@fisioflow.com',
        role: 'Admin',
        permissions: ['read', 'write', 'admin'],
        clinicId: 'clinic_001',
        avatar: 'https://ui-avatars.com/api/?name=Carlos+Silva&background=0ea5e9&color=fff'
      },
      'fisio@fisioflow.com': {
        id: '2',
        name: 'Dra. Ana Santos',
        email: 'fisio@fisioflow.com',
        role: 'Fisioterapeuta',
        permissions: ['read', 'write'],
        clinicId: 'clinic_001',
        avatar: 'https://ui-avatars.com/api/?name=Ana+Santos&background=3b82f6&color=fff'
      },
      'paciente@fisioflow.com': {
        id: '3',
        name: 'João Oliveira',
        email: 'paciente@fisioflow.com',
        role: 'Paciente',
        permissions: ['read'],
        clinicId: 'clinic_001',
        avatar: 'https://ui-avatars.com/api/?name=João+Oliveira&background=10b981&color=fff'
      }
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check credentials
    if (mockUsers[email] && password.length >= 6) {
      const user = mockUsers[email];
      
      // Create session
      const session = {
        user,
        token: this.generateToken(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        createdAt: Date.now()
      };

      // Store session
      localStorage.setItem(this.sessionKey, JSON.stringify(session));
      sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
      
      this.currentUser = user;
      
      console.log('✅ FisioFlow: Autenticação realizada com sucesso', user);
      return { success: true, user, token: session.token };
    } else {
      console.log('❌ FisioFlow: Credenciais inválidas');
      throw new Error('Email ou senha incorretos');
    }
  }

  // Generate simple JWT-like token
  generateToken() {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
      iat: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000),
      iss: 'fisioflow'
    }));
    const signature = btoa('fisioflow_signature_' + Date.now());
    return `${header}.${payload}.${signature}`;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const session = this.getSession();
    return session && session.expiresAt > Date.now();
  }

  // Get current session
  getSession() {
    try {
      const sessionData = localStorage.getItem(this.sessionKey) || 
                          sessionStorage.getItem(this.sessionKey);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error parsing session:', error);
      return null;
    }
  }

  // Get current user
  getCurrentUser() {
    const session = this.getSession();
    return session?.user || null;
  }

  // Logout
  logout() {
    localStorage.removeItem(this.sessionKey);
    sessionStorage.removeItem(this.sessionKey);
    this.currentUser = null;
    console.log('🚪 FisioFlow: Logout realizado');
  }

  // Check user role
  hasRole(role) {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check user permission
  hasPermission(permission) {
    const user = this.getCurrentUser();
    return user?.permissions?.includes(permission) || false;
  }
}

// Initialize authentication system
window.FisioFlowAuth = new FisioFlowAuth();

// Enhanced login handler
async function handleLogin(event) {
  event.preventDefault();
  
  const submitButton = event.target.querySelector('button[type="submit"]');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  
  // Validation
  if (!email || !password) {
    showMessage('❌ Por favor, preencha todos os campos.', 'error');
    return;
  }

  // Disable form during authentication
  submitButton.disabled = true;
  submitButton.textContent = 'Entrando...';
  submitButton.style.backgroundColor = '#94a3b8';
  
  try {
    // Authenticate user
    const result = await window.FisioFlowAuth.authenticate(email, password);
    
    if (result.success) {
      showMessage(`✅ Bem-vindo, ${result.user.name}!`, 'success');
      
      // Wait a moment then redirect
      setTimeout(() => {
        redirectToDashboard(result.user);
      }, 1500);
    }
  } catch (error) {
    console.error('Login error:', error);
    showMessage(`❌ ${error.message}`, 'error');
    
    // Re-enable form
    submitButton.disabled = false;
    submitButton.textContent = 'Entrar';
    submitButton.style.backgroundColor = '#0ea5e9';
  }
}

// Show message to user
function showMessage(message, type = 'info') {
  // Remove existing messages
  const existingMessage = document.querySelector('.auth-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = 'auth-message';
  messageEl.innerHTML = message;
  
  // Style based on type
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6'
  };
  
  messageEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    font-family: system-ui, sans-serif;
    font-size: 0.875rem;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  document.body.appendChild(messageEl);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.remove();
    }
  }, 5000);
}

// Redirect to appropriate dashboard
function redirectToDashboard(user) {
  console.log('🎯 FisioFlow: Redirecionando para dashboard...', user);
  
  // Use router if available, otherwise fallback to showDashboard
  if (window.router) {
    const dashboardUrl = getDashboardUrl(user.role);
    window.router.navigate(dashboardUrl);
  } else {
    showDashboard(user);
  }
}

// Get dashboard URL based on user role
function getDashboardUrl(role) {
  const dashboards = {
    'Admin': '/admin',
    'Fisioterapeuta': '/therapist', 
    'Paciente': '/patient',
    'EducadorFisico': '/educator'
  };
  
  return dashboards[role] || '/dashboard';
}

// Show dashboard interface (placeholder)
function showDashboard(user) {
  const root = document.getElementById('root');
  
  root.innerHTML = `
    <div style="
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      font-family: system-ui, sans-serif;
    ">
      <!-- Header -->
      <header style="
        background: white;
        border-bottom: 1px solid #e2e8f0;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      ">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <h1 style="margin: 0; color: #1e293b; font-size: 1.5rem;">
            🏥 FisioFlow
          </h1>
          <span style="
            background: #0ea5e9;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
          ">
            ${user.role}
          </span>
        </div>
        
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="text-align: right;">
            <div style="font-weight: 500; color: #1e293b;">${user.name}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${user.email}</div>
          </div>
          <img src="${user.avatar}" alt="Avatar" style="
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid #e2e8f0;
          ">
          <button onclick="logout()" style="
            background: #ef4444;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
          ">
            Sair
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main style="padding: 2rem;">
        <div style="max-width: 1200px; margin: 0 auto;">
          <div style="
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
          ">
            <h2 style="margin: 0 0 1rem 0; color: #1e293b;">
              Bem-vindo ao Dashboard
            </h2>
            <p style="color: #64748b; margin: 0;">
              Você está logado como <strong>${user.role}</strong>. 
              Este é o início do seu sistema de gestão FisioFlow.
            </p>
          </div>

          <!-- Quick Stats -->
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          ">
            ${getQuickStats(user.role)}
          </div>

          <!-- Recent Activity -->
          <div style="
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          ">
            <h3 style="margin: 0 0 1rem 0; color: #1e293b;">
              Atividades Recentes
            </h3>
            <div style="color: #64748b;">
              <p>• Sistema iniciado com sucesso</p>
              <p>• Autenticação realizada</p>
              <p>• Dashboard carregado</p>
              <p style="margin: 0;">• Pronto para uso</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
  
  console.log('✅ FisioFlow: Dashboard carregado com sucesso');
}

// Generate quick stats based on user role
function getQuickStats(role) {
  const stats = {
    'Admin': [
      { title: 'Usuários Ativos', value: '24', color: '#3b82f6' },
      { title: 'Clínicas', value: '3', color: '#10b981' },
      { title: 'Sessões Hoje', value: '47', color: '#f59e0b' },
      { title: 'Receita Mensal', value: 'R$ 15.2k', color: '#8b5cf6' }
    ],
    'Fisioterapeuta': [
      { title: 'Pacientes', value: '32', color: '#3b82f6' },
      { title: 'Consultas Hoje', value: '8', color: '#10b981' },
      { title: 'Próxima Consulta', value: '14:30', color: '#f59e0b' },
      { title: 'Taxa Sucesso', value: '94%', color: '#8b5cf6' }
    ],
    'Paciente': [
      { title: 'Próxima Consulta', value: 'Amanhã', color: '#3b82f6' },
      { title: 'Sessões Realizadas', value: '12', color: '#10b981' },
      { title: 'Progresso', value: '78%', color: '#f59e0b' },
      { title: 'Exercícios', value: '5 novos', color: '#8b5cf6' }
    ]
  };

  const userStats = stats[role] || stats['Paciente'];
  
  return userStats.map(stat => `
    <div style="
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      border-left: 4px solid ${stat.color};
    ">
      <div style="font-size: 2rem; font-weight: bold; color: ${stat.color};">
        ${stat.value}
      </div>
      <div style="color: #64748b; font-size: 0.875rem; margin-top: 0.5rem;">
        ${stat.title}
      </div>
    </div>
  `).join('');
}

// Logout function
function logout() {
  if (confirm('Tem certeza que deseja sair?')) {
    window.FisioFlowAuth.logout();
    location.reload();
  }
}

// Auto-login check on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 FisioFlow: Sistema de autenticação inicializado');
  
  // Check if user is already logged in
  if (window.FisioFlowAuth.isAuthenticated()) {
    const user = window.FisioFlowAuth.getCurrentUser();
    console.log('👤 FisioFlow: Usuário já autenticado:', user);
    
    // Show dashboard immediately
    setTimeout(() => {
      showDashboard(user);
    }, 500);
  }
});

console.log('✅ FisioFlow: Auth integration loaded successfully');