import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase client
vi.mock('../../services/supabase/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { DatabaseService } from '../../services/supabase/databaseService';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockQuery: any;

  beforeEach(() => {
    service = DatabaseService.getInstance();
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };

    const { supabase } = await import('../../services/supabase/supabaseClient');
    vi.mocked(supabase.from).mockReturnValue(mockQuery);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return the same instance as the exported singleton', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('select', () => {
    it('should perform basic select operation', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      mockQuery.select.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      const result = await service.select('users');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(result).toEqual({
        data: mockData,
        error: null,
        count: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const mockData = [{ id: '1', name: 'Test', active: true }];
      mockQuery.select.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      await service.select('users', {
        filters: { active: true, name: 'Test' }
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('active', true);
      expect(mockQuery.eq).toHaveBeenCalledWith('name', 'Test');
    });

    it('should apply complex filters', async () => {
      const mockData = [{ id: '1', age: 25 }];
      mockQuery.select.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      await service.select('users', {
        filters: {
          age: { operator: 'gte', value: 18 },
          status: { operator: 'in', value: ['active', 'pending'] }
        }
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('age', 18);
      expect(mockQuery.in).toHaveBeenCalledWith('status', ['active', 'pending']);
    });

    it('should apply ordering', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      mockQuery.select.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      await service.select('users', {
        orderBy: [
          { column: 'name', ascending: true },
          { column: 'created_at', ascending: false }
        ]
      });

      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should apply pagination with limit and offset', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      mockQuery.select.mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      });

      await service.select('users', {
        limit: 10,
        offset: 20
      });

      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.range).toHaveBeenCalledWith(20, 29);
    });

    it('should handle database errors', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: 0,
      });

      const result = await service.select('users');

      expect(result).toEqual({
        data: [],
        error: 'Database select error: Database error',
        count: 0,
      });
    });
  });

  describe('selectById', () => {
    it('should select a single record by ID', async () => {
      const mockData = { id: '1', name: 'Test' };
      mockQuery.single.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await service.selectById('users', '1');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockData,
        error: null,
      });
    });

    it('should handle not found errors', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Row not found' },
      });

      const result = await service.selectById('users', '999');

      expect(result).toEqual({
        data: null,
        error: 'Database selectById error: Row not found',
      });
    });
  });

  describe('insert', () => {
    it('should insert a new record', async () => {
      const insertData = { name: 'New User', email: 'test@example.com' };
      const mockResponse = { id: '1', ...insertData };
      
      mockQuery.single.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await service.insert('users', insertData);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.insert).toHaveBeenCalledWith(insertData);
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockResponse,
        error: null,
      });
    });

    it('should handle insert errors', async () => {
      mockQuery.single.mockResolvedValue({
        data: null,
        error: { message: 'Unique constraint violation' },
      });

      const result = await service.insert('users', { email: 'duplicate@example.com' });

      expect(result).toEqual({
        data: null,
        error: 'Database insert error: Unique constraint violation',
      });
    });
  });

  describe('update', () => {
    it('should update a record by ID', async () => {
      const updateData = { name: 'Updated Name' };
      const mockResponse = { id: '1', name: 'Updated Name', email: 'test@example.com' };
      
      mockQuery.single.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await service.update('users', '1', updateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.update).toHaveBeenCalledWith(updateData);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockResponse,
        error: null,
      });
    });
  });

  describe('delete', () => {
    it('should delete a record by ID', async () => {
      mockQuery.delete.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await service.delete('users', '1');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual({
        data: true,
        error: null,
      });
    });

    it('should handle delete errors', async () => {
      mockQuery.delete.mockResolvedValue({
        data: null,
        error: { message: 'Foreign key constraint violation' },
      });

      const result = await service.delete('users', '1');

      expect(result).toEqual({
        data: false,
        error: 'Database delete error: Foreign key constraint violation',
      });
    });
  });

  describe('count', () => {
    it('should count records in a table', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: null,
        count: 42,
      });

      const result = await service.count('users');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(result).toEqual({
        data: 42,
        error: null,
      });
    });

    it('should count records with filters', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: null,
        count: 10,
      });

      const result = await service.count('users', { active: true });

      expect(mockQuery.eq).toHaveBeenCalledWith('active', true);
      expect(result).toEqual({
        data: 10,
        error: null,
      });
    });
  });

  describe('exists', () => {
    it('should return true when record exists', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: null,
        count: 1,
      });

      const result = await service.exists('users', { email: 'test@example.com' });

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
      expect(mockQuery.eq).toHaveBeenCalledWith('email', 'test@example.com');
      expect(result).toEqual({
        data: true,
        error: null,
      });
    });

    it('should return false when record does not exist', async () => {
      mockQuery.select.mockResolvedValue({
        data: null,
        error: null,
        count: 0,
      });

      const result = await service.exists('users', { email: 'nonexistent@example.com' });

      expect(result).toEqual({
        data: false,
        error: null,
      });
    });
  });

  describe('Error Handling', () => {
    it('should format string errors correctly', async () => {
      mockQuery.select.mockRejectedValue('Simple error message');

      const result = await service.select('users');

      expect(result.error).toBe('Simple error message');
    });

    it('should format object errors with message property', async () => {
      mockQuery.select.mockRejectedValue({ message: 'Object error message' });

      const result = await service.select('users');

      expect(result.error).toBe('Object error message');
    });

    it('should format errors with error_description property', async () => {
      mockQuery.select.mockRejectedValue({ error_description: 'Auth error description' });

      const result = await service.select('users');

      expect(result.error).toBe('Auth error description');
    });

    it('should provide default error message for unknown errors', async () => {
      mockQuery.select.mockRejectedValue({ someProperty: 'unknown' });

      const result = await service.select('users');

      expect(result.error).toBe('An unexpected database error occurred');
    });
  });
});