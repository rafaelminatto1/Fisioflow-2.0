/**
 * MCP Configuration Management for Vercel Integration
 * Handles secure configuration, environment management, and credential storage
 */

export interface MCPServerConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
  disabled: boolean;
  autoApprove: string[];
}

export interface MCPConfiguration {
  mcpServers: {
    vercel: MCPServerConfig;
  };
}

export interface VercelCredentials {
  token: string;
  projectId: string;
  teamId?: string;
  environment: 'development' | 'preview' | 'production';
}

export interface MCPConnectionConfig {
  timeout: number;
  retryAttempts: number;
  backoffStrategy: 'exponential' | 'linear';
  keepAlive: boolean;
  maxConnections: number;
}

export interface MCPEnvironmentConfig {
  development: {
    vercel: {
      projectId: string;
      teamId?: string;
      previewBranches: string[];
    };
    mcp: {
      logLevel: 'debug' | 'info' | 'warn' | 'error';
      enableMockMode: boolean;
      cacheEnabled: boolean;
    };
  };
  production: {
    vercel: {
      projectId: string;
      teamId?: string;
      regions: string[];
    };
    mcp: {
      logLevel: 'warn' | 'error';
      enableMockMode: boolean;
      cacheEnabled: boolean;
      cacheTTL: number;
    };
  };
}

/**
 * Default MCP configuration for Vercel integration
 */
export const DEFAULT_MCP_CONFIG: MCPConfiguration = {
  mcpServers: {
    vercel: {
      command: 'uvx',
      args: ['vercel-mcp-server@latest'],
      env: {
        VERCEL_TOKEN: process.env.VERCEL_TOKEN || '',
        VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID || '',
        VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID || '',
        MCP_LOG_LEVEL: process.env.MCP_LOG_LEVEL || 'INFO',
        FASTMCP_LOG_LEVEL: 'ERROR'
      },
      disabled: false,
      autoApprove: [
        'get-deployments',
        'get-deployment-status',
        'get-project-info',
        'get-analytics',
        'get-performance-metrics'
      ]
    }
  }
};

/**
 * Environment-specific configuration
 */
export const MCP_ENV_CONFIG: MCPEnvironmentConfig = {
  development: {
    vercel: {
      projectId: process.env.VERCEL_PROJECT_ID || '',
      teamId: process.env.VERCEL_TEAM_ID,
      previewBranches: ['develop', 'staging', 'feature/*']
    },
    mcp: {
      logLevel: 'debug',
      enableMockMode: false,
      cacheEnabled: false
    }
  },
  production: {
    vercel: {
      projectId: process.env.VERCEL_PROJECT_ID || '',
      teamId: process.env.VERCEL_TEAM_ID,
      regions: ['iad1', 'sfo1', 'fra1']
    },
    mcp: {
      logLevel: 'error',
      enableMockMode: false,
      cacheEnabled: true,
      cacheTTL: 300000 // 5 minutes
    }
  }
};

/**
 * Connection configuration with retry logic
 */
export const MCP_CONNECTION_CONFIG: MCPConnectionConfig = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  backoffStrategy: 'exponential',
  keepAlive: true,
  maxConnections: 5
};

/**
 * Get current environment configuration
 */
export function getCurrentEnvironmentConfig(): MCPEnvironmentConfig[keyof MCPEnvironmentConfig] {
  const env = process.env.NODE_ENV as 'development' | 'production';
  return MCP_ENV_CONFIG[env] || MCP_ENV_CONFIG.development;
}

/**
 * Validate MCP configuration
 */
export function validateMCPConfig(config: MCPConfiguration): boolean {
  const { vercel } = config.mcpServers;
  
  if (!vercel) {
    console.error('MCP Config Error: Vercel server configuration missing');
    return false;
  }
  
  if (!vercel.env.VERCEL_TOKEN) {
    console.error('MCP Config Error: VERCEL_TOKEN environment variable required');
    return false;
  }
  
  if (!vercel.env.VERCEL_PROJECT_ID) {
    console.error('MCP Config Error: VERCEL_PROJECT_ID environment variable required');
    return false;
  }
  
  return true;
}

/**
 * Get MCP configuration with environment variable substitution
 */
export function getMCPConfig(): MCPConfiguration {
  const config = { ...DEFAULT_MCP_CONFIG };
  
  // Substitute environment variables
  config.mcpServers.vercel.env = {
    ...config.mcpServers.vercel.env,
    VERCEL_TOKEN: process.env.VERCEL_TOKEN || '',
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID || '',
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID || '',
    MCP_LOG_LEVEL: process.env.MCP_LOG_LEVEL || 'INFO'
  };
  
  return config;
}