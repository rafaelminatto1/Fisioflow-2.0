import { supabase } from './supabase/supabaseClient';
import { Patient, SearchFilters } from '../types';

class SearchService {
  async searchPatients(
    filters: Partial<SearchFilters>,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ patients: Patient[]; totalCount: number; facets: any }> {
    let query = supabase.from('patients').select('*', { count: 'exact' });

    if (filters.text) {
      query = query.or(`name.ilike.%${filters.text}%,cpf.ilike.%${filters.text}%`);
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters.therapistIds && filters.therapistIds.length > 0) {
      query = query.in('therapistId', filters.therapistIds);
    }

    const { data, error, count } = await query
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      throw new Error(`Erro na busca de pacientes: ${error.message}`);
    }

    // Facets would be calculated here in a real application

    return { patients: data || [], totalCount: count || 0, facets: {} };
  }
}

export const searchService = new SearchService();