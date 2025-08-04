/**
 * MCP Client for Vercel Integration
 * Handles connection management, tool execution, and error handling
 */

import type { MCPConfiguration, MCPConnectionConfig } from '@/config/mcp';
import { getCredentialManager } from '@/utils/credentialManager';
import { getMCPConfig, MCP_CONNECTION_CONFIG } from '@/config/mcp';

export interface ToolParams {
  [key: string]: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    timestamp: string;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface HealthStatus {
  connected: boolean;
  lastPing: string;
  responseTime: number;
  serverVersion?: string;
  toolsAvailable: number;
}

export interface MCPMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uptime: number;
  lastError?: string;
}

export type MCPEvent = 
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'tool_executed'
  | 'health_check';

export type EventHandler = (data?: any) => void;

/**
 * Main MCP Client for Vercel integration
 */
export class VercelMCPClient {
  private static instance: VercelMCPClient;
  private connected: boolean = false;
  private config: MCPConfiguration;
  private connectionConfig: MCPConnectionConfig;
  private eventHandlers: Map<MCPEvent, EventHandler[]> = new Map();
  private metrics: MCPMetrics;
  private connectionStartTime: number = 0;
  private availableTools: ToolDefinition[] = [];

  private constructor() {
    this.config = getMCPConfig();
    this.connectionConfig = MCP_CONNECTION_CONFIG;
    this.metrics = this.initializeMetrics();
    this.setupEventHandlers();
  }

  public static getInstance(): VercelMCPClient {
    if (!VercelMCPClient.instance) {
      VercelMCPClient.instance = new VercelMCPClient();
    }
    return VercelMCPClient.instance;
  }

  /**
   * Connect to MCP server
   */
  public async connect(): Promise<void> {
    try {
      console.log('🔌 Connecting to Vercel MCP server...');
      this.connectionStartTime = Date.now();

      // Validate credentials
      const credentialManager = getCredentialManager();
      const credentials = await credentialManager.retrieveCredentials();
      
      if (!credentials) {
        throw new Error('No Vercel credentials found. Please configure credentials first.');
      }

      const validation = await credentialManager.validateToken(credentials.token);
      if (!validation.isValid) {
        throw new Error(`Invalid Vercel token: ${validation.error}`);
      }

      // Simulate MCP connection - in production, establish actual MCP connection
      await this.simulateConnection();
      
      this.connected = true;
      this.emit('connected', { timestamp: new Date().toISOString() });
      
      // Load available tools
      await this.loadAvailableTools();
      
      console.log('✅ Connected to Vercel MCP server');
      console.log(`📊 ${this.availableTools.length} tools available`);
      
    } catch (error) {
      this.connected = false;
      this.emit('error', { error: error.message });
      console.error('❌ Failed to connect to MCP server:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MCP server
   */
  public async disconnect(): Promise<void> {
    try {
      if (!this.connected) {
        console.log('ℹ️ Already disconnected from MCP server');
        return;
      }

      console.log('🔌 Disconnecting from Vercel MCP server...');
      
      // Simulate disconnection - in production, close actual MCP connection
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.connected = false;
      this.emit('disconnected', { timestamp: new Date().toISOString() });
      
      console.log('✅ Disconnected from Vercel MCP server');
      
    } catch (error) {
      console.error('❌ Error during disconnection:', error);
      throw error;
    }
  }

  /**
   * Check if connected to MCP server
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Execute MCP tool
   */
  public async executeTool(toolName: string, params: ToolParams = {}): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      if (!this.connected) {
        throw new Error('Not connected to MCP server. Call connect() first.');
      }

      console.log(`🔧 Executing tool: ${toolName}`, params);
      
      // Validate tool exists
      const tool = this.availableTools.find(t => t.name === toolName);
      if (!tool) {
        throw new Error(`Tool '${toolName}' not found. Available tools: ${this.availableTools.map(t => t.name).join(', ')}`);
      }

      // Simulate tool execution - in production, call actual MCP tool
      const result = await this.simulateToolExecution(toolName, params);
      
      const executionTime = Date.now() - startTime;
      this.updateMetrics('success', executionTime);
      
      const toolResult: ToolResult = {
        success: true,
        data: result,
        metadata: {
          executionTime,
          timestamp: new Date().toISOString()
        }
      };

      this.emit('tool_executed', { toolName, params, result: toolResult });
      console.log(`✅ Tool '${toolName}' executed successfully in ${executionTime}ms`);
      
      return toolResult;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateMetrics('failure', executionTime);
      
      const toolResult: ToolResult = {
        success: false,
        error: error.message,
        metadata: {
          executionTime,
          timestamp: new Date().toISOString()
        }
      };

      this.emit('error', { toolName, params, error: error.message });
      console.error(`❌ Tool '${toolName}' execution failed:`, error);
      
      return toolResult;
    }
  }

  /**
   * List available tools
   */
  public async listTools(): Promise<ToolDefinition[]> {
    if (!this.connected) {
      throw new Error('Not connected to MCP server. Call connect() first.');
    }
    
    return [...this.availableTools];
  }

  /**
   * Get server health status
   */
  public async getHealth(): Promise<HealthStatus> {
    const pingStart = Date.now();
    
    try {
      // Simulate health check - in production, ping actual MCP server
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const responseTime = Date.now() - pingStart;
      
      return {
        connected: this.connected,
        lastPing: new Date().toISOString(),
        responseTime,
        serverVersion: '1.0.0',
        toolsAvailable: this.availableTools.length
      };
      
    } catch (error) {
      return {
        connected: false,
        lastPing: new Date().toISOString(),
        responseTime: Date.now() - pingStart,
        toolsAvailable: 0
      };
    }
  }

  /**
   * Get client metrics
   */
  public async getMetrics(): Promise<MCPMetrics> {
    return {
      ...this.metrics,
      uptime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0
    };
  }

  /**
   * Add event listener
   */
  public on(event: MCPEvent, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event listener
   */
  public off(event: MCPEvent, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: MCPEvent, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): MCPMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      uptime: 0
    };
  }

  /**
   * Update metrics
   */
  private updateMetrics(result: 'success' | 'failure', responseTime: number): void {
    this.metrics.totalRequests++;
    
    if (result === 'success') {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
  }

  /**
   * Setup default event handlers
   */
  private setupEventHandlers(): void {
    this.on('error', (data) => {
      this.metrics.lastError = data?.error || 'Unknown error';
    });
  }

  /**
   * Simulate MCP connection (replace with actual MCP connection in production)
   */
  private async simulateConnection(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In production, establish actual MCP connection here
    console.log('🔗 MCP connection established (simulated)');
  }

  /**
   * Load available tools from MCP server
   */
  private async loadAvailableTools(): Promise<void> {
    // Simulate loading tools - in production, query actual MCP server
    this.availableTools = [
      {
        name: 'get-deployments',
        description: 'Get list of Vercel deployments',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Maximum number of deployments to return' },
            projectId: { type: 'string', description: 'Filter by project ID' }
          }
        }
      },
      {
        name: 'get-deployment-status',
        description: 'Get status of a specific deployment',
        parameters: {
          type: 'object',
          properties: {
            deploymentId: { type: 'string', description: 'Deployment ID to check' }
          },
          required: ['deploymentId']
        }
      },
      {
        name: 'create-deployment',
        description: 'Create a new Vercel deployment',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Deployment name' },
            target: { type: 'string', enum: ['production', 'staging'], description: 'Deployment target' }
          },
          required: ['name']
        }
      },
      {
        name: 'get-analytics',
        description: 'Get deployment analytics data',
        parameters: {
          type: 'object',
          properties: {
            deploymentId: { type: 'string', description: 'Deployment ID' },
            period: { type: 'string', enum: ['1h', '24h', '7d', '30d'], description: 'Time period' }
          }
        }
      },
      {
        name: 'get-performance-metrics',
        description: 'Get Core Web Vitals and performance metrics',
        parameters: {
          type: 'object',
          properties: {
            deploymentId: { type: 'string', description: 'Deployment ID' },
            metric: { type: 'string', enum: ['lcp', 'fid', 'cls', 'all'], description: 'Specific metric or all' }
          }
        }
      }
    ];
  }

  /**
   * Simulate tool execution (replace with actual MCP tool calls in production)
   */
  private async simulateToolExecution(toolName: string, params: ToolParams): Promise<any> {
    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Return mock data based on tool name
    switch (toolName) {
      case 'get-deployments':
        return {
          deployments: [
            {
              id: 'dpl_123',
              url: 'https://fisioflow-abc123.vercel.app',
              state: 'READY',
              created: Date.now() - 3600000,
              target: 'production'
            }
          ]
        };
        
      case 'get-deployment-status':
        return {
          id: params.deploymentId,
          state: 'READY',
          url: `https://fisioflow-${params.deploymentId}.vercel.app`,
          created: Date.now() - 1800000
        };
        
      case 'get-analytics':
        return {
          requests: 1250,
          bandwidth: 45600000,
          cacheHitRate: 0.85,
          averageResponseTime: 120
        };
        
      case 'get-performance-metrics':
        return {
          lcp: 1.2,
          fid: 45,
          cls: 0.05,
          score: 95
        };
        
      default:
        return { message: `Tool ${toolName} executed successfully`, params };
    }
  }
}

/**
 * Get MCP client instance
 */
export function getMCPClient(): VercelMCPClient {
  return VercelMCPClient.getInstance();
}