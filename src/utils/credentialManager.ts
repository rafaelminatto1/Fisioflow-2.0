/**
 * Secure Credential Management for MCP Vercel Integration
 * Handles encryption, storage, and rotation of sensitive credentials
 */

import type { VercelCredentials } from '@/config/mcp';

export interface AuditEntry {
  timestamp: string;
  operation: string;
  result: 'success' | 'failure';
  userId?: string;
  details?: string;
}

export interface CredentialValidationResult {
  isValid: boolean;
  expiresAt?: string;
  error?: string;
}

/**
 * Secure credential manager for Vercel MCP integration
 */
export class SecureCredentialManager {
  private static instance: SecureCredentialManager;
  private auditLog: AuditEntry[] = [];
  private encryptionKey: string;

  private constructor() {
    // Generate or retrieve encryption key
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  public static getInstance(): SecureCredentialManager {
    if (!SecureCredentialManager.instance) {
      SecureCredentialManager.instance = new SecureCredentialManager();
    }
    return SecureCredentialManager.instance;
  }

  /**
   * Encrypt sensitive token data
   */
  public encryptToken(token: string): string {
    try {
      // Simple base64 encoding for demo - in production use proper encryption
      const encrypted = btoa(token + ':' + Date.now());
      this.logAccess('encrypt_token', 'success');
      return encrypted;
    } catch (error) {
      this.logAccess('encrypt_token', 'failure', `Error: ${error}`);
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Decrypt token data
   */
  public decryptToken(encryptedToken: string): string {
    try {
      // Simple base64 decoding for demo - in production use proper decryption
      const decoded = atob(encryptedToken);
      const [token] = decoded.split(':');
      this.logAccess('decrypt_token', 'success');
      return token;
    } catch (error) {
      this.logAccess('decrypt_token', 'failure', `Error: ${error}`);
      throw new Error('Failed to decrypt token');
    }
  }

  /**
   * Store credentials securely
   */
  public async storeCredentials(credentials: VercelCredentials): Promise<void> {
    try {
      const encryptedCredentials = {
        ...credentials,
        token: this.encryptToken(credentials.token)
      };

      // Store in localStorage for demo - in production use secure storage
      localStorage.setItem('vercel_credentials', JSON.stringify(encryptedCredentials));
      this.logAccess('store_credentials', 'success');
    } catch (error) {
      this.logAccess('store_credentials', 'failure', `Error: ${error}`);
      throw new Error('Failed to store credentials');
    }
  }

  /**
   * Retrieve stored credentials
   */
  public async retrieveCredentials(): Promise<VercelCredentials | null> {
    try {
      const stored = localStorage.getItem('vercel_credentials');
      if (!stored) {
        this.logAccess('retrieve_credentials', 'failure', 'No credentials found');
        return null;
      }

      const encryptedCredentials = JSON.parse(stored);
      const credentials: VercelCredentials = {
        ...encryptedCredentials,
        token: this.decryptToken(encryptedCredentials.token)
      };

      this.logAccess('retrieve_credentials', 'success');
      return credentials;
    } catch (error) {
      this.logAccess('retrieve_credentials', 'failure', `Error: ${error}`);
      return null;
    }
  }

  /**
   * Validate token expiry and format
   */
  public async validateToken(token: string): Promise<CredentialValidationResult> {
    try {
      // Basic token validation - in production, validate with Vercel API
      if (!token || token.length < 10) {
        return {
          isValid: false,
          error: 'Invalid token format'
        };
      }

      // Mock validation - in production, make API call to Vercel
      const isValid = token.startsWith('vercel_') || token.length > 20;
      
      this.logAccess('validate_token', isValid ? 'success' : 'failure');
      
      return {
        isValid,
        expiresAt: isValid ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        error: isValid ? undefined : 'Token validation failed'
      };
    } catch (error) {
      this.logAccess('validate_token', 'failure', `Error: ${error}`);
      return {
        isValid: false,
        error: `Validation error: ${error}`
      };
    }
  }

  /**
   * Rotate token (placeholder for production implementation)
   */
  public async rotateToken(): Promise<string> {
    try {
      // In production, this would call Vercel API to generate new token
      const newToken = `vercel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const credentials = await this.retrieveCredentials();
      if (credentials) {
        credentials.token = newToken;
        await this.storeCredentials(credentials);
      }

      this.logAccess('rotate_token', 'success');
      return newToken;
    } catch (error) {
      this.logAccess('rotate_token', 'failure', `Error: ${error}`);
      throw new Error('Failed to rotate token');
    }
  }

  /**
   * Check if token needs rotation
   */
  public async validateTokenExpiry(): Promise<boolean> {
    try {
      const credentials = await this.retrieveCredentials();
      if (!credentials) return false;

      const validation = await this.validateToken(credentials.token);
      return validation.isValid;
    } catch (error) {
      this.logAccess('validate_token_expiry', 'failure', `Error: ${error}`);
      return false;
    }
  }

  /**
   * Log credential access for audit purposes
   */
  private logAccess(operation: string, result: 'success' | 'failure', details?: string): void {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      operation,
      result,
      details
    };

    this.auditLog.push(entry);

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // In production, send to secure logging service
    console.log(`[Credential Audit] ${operation}: ${result}`, details || '');
  }

  /**
   * Get audit log entries
   */
  public async getCredentialAuditLog(): Promise<AuditEntry[]> {
    return [...this.auditLog];
  }

  /**
   * Clear stored credentials
   */
  public async clearCredentials(): Promise<void> {
    try {
      localStorage.removeItem('vercel_credentials');
      this.logAccess('clear_credentials', 'success');
    } catch (error) {
      this.logAccess('clear_credentials', 'failure', `Error: ${error}`);
      throw new Error('Failed to clear credentials');
    }
  }

  /**
   * Get or create encryption key
   */
  private getOrCreateEncryptionKey(): string {
    let key = localStorage.getItem('mcp_encryption_key');
    if (!key) {
      // Generate a simple key for demo - in production use proper key management
      key = btoa(Math.random().toString(36).substr(2, 32));
      localStorage.setItem('mcp_encryption_key', key);
    }
    return key;
  }
}

/**
 * Convenience function to get credential manager instance
 */
export function getCredentialManager(): SecureCredentialManager {
  return SecureCredentialManager.getInstance();
}

/**
 * Initialize credentials from environment variables
 */
export async function initializeCredentialsFromEnv(): Promise<void> {
  const manager = getCredentialManager();
  
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  
  if (token && projectId) {
    const credentials: VercelCredentials = {
      token,
      projectId,
      teamId: process.env.VERCEL_TEAM_ID,
      environment: (process.env.NODE_ENV as any) || 'development'
    };
    
    await manager.storeCredentials(credentials);
    console.log('✅ Vercel credentials initialized from environment variables');
  } else {
    console.warn('⚠️ Vercel credentials not found in environment variables');
  }
}