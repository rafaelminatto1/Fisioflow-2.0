/**
 * MCP (Model Context Protocol) Configuration Types
 * Defines TypeScript interfaces for MCP client configuration
 */

export interface MCPServerConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
  disabled: boolean;
  autoApprove: string[];
}

export interface MCPConfiguration {
  mcpServers: Record<string, MCPServerConfig>;
}

export interface VercelCredentials {
  apiKey: string;
  projectId: string;
  teamId?: string;
  token?: string; // For backward compatibility
}

export interface MCPConnectionConfig {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  maxConcurrentConnections?: number;
}

export interface MCPServerStatus {
  name: string;
  connected: boolean;
  lastError?: string;
  lastConnected?: Date;
}

export interface MCPClientOptions {
  configuration: MCPConfiguration;
  credentials?: VercelCredentials;
  connectionConfig?: MCPConnectionConfig;
}

// Default configuration values
export const DEFAULT_MCP_CONNECTION_CONFIG: MCPConnectionConfig = {
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  maxConcurrentConnections: 5,
};

// Alias for backward compatibility
export const MCP_CONNECTION_CONFIG = DEFAULT_MCP_CONNECTION_CONFIG;

// Configuration getter function
export function getMCPConfig(): MCPConfiguration {
  // This would typically load from a config file or environment
  // For now, return a default configuration
  return {
    mcpServers: {
      vercel: {
        command: 'uvx',
        args: ['vercel-mcp-server@latest'],
        env: {
          VERCEL_TOKEN: '${VERCEL_TOKEN}',
          VERCEL_PROJECT_ID: '${VERCEL_PROJECT_ID}',
          VERCEL_TEAM_ID: '${VERCEL_TEAM_ID}',
          MCP_LOG_LEVEL: 'INFO',
          FASTMCP_LOG_LEVEL: 'ERROR'
        },
        disabled: true,
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
}

// MCP Server types for specific servers
export interface VercelMCPServerConfig extends MCPServerConfig {
  env: {
    VERCEL_TOKEN: string;
    VERCEL_PROJECT_ID: string;
    VERCEL_TEAM_ID?: string;
    MCP_LOG_LEVEL?: string;
    FASTMCP_LOG_LEVEL?: string;
  };
}

export interface GitMCPServerConfig extends MCPServerConfig {
  env: {
    MCP_LOG_LEVEL?: string;
  };
}

export interface SQLiteMCPServerConfig extends MCPServerConfig {
  env: {
    MCP_LOG_LEVEL?: string;
  };
}

// Type guards for server configurations
export function isVercelMCPServerConfig(config: MCPServerConfig): config is VercelMCPServerConfig {
  return 'VERCEL_TOKEN' in config.env;
}

export function isGitMCPServerConfig(config: MCPServerConfig): config is GitMCPServerConfig {
  return config.command === 'uvx' && config.args.includes('mcp-server-git@latest');
}

export function isSQLiteMCPServerConfig(config: MCPServerConfig): config is SQLiteMCPServerConfig {
  return config.command === 'uvx' && config.args.includes('mcp-server-sqlite@latest');
}