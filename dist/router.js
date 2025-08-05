// Simple Router for FisioFlow
class FisioFlowRouter {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.setupRoutes();
  }

  setupRoutes() {
    // Define routes for different user roles
    this.routes.set('/', { 
      name: 'login', 
      requiresAuth: false,
      render: this.renderLogin.bind(this)
    });
    
    this.routes.set('/dashboard', { 
      name: 'dashboard', 
      requiresAuth: true,
      render: this.renderDashboard.bind(this)
    });
    
    this.routes.set('/admin', { 
      name: 'admin', 
      requiresAuth: true,
      roles: ['Admin'],
      render: this.renderAdminDashboard.bind(this)
    });
    
    this.routes.set('/therapist', { 
      name: 'therapist', 
      requiresAuth: true,
      roles: ['Fisioterapeuta'],
      render: this.renderTherapistDashboard.bind(this)
    });
    
    this.routes.set('/patient', { 
      name: 'patient', 
      requiresAuth: true,
      roles: ['Paciente'],
      render: this.renderPatientDashboard.bind(this)
    });
  }

  // Navigate to a route
  navigate(path) {
    const route = this.routes.get(path);
    if (!route) {
      console.error('Route not found:', path);
      return this.navigate('/');
    }

    // Check authentication
    if (route.requiresAuth && !window.FisioFlowAuth?.isAuthenticated()) {
      console.log('Authentication required, redirecting to login');
      return this.navigate('/');
    }

    // Check role permissions
    if (route.roles) {
      const user = window.FisioFlowAuth?.getCurrentUser();
      if (!user || !route.roles.includes(user.role)) {
        console.log('Insufficient permissions for route:', path);
        return this.navigate('/dashboard');
      }
    }

    this.currentRoute = path;
    history.pushState({ path }, '', path);
    route.render();
  }

  // Render login page
  renderLogin() {
    // Login page is already rendered by default HTML
    console.log('📱 Rendering login page');
  }

  // Render general dashboard
  renderDashboard() {
    const user = window.FisioFlowAuth?.getCurrentUser();
    if (!user) return this.navigate('/');

    // Redirect to role-specific dashboard
    const roleRoutes = {
      'Admin': '/admin',
      'Fisioterapeuta': '/therapist',
      'Paciente': '/patient'
    };

    const targetRoute = roleRoutes[user.role];
    if (targetRoute && targetRoute !== this.currentRoute) {
      return this.navigate(targetRoute);
    }

    this.renderGenericDashboard(user);
  }

  // Render admin dashboard
  renderAdminDashboard() {
    const user = window.FisioFlowAuth?.getCurrentUser();
    const root = document.getElementById('root');
    
    root.innerHTML = `
      <div style="min-height: 100vh; background: #f8fafc; font-family: system-ui;">
        ${this.renderHeader(user)}
        
        <div style="display: flex;">
          ${this.renderSidebar('admin')}
          
          <main style="flex: 1; padding: 2rem;">
            <div style="max-width: 1200px;">
              <h1 style="color: #1e293b; margin: 0 0 2rem 0;">Dashboard Administrativo</h1>
              
              <!-- Admin Stats -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #3b82f6;">
                  <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">24</div>
                  <div style="color: #64748b; font-size: 0.875rem;">Usuários Ativos</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #10b981;">
                  <div style="font-size: 2rem; font-weight: bold; color: #10b981;">3</div>
                  <div style="color: #64748b; font-size: 0.875rem;">Clínicas Ativas</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b;">
                  <div style="font-size: 2rem; font-weight: bold; color: #f59e0b;">R$ 45.2k</div>
                  <div style="color: #64748b; font-size: 0.875rem;">Receita Mensal</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #8b5cf6;">
                  <div style="font-size: 2rem; font-weight: bold; color: #8b5cf6;">98%</div>
                  <div style="color: #64748b; font-size: 0.875rem;">Uptime Sistema</div>
                </div>
              </div>

              <!-- Management Panels -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h3 style="margin: 0 0 1rem 0; color: #1e293b;">Gestão de Usuários</h3>
                  <p style="color: #64748b; margin-bottom: 1.5rem;">Administre usuários, permissões e acessos.</p>
                  <button onclick="alert('Funcionalidade em desenvolvimento')" style="
                    background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; 
                    border-radius: 6px; cursor: pointer; font-size: 0.875rem;
                  ">Gerenciar Usuários</button>
                </div>

                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h3 style="margin: 0 0 1rem 0; color: #1e293b;">Configurações do Sistema</h3>
                  <p style="color: #64748b; margin-bottom: 1.5rem;">Configure parâmetros globais e integrações.</p>
                  <button onclick="alert('Funcionalidade em desenvolvimento')" style="
                    background: #10b981; color: white; border: none; padding: 0.75rem 1.5rem; 
                    border-radius: 6px; cursor: pointer; font-size: 0.875rem;
                  ">Configurações</button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    `;
  }

  // Render therapist dashboard
  renderTherapistDashboard() {
    const user = window.FisioFlowAuth?.getCurrentUser();
    const root = document.getElementById('root');
    
    root.innerHTML = `
      <div style="min-height: 100vh; background: #f8fafc; font-family: system-ui;">
        ${this.renderHeader(user)}
        
        <div style="display: flex;">
          ${this.renderSidebar('therapist')}
          
          <main style="flex: 1; padding: 2rem;">
            <div style="max-width: 1200px;">
              <h1 style="color: #1e293b; margin: 0 0 2rem 0;">Dashboard Fisioterapeuta</h1>
              
              <!-- Therapist Stats -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #3b82f6;">
                  <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">32</div>
                  <div style="color: #64748b; font-size: 0.875rem;">Pacientes Ativos</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #10b981;">
                  <div style="font-size: 2rem; font-weight: bold; color: #10b981;">8</div>
                  <div style="color: #64748b; font-size: 0.875rem;">Consultas Hoje</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b;">
                  <div style="font-size: 2rem; font-weight: bold; color: #f59e0b;">14:30</div>
                  <div style="color: #64748b; font-size: 0.875rem;">Próxima Consulta</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #8b5cf6;">
                  <div style="font-size: 2rem; font-weight: bold; color: #8b5cf6;">94%</div>
                  <div style="color: #64748b; font-size: 0.875rem;">Taxa de Sucesso</div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h3 style="margin: 0 0 1rem 0; color: #1e293b;">Agenda do Dia</h3>
                  <div style="color: #64748b; margin-bottom: 1.5rem;">
                    <p>• 09:00 - João Silva (Avaliação)</p>
                    <p>• 10:30 - Maria Santos (Fisioterapia)</p>
                    <p>• 14:30 - Pedro Costa (Retorno)</p>
                    <p style="margin: 0;">• 16:00 - Ana Oliveira (Sessão)</p>
                  </div>
                  <button onclick="alert('Funcionalidade em desenvolvimento')" style="
                    background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; 
                    border-radius: 6px; cursor: pointer; font-size: 0.875rem;
                  ">Ver Agenda Completa</button>
                </div>

                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h3 style="margin: 0 0 1rem 0; color: #1e293b;">Ações Rápidas</h3>
                  <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <button onclick="alert('Funcionalidade em desenvolvimento')" style="
                      background: #10b981; color: white; border: none; padding: 0.75rem; 
                      border-radius: 6px; cursor: pointer; font-size: 0.875rem;
                    ">➕ Novo Paciente</button>
                    <button onclick="alert('Funcionalidade em desenvolvimento')" style="
                      background: #f59e0b; color: white; border: none; padding: 0.75rem; 
                      border-radius: 6px; cursor: pointer; font-size: 0.875rem;
                    ">📅 Agendar Consulta</button>
                    <button onclick="alert('Funcionalidade em desenvolvimento')" style="
                      background: #8b5cf6; color: white; border: none; padding: 0.75rem; 
                      border-radius: 6px; cursor: pointer; font-size: 0.875rem;
                    ">📋 Criar Prontuário</button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    `;
  }

  // Render patient dashboard
  renderPatientDashboard() {
    const user = window.FisioFlowAuth?.getCurrentUser();
    const root = document.getElementById('root');
    
    root.innerHTML = `
      <div style="min-height: 100vh; background: #f8fafc; font-family: system-ui;">
        ${this.renderHeader(user)}
        
        <div style="display: flex;">
          ${this.renderSidebar('patient')}
          
          <main style="flex: 1; padding: 2rem;">
            <div style="max-width: 1200px;">
              <h1 style="color: #1e293b; margin: 0 0 2rem 0;">Meu Portal do Paciente</h1>
              
              <!-- Patient Stats -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #3b82f6;">
                  <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">Amanhã</div>
                  <div style="color: #64748b; font-size: 0.875rem;">Próxima Consulta</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #10b981;">
                  <div style="font-size: 2rem; font-weight: bold; color: #10b981;">12</div>
                  <div style="color: #64748b; font-size: 0.875rem;">Sessões Realizadas</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #f59e0b;">
                  <div style="font-size: 2rem; font-weight: bold; color: #f59e0b;">78%</div>
                  <div style="color: #64748b; font-size: 0.875rem;">Progresso</div>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #8b5cf6;">
                  <div style="font-size: 2rem; font-weight: bold; color: #8b5cf6;">5</div>
                  <div style="color: #64748b; font-size: 0.875rem;">Exercícios Novos</div>
                </div>
              </div>

              <!-- Patient Content -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h3 style="margin: 0 0 1rem 0; color: #1e293b;">Próximas Consultas</h3>
                  <div style="color: #64748b; margin-bottom: 1.5rem;">
                    <p>🏥 <strong>Amanhã 14:30</strong><br>Fisioterapia - Dra. Ana Santos</p>
                    <p>🏥 <strong>Sex 10:00</strong><br>Reavaliação - Dr. Carlos Silva</p>
                    <p style="margin: 0;">🏥 <strong>Seg 16:00</strong><br>Sessão - Dra. Ana Santos</p>
                  </div>
                  <button onclick="alert('Funcionalidade em desenvolvimento')" style="
                    background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; 
                    border-radius: 6px; cursor: pointer; font-size: 0.875rem;
                  ">Ver Todas</button>
                </div>

                <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <h3 style="margin: 0 0 1rem 0; color: #1e293b;">Exercícios do Dia</h3>
                  <div style="color: #64748b; margin-bottom: 1.5rem;">
                    <p>✅ Alongamento cervical (Concluído)</p>
                    <p>⏳ Fortalecimento lombar (Pendente)</p>
                    <p>⏳ Exercícios respiratórios (Pendente)</p>
                    <p style="margin: 0;">⏳ Mobilização articular (Pendente)</p>
                  </div>
                  <button onclick="alert('Funcionalidade em desenvolvimento')" style="
                    background: #10b981; color: white; border: none; padding: 0.75rem 1.5rem; 
                    border-radius: 6px; cursor: pointer; font-size: 0.875rem;
                  ">Iniciar Exercícios</button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    `;
  }

  // Render header component
  renderHeader(user) {
    return `
      <header style="
        background: white;
        border-bottom: 1px solid #e2e8f0;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      ">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <h1 style="margin: 0; color: #1e293b; font-size: 1.5rem; cursor: pointer;" onclick="router.navigate('/dashboard')">
            🏥 FisioFlow
          </h1>
          <span style="
            background: #0ea5e9; color: white; padding: 0.25rem 0.75rem; 
            border-radius: 12px; font-size: 0.75rem; font-weight: 500;
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
            width: 40px; height: 40px; border-radius: 50%; border: 2px solid #e2e8f0;
          ">
          <button onclick="logout()" style="
            background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; 
            border-radius: 6px; cursor: pointer; font-size: 0.875rem;
          ">
            Sair
          </button>
        </div>
      </header>
    `;
  }

  // Render sidebar component
  renderSidebar(type) {
    const menus = {
      admin: [
        { icon: '📊', label: 'Dashboard', active: true },
        { icon: '👥', label: 'Usuários' },
        { icon: '🏥', label: 'Clínicas' },
        { icon: '📈', label: 'Relatórios' },
        { icon: '⚙️', label: 'Configurações' }
      ],
      therapist: [
        { icon: '📊', label: 'Dashboard', active: true },
        { icon: '👤', label: 'Pacientes' },
        { icon: '📅', label: 'Agenda' },
        { icon: '📋', label: 'Prontuários' },
        { icon: '🏃', label: 'Exercícios' }
      ],
      patient: [
        { icon: '📊', label: 'Dashboard', active: true },
        { icon: '🏥', label: 'Consultas' },
        { icon: '🏃', label: 'Exercícios' },
        { icon: '📈', label: 'Progresso' },
        { icon: '💬', label: 'Mensagens' }
      ]
    };

    const items = menus[type] || menus.patient;

    return `
      <aside style="
        width: 250px; background: white; border-right: 1px solid #e2e8f0; 
        min-height: calc(100vh - 73px); padding: 1.5rem 0;
      ">
        <nav>
          ${items.map(item => `
            <a href="#" onclick="alert('Funcionalidade em desenvolvimento')" style="
              display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.5rem; 
              color: ${item.active ? '#0ea5e9' : '#64748b'}; text-decoration: none; 
              border-right: ${item.active ? '3px solid #0ea5e9' : '3px solid transparent'};
              background: ${item.active ? '#f0f9ff' : 'transparent'};
            ">
              <span style="font-size: 1.25rem;">${item.icon}</span>
              <span>${item.label}</span>
            </a>
          `).join('')}
        </nav>
      </aside>
    `;
  }

  // Generic dashboard fallback
  renderGenericDashboard(user) {
    console.log('Rendering generic dashboard for user:', user);
    // This would be the existing dashboard code
  }
}

// Initialize router
window.router = new FisioFlowRouter();

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
  const path = event.state?.path || '/';
  window.router.navigate(path);
});

console.log('✅ FisioFlow Router initialized');