/**
 * Credential Manager Utility
 * Handles secure credential management for MCP and other services
 */

import type { VercelCredentials } from '@/config/mcp';

export interface CredentialStore {
  vercel?: VercelCredentials;
  gemini?: {
    apiKey: string;
  };
  supabase?: {
    url: string;
    anonKey: string;
  };
}

export interface CredentialManagerOptions {
  useEnvironmentVariables?: boolean;
  fallbackToDefaults?: boolean;
}

export class CredentialManager {
  private credentials: CredentialStore = {};
  private options: CredentialManagerOptions;

  constructor(options: CredentialManagerOptions = {}) {
    this.options = {
      useEnvironmentVariables: true,
      fallbackToDefaults: false,
      ...options,
    };
    this.loadCredentials();
  }

  private loadCredentials(): void {
    if (this.options.useEnvironmentVariables) {
      this.loadFromEnvironment();
    }
  }

  private loadFromEnvironment(): void {
    // Load Vercel credentials
    const vercelToken = this.getEnvVar('VERCEL_TOKEN');
    const vercelProjectId = this.getEnvVar('VERCEL_PROJECT_ID');
    const vercelTeamId = this.getEnvVar('VERCEL_TEAM_ID');

    if (vercelToken && vercelProjectId) {
      this.credentials.vercel = {
        apiKey: vercelToken,
        projectId: vercelProjectId,
        teamId: vercelTeamId,
      };
    }

    // Load Gemini credentials
    const geminiApiKey = this.getEnvVar('GEMINI_API_KEY');
    if (geminiApiKey) {
      this.credentials.gemini = {
        apiKey: geminiApiKey,
      };
    }

    // Load Supabase credentials
    const supabaseUrl = this.getEnvVar('VITE_SUPABASE_URL');
    const supabaseAnonKey = this.getEnvVar('VITE_SUPABASE_ANON_KEY');
    if (supabaseUrl && supabaseAnonKey) {
      this.credentials.supabase = {
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
      };
    }
  }

  private getEnvVar(key: string): string | undefined {
    // Check both process.env and import.meta.env for Vite compatibility
    return process.env[key] || (import.meta.env && import.meta.env[key]);
  }

  public getVercelCredentials(): VercelCredentials | null {
    return this.credentials.vercel || null;
  }

  public getGeminiApiKey(): string | null {
    return this.credentials.gemini?.apiKey || null;
  }

  public getSupabaseCredentials(): { url: string; anonKey: string } | null {
    return this.credentials.supabase || null;
  }

  public setVercelCredentials(credentials: VercelCredentials): void {
    this.credentials.vercel = credentials;
  }

  public setGeminiApiKey(apiKey: string): void {
    this.credentials.gemini = { apiKey };
  }

  public setSupabaseCredentials(url: string, anonKey: string): void {
    this.credentials.supabase = { url, anonKey };
  }

  public hasVercelCredentials(): boolean {
    return !!(this.credentials.vercel?.apiKey && this.credentials.vercel?.projectId);
  }

  public hasGeminiCredentials(): boolean {
    return !!this.credentials.gemini?.apiKey;
  }

  public hasSupabaseCredentials(): boolean {
    return !!(this.credentials.supabase?.url && this.credentials.supabase?.anonKey);
  }

  public clearCredentials(): void {
    this.credentials = {};
  }

  public clearVercelCredentials(): void {
    delete this.credentials.vercel;
  }

  public clearGeminiCredentials(): void {
    delete this.credentials.gemini;
  }

  public clearSupabaseCredentials(): void {
    delete this.credentials.supabase;
  }
}

// Singleton instance
let credentialManagerInstance: CredentialManager | null = null;

export function getCredentialManager(options?: CredentialManagerOptions): CredentialManager {
  if (!credentialManagerInstance) {
    credentialManagerInstance = new CredentialManager(options);
  }
  return credentialManagerInstance;
}

export function resetCredentialManager(): void {
  credentialManagerInstance = null;
}

// Utility functions for common credential operations
export function getVercelCredentials(): VercelCredentials | null {
  return getCredentialManager().getVercelCredentials();
}

export function getGeminiApiKey(): string | null {
  return getCredentialManager().getGeminiApiKey();
}

export function getSupabaseCredentials(): { url: string; anonKey: string } | null {
  return getCredentialManager().getSupabaseCredentials();
}