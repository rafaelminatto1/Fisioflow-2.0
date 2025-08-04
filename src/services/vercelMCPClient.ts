interface VercelMCPConfig {
  apiToken: string;
  teamId?: string;
  projectId?: string;
  region?: string;
  maxRetries: number;
  timeoutMs: number;
}

interface DeploymentStatus {
  id: string;
  url: string;
  status: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  createdAt: number;
  buildTime?: number;
}

interface MCPOperation {
  id: string;
  type: 'deploy' | 'status' | 'logs' | 'rollback';
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

class VercelMCPClient {
  private config: VercelMCPConfig;
  private operationQueue: MCPOperation[] = [];
  private isConnected: boolean = false;
  private retryAttempts: Map<string, number> = new Map();

  constructor(config: VercelMCPConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.apiToken) {
      throw new Error('Vercel API token is required for MCP client');
    }
    
    if (this.config.maxRetries < 0 || this.config.maxRetries > 10) {
      throw new Error('maxRetries must be between 0 and 10');
    }
    
    if (this.config.timeoutMs < 1000 || this.config.timeoutMs > 300000) {
      throw new Error('timeoutMs must be between 1000 and 300000 (5 minutes)');
    }
  }

  async connect(): Promise<boolean> {
    try {
      // Test connection with a simple API call
      const response = await this.makeRequest('/user', 'GET');
      this.isConnected = response.ok;
      
      if (this.isConnected) {
        console.log('✅ VercelMCPClient connected successfully');
      } else {
        console.error('❌ VercelMCPClient connection failed');
      }
      
      return this.isConnected;
    } catch (error) {
      console.error('VercelMCPClient connection error:', error);
      this.isConnected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.operationQueue = [];
    this.retryAttempts.clear();
    console.log('VercelMCPClient disconnected');
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<Response> {
    const url = `https://api.vercel.com${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
    };

    if (this.config.teamId) {
      headers['X-Vercel-Team-Id'] = this.config.teamId;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.config.timeoutMs)
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    return fetch(url, requestOptions);
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string
  ): Promise<T> {
    const maxRetries = this.config.maxRetries;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const result = await operation();
        this.retryAttempts.delete(operationId);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.retryAttempts.set(operationId, attempt + 1);
        
        if (attempt < maxRetries) {
          console.warn(`Operation ${operationId} failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
        }
      }
    }

    throw new Error(`Operation ${operationId} failed after ${maxRetries + 1} attempts: ${lastError.message}`);
  }

  async createDeployment(options: {
    name: string;
    files?: Record<string, string>;
    buildCommand?: string;
    framework?: string;
    gitSource?: {
      repo: string;
      branch?: string;
    };
  }): Promise<DeploymentStatus> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    const operationId = `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return this.executeWithRetry(async () => {
      const deploymentData: any = {
        name: options.name,
        projectSettings: {
          framework: options.framework || 'vite',
          buildCommand: options.buildCommand || 'npm run build',
          outputDirectory: 'dist'
        }
      };

      if (options.gitSource) {
        deploymentData.gitSource = {
          type: 'github',
          repo: options.gitSource.repo,
          ref: options.gitSource.branch || 'main'
        };
      } else if (options.files) {
        deploymentData.files = Object.entries(options.files).map(([file, data]) => ({
          file,
          data
        }));
      }

      const response = await this.makeRequest('/deployments', 'POST', deploymentData);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Deployment creation failed: ${error}`);
      }

      const deployment = await response.json();
      
      return {
        id: deployment.id,
        url: deployment.url,
        status: deployment.readyState,
        readyState: deployment.readyState,
        createdAt: deployment.createdAt,
      };
    }, operationId);
  }

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    const operationId = `status-${deploymentId}`;
    
    return this.executeWithRetry(async () => {
      const response = await this.makeRequest(`/deployments/${deploymentId}`, 'GET');
      
      if (!response.ok) {
        throw new Error(`Failed to get deployment status: ${response.statusText}`);
      }

      const deployment = await response.json();
      
      return {
        id: deployment.id,
        url: deployment.url,
        status: deployment.readyState,
        readyState: deployment.readyState,
        createdAt: deployment.createdAt,
        buildTime: deployment.ready ? deployment.ready - deployment.createdAt : undefined,
      };
    }, operationId);
  }

  async waitForDeployment(
    deploymentId: string, 
    maxWaitTimeMs: number = 300000, // 5 minutes
    pollIntervalMs: number = 5000 // 5 seconds
  ): Promise<DeploymentStatus> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTimeMs) {
      const status = await this.getDeploymentStatus(deploymentId);
      
      if (status.status === 'READY' || status.status === 'ERROR' || status.status === 'CANCELED') {
        return status;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
    
    throw new Error(`Deployment ${deploymentId} did not complete within ${maxWaitTimeMs}ms`);
  }

  async getDeploymentLogs(deploymentId: string): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    const operationId = `logs-${deploymentId}`;
    
    return this.executeWithRetry(async () => {
      const response = await this.makeRequest(`/deployments/${deploymentId}/events`, 'GET');
      
      if (!response.ok) {
        throw new Error(`Failed to get deployment logs: ${response.statusText}`);
      }

      const events = await response.json();
      return events.map((event: any) => `${new Date(event.created).toISOString()}: ${event.text}`);
    }, operationId);
  }

  async rollbackDeployment(currentDeploymentId: string, targetDeploymentId: string): Promise<DeploymentStatus> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    const operationId = `rollback-${currentDeploymentId}-to-${targetDeploymentId}`;
    
    return this.executeWithRetry(async () => {
      // Get the target deployment details
      const targetDeployment = await this.getDeploymentStatus(targetDeploymentId);
      
      if (targetDeployment.status !== 'READY') {
        throw new Error(`Target deployment ${targetDeploymentId} is not in READY state`);
      }

      // Create a new deployment based on the target
      const response = await this.makeRequest('/deployments', 'POST', {
        target: 'production',
        deploymentId: targetDeploymentId
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Rollback failed: ${error}`);
      }

      const rollbackDeployment = await response.json();
      
      return {
        id: rollbackDeployment.id,
        url: rollbackDeployment.url,
        status: rollbackDeployment.readyState,
        readyState: rollbackDeployment.readyState,
        createdAt: rollbackDeployment.createdAt,
      };
    }, operationId);
  }

  async listDeployments(limit: number = 20): Promise<DeploymentStatus[]> {
    if (!this.isConnected) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    const operationId = `list-deployments-${Date.now()}`;
    
    return this.executeWithRetry(async () => {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      
      if (this.config.projectId) {
        params.set('projectId', this.config.projectId);
      }

      const response = await this.makeRequest(`/deployments?${params}`, 'GET');
      
      if (!response.ok) {
        throw new Error(`Failed to list deployments: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.deployments.map((deployment: any) => ({
        id: deployment.id,
        url: deployment.url,
        status: deployment.readyState,
        readyState: deployment.readyState,
        createdAt: deployment.createdAt,
        buildTime: deployment.ready ? deployment.ready - deployment.createdAt : undefined,
      }));
    }, operationId);
  }

  // Health check and monitoring
  getConnectionStatus(): {
    isConnected: boolean;
    queuedOperations: number;
    retryOperations: number;
  } {
    return {
      isConnected: this.isConnected,
      queuedOperations: this.operationQueue.length,
      retryOperations: this.retryAttempts.size,
    };
  }

  // Clear retry state for debugging/maintenance
  clearRetryState(): void {
    this.retryAttempts.clear();
  }
}

export { VercelMCPClient };
export type { VercelMCPConfig, DeploymentStatus, MCPOperation };