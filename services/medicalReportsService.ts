export interface MedicalReport {
  id: string;
  patientId: string;
  type: 'atestado' | 'laudo' | 'relatorio' | 'declaracao' | 'encaminhamento';
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  issuedDate: string;
  status: 'draft' | 'issued' | 'sent';
  recipient?: string;
  attachments?: Array<{ name: string; url: string; type: string }>;
  templateUsed?: string;
  digitalSignature?: {
    signed: boolean;
    signedBy: string;
    signedAt: string;
    certificate: string;
  };
}

export interface ReportTemplate {
  id: string;
  type: string;
  name: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

class MedicalReportsService {
  private reports: MedicalReport[] = [];
  private templates: ReportTemplate[] = [
    {
      id: 'atestado-atividade',
      type: 'atestado',
      name: 'Atestado para Atividade Física',
      content: `ATESTADO MÉDICO

Eu, {{TERAPEUTA}}, fisioterapeuta, CREFITO {{CREFITO}}, atesto para os devidos fins que o(a) paciente {{PACIENTE}}, portador(a) do CPF {{CPF}}, encontra-se apto(a) para a prática de atividades físicas.

Diagnóstico: {{DIAGNOSTICO}}

Recomendações: {{RECOMENDACOES}}

Período de validade: {{PERIODO_VALIDADE}}

Por ser verdade, firmo o presente atestado.

{{CIDADE}}, {{DATA}}

________________________________
{{TERAPEUTA}}
CREFITO {{CREFITO}}`,
      variables: ['TERAPEUTA', 'CREFITO', 'PACIENTE', 'CPF', 'DIAGNOSTICO', 'RECOMENDACOES', 'PERIODO_VALIDADE', 'CIDADE', 'DATA'],
      isActive: true
    },
    {
      id: 'laudo-fisioterapeutico',
      type: 'laudo',
      name: 'Laudo Fisioterapêutico Completo',
      content: `LAUDO FISIOTERAPÊUTICO

IDENTIFICAÇÃO DO PACIENTE:
Nome: {{PACIENTE}}
CPF: {{CPF}}
Data de Nascimento: {{DATA_NASCIMENTO}}
Endereço: {{ENDERECO}}

ANAMNESE:
{{ANAMNESE}}

EXAME FÍSICO:
Inspeção: {{INSPECAO}}
Palpação: {{PALPACAO}}
Testes especiais: {{TESTES_ESPECIAIS}}
Amplitude de movimento: {{ADM}}
Força muscular: {{FORCA_MUSCULAR}}

DIAGNÓSTICO FISIOTERAPÊUTICO:
{{DIAGNOSTICO}}

OBJETIVOS DO TRATAMENTO:
Curto prazo: {{OBJETIVOS_CURTO}}
Longo prazo: {{OBJETIVOS_LONGO}}

PLANO DE TRATAMENTO:
{{PLANO_TRATAMENTO}}

PROGNÓSTICO:
{{PROGNOSTICO}}

RECOMENDAÇÕES:
{{RECOMENDACOES}}

{{CIDADE}}, {{DATA}}

________________________________
{{TERAPEUTA}}
Fisioterapeuta - CREFITO {{CREFITO}}`,
      variables: ['PACIENTE', 'CPF', 'DATA_NASCIMENTO', 'ENDERECO', 'ANAMNESE', 'INSPECAO', 'PALPACAO', 'TESTES_ESPECIAIS', 'ADM', 'FORCA_MUSCULAR', 'DIAGNOSTICO', 'OBJETIVOS_CURTO', 'OBJETIVOS_LONGO', 'PLANO_TRATAMENTO', 'PROGNOSTICO', 'RECOMENDACOES', 'CIDADE', 'DATA', 'TERAPEUTA', 'CREFITO'],
      isActive: true
    },
    {
      id: 'relatorio-evolucao',
      type: 'relatorio',
      name: 'Relatório de Evolução',
      content: `RELATÓRIO DE EVOLUÇÃO FISIOTERAPÊUTICA

DADOS DO PACIENTE:
Nome: {{PACIENTE}}
CPF: {{CPF}}
Diagnóstico: {{DIAGNOSTICO}}

PERÍODO AVALIADO:
De {{DATA_INICIO}} a {{DATA_FIM}}

EVOLUÇÃO CLÍNICA:
{{EVOLUCAO_CLINICA}}

OBJETIVOS ALCANÇADOS:
{{OBJETIVOS_ALCANCADOS}}

CONDUTAS REALIZADAS:
{{CONDUTAS_REALIZADAS}}

EVOLUÇÃO FUNCIONAL:
{{EVOLUCAO_FUNCIONAL}}

INTERCORRÊNCIAS:
{{INTERCORRENCIAS}}

RECOMENDAÇÕES:
{{RECOMENDACOES}}

PRÓXIMOS PASSOS:
{{PROXIMOS_PASSOS}}

{{CIDADE}}, {{DATA}}

________________________________
{{TERAPEUTA}}
Fisioterapeuta - CREFITO {{CREFITO}}`,
      variables: ['PACIENTE', 'CPF', 'DIAGNOSTICO', 'DATA_INICIO', 'DATA_FIM', 'EVOLUCAO_CLINICA', 'OBJETIVOS_ALCANCADOS', 'CONDUTAS_REALIZADAS', 'EVOLUCAO_FUNCIONAL', 'INTERCORRENCIAS', 'RECOMENDACOES', 'PROXIMOS_PASSOS', 'CIDADE', 'DATA', 'TERAPEUTA', 'CREFITO'],
      isActive: true
    },
    {
      id: 'encaminhamento-medico',
      type: 'encaminhamento',
      name: 'Encaminhamento Médico',
      content: `ENCAMINHAMENTO MÉDICO

DADOS DO PACIENTE:
Nome: {{PACIENTE}}
CPF: {{CPF}}
Data de Nascimento: {{DATA_NASCIMENTO}}

DIAGNÓSTICO FISIOTERAPÊUTICO:
{{DIAGNOSTICO}}

HISTÓRICO CLÍNICO:
{{HISTORICO_CLINICO}}

EVOLUÇÃO DO TRATAMENTO:
{{EVOLUCAO_TRATAMENTO}}

MOTIVO DO ENCAMINHAMENTO:
{{MOTIVO_ENCAMINHAMENTO}}

EXAMES COMPLEMENTARES SUGERIDOS:
{{EXAMES_SUGERIDOS}}

ESPECIALIDADE INDICADA:
{{ESPECIALIDADE_INDICADA}}

OBSERVAÇÕES:
{{OBSERVACOES}}

Coloco-me à disposição para esclarecimentos adicionais.

{{CIDADE}}, {{DATA}}

________________________________
{{TERAPEUTA}}
Fisioterapeuta - CREFITO {{CREFITO}}

Para: {{DESTINATARIO}}
{{ENDERECO_DESTINATARIO}}`,
      variables: ['PACIENTE', 'CPF', 'DATA_NASCIMENTO', 'DIAGNOSTICO', 'HISTORICO_CLINICO', 'EVOLUCAO_TRATAMENTO', 'MOTIVO_ENCAMINHAMENTO', 'EXAMES_SUGERIDOS', 'ESPECIALIDADE_INDICADA', 'OBSERVACOES', 'CIDADE', 'DATA', 'TERAPEUTA', 'CREFITO', 'DESTINATARIO', 'ENDERECO_DESTINATARIO'],
      isActive: true
    }
  ];

  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Reports CRUD
  async getReportsByPatientId(patientId: string): Promise<MedicalReport[]> {
    await this.delay(300);
    return this.reports
      .filter(report => report.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getReportById(reportId: string): Promise<MedicalReport | null> {
    await this.delay(200);
    return this.reports.find(report => report.id === reportId) || null;
  }

  async createReport(reportData: Omit<MedicalReport, 'id' | 'createdAt'>): Promise<MedicalReport> {
    await this.delay(400);
    
    const newReport: MedicalReport = {
      id: `report_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...reportData
    };

    this.reports.push(newReport);
    return newReport;
  }

  async updateReport(reportId: string, updates: Partial<MedicalReport>): Promise<MedicalReport> {
    await this.delay(300);
    
    const reportIndex = this.reports.findIndex(report => report.id === reportId);
    if (reportIndex === -1) {
      throw new Error('Relatório não encontrado');
    }

    this.reports[reportIndex] = { ...this.reports[reportIndex], ...updates };
    return this.reports[reportIndex];
  }

  async deleteReport(reportId: string): Promise<void> {
    await this.delay(200);
    
    const reportIndex = this.reports.findIndex(report => report.id === reportId);
    if (reportIndex === -1) {
      throw new Error('Relatório não encontrado');
    }

    this.reports.splice(reportIndex, 1);
  }

  // Templates
  async getTemplates(): Promise<ReportTemplate[]> {
    await this.delay(200);
    return this.templates.filter(template => template.isActive);
  }

  async getTemplateById(templateId: string): Promise<ReportTemplate | null> {
    await this.delay(150);
    return this.templates.find(template => template.id === templateId) || null;
  }

  async getTemplatesByType(type: string): Promise<ReportTemplate[]> {
    await this.delay(200);
    return this.templates.filter(template => template.type === type && template.isActive);
  }

  // Template processing
  processTemplate(template: ReportTemplate, variables: Record<string, string>): string {
    let content = template.content;
    
    template.variables.forEach(variable => {
      const placeholder = `{{${variable}}}`;
      const value = variables[variable] || `[${variable}]`;
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return content;
  }

  // Document generation utilities
  generateReportFromTemplate(
    templateId: string, 
    variables: Record<string, string>,
    reportData: Partial<MedicalReport>
  ): Omit<MedicalReport, 'id' | 'createdAt'> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template não encontrado');
    }

    const content = this.processTemplate(template, variables);

    return {
      type: template.type as any,
      title: reportData.title || template.name,
      content,
      templateUsed: templateId,
      status: 'draft',
      ...reportData
    } as Omit<MedicalReport, 'id' | 'createdAt'>;
  }

  // Status management
  async changeReportStatus(reportId: string, newStatus: MedicalReport['status']): Promise<MedicalReport> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error('Relatório não encontrado');
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'draft': ['issued', 'sent'],
      'issued': ['sent'],
      'sent': []
    };

    if (!validTransitions[report.status].includes(newStatus)) {
      throw new Error(`Transição de status inválida: ${report.status} -> ${newStatus}`);
    }

    return this.updateReport(reportId, { status: newStatus });
  }

  // Digital signature simulation
  async signReport(reportId: string, signerInfo: { name: string; certificate: string }): Promise<MedicalReport> {
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error('Relatório não encontrado');
    }

    if (report.status !== 'issued') {
      throw new Error('Apenas relatórios emitidos podem ser assinados');
    }

    const digitalSignature = {
      signed: true,
      signedBy: signerInfo.name,
      signedAt: new Date().toISOString(),
      certificate: signerInfo.certificate
    };

    return this.updateReport(reportId, { digitalSignature });
  }

  // Export utilities
  async exportReportToPDF(reportId: string): Promise<Blob> {
    await this.delay(1000); // Simulate PDF generation
    
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error('Relatório não encontrado');
    }

    // In a real implementation, this would use a PDF library
    const pdfContent = `PDF Content for: ${report.title}\n\n${report.content}`;
    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  async exportReportToWord(reportId: string): Promise<Blob> {
    await this.delay(800); // Simulate Word generation
    
    const report = await this.getReportById(reportId);
    if (!report) {
      throw new Error('Relatório não encontrado');
    }

    // In a real implementation, this would use a Word library
    const wordContent = `Word Content for: ${report.title}\n\n${report.content}`;
    return new Blob([wordContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  // Analytics
  async getReportStats(patientId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    recent: number; // Last 30 days
  }> {
    await this.delay(200);
    
    const filteredReports = patientId 
      ? this.reports.filter(r => r.patientId === patientId)
      : this.reports;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = {
      total: filteredReports.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      recent: filteredReports.filter(r => new Date(r.createdAt) >= thirtyDaysAgo).length
    };

    filteredReports.forEach(report => {
      stats.byType[report.type] = (stats.byType[report.type] || 0) + 1;
      stats.byStatus[report.status] = (stats.byStatus[report.status] || 0) + 1;
    });

    return stats;
  }

  // Search functionality
  async searchReports(query: string, filters?: {
    patientId?: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<MedicalReport[]> {
    await this.delay(300);
    
    let results = [...this.reports];

    // Apply filters
    if (filters?.patientId) {
      results = results.filter(r => r.patientId === filters.patientId);
    }
    
    if (filters?.type) {
      results = results.filter(r => r.type === filters.type);
    }
    
    if (filters?.status) {
      results = results.filter(r => r.status === filters.status);
    }
    
    if (filters?.dateFrom) {
      results = results.filter(r => r.createdAt >= filters.dateFrom!);
    }
    
    if (filters?.dateTo) {
      results = results.filter(r => r.createdAt <= filters.dateTo!);
    }

    // Apply text search
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      results = results.filter(report => 
        report.title.toLowerCase().includes(searchTerm) ||
        report.content.toLowerCase().includes(searchTerm) ||
        report.createdBy.toLowerCase().includes(searchTerm) ||
        (report.recipient && report.recipient.toLowerCase().includes(searchTerm))
      );
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const medicalReportsService = new MedicalReportsService();
export default medicalReportsService;