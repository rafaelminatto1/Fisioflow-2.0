import { supabase } from './supabaseClient';
import { PostgrestFilterBuilder, PostgrestQueryBuilder } from '@supabase/postgrest-js';

export interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
  range?: { from: number; to: number };
}

export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface DatabaseListResponse<T> {
  data: T[];
  error: string | null;
  count?: number;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Generic select operation with advanced query options
   */
  async select<T>(
    table: string,
    options: QueryOptions = {}
  ): Promise<DatabaseListResponse<T>> {
    try {
      let query = supabase.from(table).select(options.select || '*', {
        count: 'exact'
      });

      // Apply filters
      if (options.filters) {
        query = this.applyFilters(query, options.filters) as any;
      }

      // Apply ordering
      if (options.orderBy) {
        options.orderBy.forEach(order => {
          query = query.order(order.column, { ascending: order.ascending ?? true });
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      } else if (options.range) {
        query = query.range(options.range.from, options.range.to);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Database select error: ${error.message}`);
      }

      return {
        data: (data || []) as T[],
        error: null,
        count: count || 0
      };
    } catch (error) {
      return {
        data: [],
        error: this.formatError(error),
        count: 0
      };
    }
  }

  /**
   * Get a single record by ID
   */
  async selectById<T>(table: string, id: string, select?: string): Promise<DatabaseResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(table)
        .select(select || '*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Database selectById error: ${error.message}`);
      }

      return {
        data: (data || null) as T | null,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Insert a new record
   */
  async insert<T>(table: string, data: Partial<T>): Promise<DatabaseResponse<T>> {
    try {
      const { data: insertedData, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        throw new Error(`Database insert error: ${error.message}`);
      }

      return {
        data: insertedData || null,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Insert multiple records
   */
  async insertMany<T>(table: string, data: Partial<T>[]): Promise<DatabaseListResponse<T>> {
    try {
      const { data: insertedData, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      if (error) {
        throw new Error(`Database insertMany error: ${error.message}`);
      }

      return {
        data: insertedData || [],
        error: null
      };
    } catch (error) {
      return {
        data: [],
        error: this.formatError(error)
      };
    }
  }

  /**
   * Update a record by ID
   */
  async update<T>(table: string, id: string, data: Partial<T>): Promise<DatabaseResponse<T>> {
    try {
      const { data: updatedData, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Database update error: ${error.message}`);
      }

      return {
        data: updatedData || null,
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Update multiple records with filters
   */
  async updateMany<T>(
    table: string,
    filters: Record<string, any>,
    data: Partial<T>
  ): Promise<DatabaseListResponse<T>> {
    try {
      let query = supabase.from(table).update(data);
      query = this.applyFilters(query, filters) as any;

      const { data: updatedData, error } = await query.select();

      if (error) {
        throw new Error(`Database updateMany error: ${error.message}`);
      }

      return {
        data: updatedData || [],
        error: null
      };
    } catch (error) {
      return {
        data: [],
        error: this.formatError(error)
      };
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(table: string, id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Database delete error: ${error.message}`);
      }

      return {
        data: true,
        error: null
      };
    } catch (error) {
      return {
        data: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Delete multiple records with filters
   */
  async deleteMany(table: string, filters: Record<string, any>): Promise<DatabaseResponse<boolean>> {
    try {
      let query = supabase.from(table).delete();
      query = this.applyFilters(query, filters) as any;

      const { error } = await query;

      if (error) {
        throw new Error(`Database deleteMany error: ${error.message}`);
      }

      return {
        data: true,
        error: null
      };
    } catch (error) {
      return {
        data: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Execute a custom query with raw SQL
   */
  async executeRaw<T>(query: string, params?: any[]): Promise<DatabaseListResponse<T>> {
    try {
      const { data, error } = await supabase.rpc('execute_sql', { query, params });

      if (error) {
        throw new Error(`Database executeRaw error: ${error.message}`);
      }

      return {
        data: data || [],
        error: null
      };
    } catch (error) {
      return {
        data: [],
        error: this.formatError(error)
      };
    }
  }

  /**
   * Count records in a table with optional filters
   */
  async count(table: string, filters?: Record<string, any>): Promise<DatabaseResponse<number>> {
    try {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });

      if (filters) {
        query = this.applyFilters(query, filters) as any;
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Database count error: ${error.message}`);
      }

      return {
        data: count || 0,
        error: null
      };
    } catch (error) {
      return {
        data: 0,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Check if a record exists
   */
  async exists(table: string, filters: Record<string, any>): Promise<DatabaseResponse<boolean>> {
    try {
      let query = supabase.from(table).select('id', { count: 'exact', head: true });
      query = this.applyFilters(query, filters) as any;

      const { count, error } = await query;

      if (error) {
        throw new Error(`Database exists error: ${error.message}`);
      }

      return {
        data: (count || 0) > 0,
        error: null
      };
    } catch (error) {
      return {
        data: false,
        error: this.formatError(error)
      };
    }
  }

  /**
   * Apply filters to a query
   */
  private applyFilters<T extends Record<string, any>>(
    query: PostgrestFilterBuilder<any, T, unknown>,
    filters: Record<string, any>
  ): PostgrestFilterBuilder<any, T, unknown> {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === null) {
        query = query.is(key, null);
      } else if (value === undefined) {
        // Skip undefined values
        return;
      } else if (typeof value === 'object' && value.operator) {
        // Handle complex filters like { operator: 'gte', value: 10 }
        switch (value.operator) {
          case 'eq':
            query = query.eq(key, value.value);
            break;
          case 'neq':
            query = query.neq(key, value.value);
            break;
          case 'gt':
            query = query.gt(key, value.value);
            break;
          case 'gte':
            query = query.gte(key, value.value);
            break;
          case 'lt':
            query = query.lt(key, value.value);
            break;
          case 'lte':
            query = query.lte(key, value.value);
            break;
          case 'like':
            query = query.like(key, value.value);
            break;
          case 'ilike':
            query = query.ilike(key, value.value);
            break;
          case 'in':
            query = query.in(key, value.value);
            break;
          case 'contains':
            query = query.contains(key, value.value);
            break;
          case 'containedBy':
            query = query.containedBy(key, value.value);
            break;
          default:
            query = query.eq(key, value.value);
        }
      } else if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    });

    return query;
  }

  /**
   * Execute a query with retry logic
   */
  private async executeWithRetry<T>(queryFn: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain types of errors
        if (this.shouldNotRetry(error)) {
          throw error;
        }

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Check if an error should not be retried
   */
  private shouldNotRetry(error: any): boolean {
    // Don't retry on authentication errors, permission errors, or validation errors
    const nonRetryableErrors = [
      'PGRST301', // Row not found
      'PGRST116', // Invalid JWT
      '42501',    // Insufficient privilege
      '23505',    // Unique violation
      '23503',    // Foreign key violation
      '23502',    // Not null violation
      '23514',    // Check violation
    ];

    return nonRetryableErrors.some(code => 
      error?.code === code || error?.message?.includes(code)
    );
  }

  /**
   * Delay execution for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format error messages for consistent error handling
   */
  private formatError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.error_description) {
      return error.error_description;
    }

    return 'An unexpected database error occurred';
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
export default databaseService;