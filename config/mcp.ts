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