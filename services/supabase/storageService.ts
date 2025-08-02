import { supabase } from './supabaseClient';

// Generic storage types since they're not exported from main package
interface StorageError {
  message: string;
  statusCode?: string;
}

interface FileObject {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  last_accessed_at?: string;
  metadata?: Record<string, any>;
}

export interface UploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

export interface StorageServiceResponse<T = any> {
  data: T | null;
  error: StorageError | Error | null;
  success: boolean;
}

export class StorageService {
  /**
   * Upload file to storage bucket
   */
  static async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<StorageServiceResponse<{ path: string; fullPath: string }>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: options.cacheControl || '3600',
          upsert: options.upsert || false,
          ...(options.contentType && { contentType: options.contentType })
        });

      if (error) {
        return { data: null, error, success: false };
      }

      return { 
        data: { 
          path: data.path, 
          fullPath: data.fullPath 
        }, 
        error: null, 
        success: true 
      };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown upload error'), 
        success: false 
      };
    }
  }

  /**
   * Download file from storage bucket
   */
  static async downloadFile(
    bucket: string,
    path: string
  ): Promise<StorageServiceResponse<Blob>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        return { data: null, error, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown download error'), 
        success: false 
      };
    }
  }

  /**
   * Get public URL for file
   */
  static getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Create signed URL for private file access
   */
  static async createSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<StorageServiceResponse<{ signedUrl: string }>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        return { data: null, error, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown signed URL error'), 
        success: false 
      };
    }
  }

  /**
   * Delete file from storage bucket
   */
  static async deleteFile(
    bucket: string,
    paths: string | string[]
  ): Promise<StorageServiceResponse<FileObject[]>> {
    try {
      const pathsArray = Array.isArray(paths) ? paths : [paths];
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove(pathsArray);

      if (error) {
        return { data: null, error, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown delete error'), 
        success: false 
      };
    }
  }

  /**
   * List files in storage bucket
   */
  static async listFiles(
    bucket: string,
    path: string = '',
    options: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    } = {}
  ): Promise<StorageServiceResponse<FileObject[]>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path, {
          ...(options.limit !== undefined && { limit: options.limit }),
          ...(options.offset !== undefined && { offset: options.offset }),
          ...(options.sortBy && { sortBy: options.sortBy })
        });

      if (error) {
        return { data: null, error, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown list files error'), 
        success: false 
      };
    }
  }

  /**
   * Move file within storage bucket
   */
  static async moveFile(
    bucket: string,
    fromPath: string,
    toPath: string
  ): Promise<StorageServiceResponse<{ message: string }>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .move(fromPath, toPath);

      if (error) {
        return { data: null, error, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown move file error'), 
        success: false 
      };
    }
  }

  /**
   * Copy file within storage bucket
   */
  static async copyFile(
    bucket: string,
    fromPath: string,
    toPath: string
  ): Promise<StorageServiceResponse<{ path: string }>> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .copy(fromPath, toPath);

      if (error) {
        return { data: null, error, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown copy file error'), 
        success: false 
      };
    }
  }

  /**
   * Create storage bucket
   */
  static async createBucket(
    bucketName: string,
    options: {
      public?: boolean;
      allowedMimeTypes?: string[];
      fileSizeLimit?: number;
    } = {}
  ): Promise<StorageServiceResponse<{ name: string }>> {
    try {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: options.public || false,
        ...(options.allowedMimeTypes && { allowedMimeTypes: options.allowedMimeTypes }),
        ...(options.fileSizeLimit !== undefined && { fileSizeLimit: options.fileSizeLimit })
      });

      if (error) {
        return { data: null, error, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown create bucket error'), 
        success: false 
      };
    }
  }

  /**
   * Delete storage bucket
   */
  static async deleteBucket(bucketName: string): Promise<StorageServiceResponse<{ message: string }>> {
    try {
      const { data, error } = await supabase.storage.deleteBucket(bucketName);

      if (error) {
        return { data: null, error, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown delete bucket error'), 
        success: false 
      };
    }
  }

  /**
   * Get bucket details
   */
  static async getBucket(bucketName: string): Promise<StorageServiceResponse<any>> {
    try {
      const { data, error } = await supabase.storage.getBucket(bucketName);

      if (error) {
        return { data: null, error, success: false };
      }

      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown get bucket error'), 
        success: false 
      };
    }
  }
}

export default StorageService;