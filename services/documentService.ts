
import { supabase } from './supabase/supabaseClient';
import { PatientDocument } from '../types';

class DocumentService {
  async getDocumentsByPatient(patientId: string): Promise<PatientDocument[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('patient_id', patientId);

    if (error) {
      throw new Error(`Erro ao buscar documentos: ${error.message}`);
    }

    return data || [];
  }

  async updateDocumentCategory(documentId: string, categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({ category_id: categoryId })
      .eq('id', documentId);

    if (error) {
      throw new Error(`Erro ao atualizar categoria do documento: ${error.message}`);
    }
  }

  async searchDocuments(patientId: string, searchTerm: string): Promise<PatientDocument[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('patient_id', patientId)
      .ilike('extracted_text', `%${searchTerm}%`);

    if (error) {
      throw new Error(`Erro ao buscar documentos: ${error.message}`);
    }

    return data || [];
  }
}

export const documentService = new DocumentService();
