import { Patient } from '../types';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resourceType: 'patient' | 'document' | 'metric' | 'note' | 'appointment';
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

export interface ConsentStatus {
  dataProcessing: ConsentRecord;
  dataSharing: ConsentRecord;
  marketing: ConsentRecord;
  research: ConsentRecord;
}

export interface ConsentRecord {
  granted: boolean;
  grantedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataRetentionPolicy {
  patientDataRetentionYears: number;
  auditLogRetentionYears: number;
  automaticDeletionEnabled: boolean;
  lastPolicyUpdate: Date;
}

export interface ComplianceReport {
  id: string;
  type: 'audit' | 'consent' | 'retention' | 'security';
  generatedAt: Date;
  period: { start: Date; end: Date };
  summary: ComplianceReportSummary;
  details: any;
  format: 'json' | 'pdf' | 'csv';
}

export interface ComplianceReportSummary {
  totalDataAccess: number;
  consentViolations: number;
  retentionViolations: number;
  securityIncidents: number;
  complianceScore: number; // 0-100
}

export interface DataDeletionRequest {
  id: string;
  patientId: string;
  requestedBy: string;
  requestDate: Date;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvedBy?: string;
  approvedAt?: Date;
  completedAt?: Date;
  deletedData: string[];
  retainedData: string[];
  retentionReason?: string;
}

export enum AuditAction {
  VIEW_PATIENT = 'VIEW_PATIENT',
  CREATE_PATIENT = 'CREATE_PATIENT',
  UPDATE_PATIENT = 'UPDATE_PATIENT',
  DELETE_PATIENT = 'DELETE_PATIENT',
  VIEW_DOCUMENT = 'VIEW_DOCUMENT',
  UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',
  DELETE_DOCUMENT = 'DELETE_DOCUMENT',
  EXPORT_DATA = 'EXPORT_DATA',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  GRANT_CONSENT = 'GRANT_CONSENT',
  REVOKE_CONSENT = 'REVOKE_CONSENT',
  REQUEST_DATA_DELETION = 'REQUEST_DATA_DELETION',
  APPROVE_DATA_DELETION = 'APPROVE_DATA_DELETION',
  COMPLETE_DATA_DELETION = 'COMPLETE_DATA_DELETION'
}

class ComplianceService {
  private auditLogs: AuditLog[] = [];
  private consentRecords: Map<string, ConsentStatus> = new Map();
  private deletionRequests: DataDeletionRequest[] = [];
  private retentionPolicy: DataRetentionPolicy = {
    patientDataRetentionYears: 20, // Brazilian medical records requirement
    auditLogRetentionYears: 5,
    automaticDeletionEnabled: false,
    lastPolicyUpdate: new Date()
  };

  constructor() {
    this.loadStoredData();
    this.setupAutomaticCleanup();
  }

  // Audit Logging
  async logAction(
    userId: string,
    userName: string,
    action: AuditAction,
    resourceType: AuditLog['resourceType'],
    resourceId: string,
    details: Record<string, any> = {},
    ipAddress: string = '',
    userAgent: string = ''
  ): Promise<void> {
    const auditLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      severity: this.determineSeverity(action)
    };

    this.auditLogs.push(auditLog);
    this.persistAuditLogs();

    // Alert for high-severity actions
    if (auditLog.severity === 'high') {
      this.triggerSecurityAlert(auditLog);
    }
  }

  async getAuditLogs(
    filters?: {
      userId?: string;
      action?: AuditAction;
      resourceType?: string;
      dateRange?: [Date, Date];
      severity?: string;
    },
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ logs: AuditLog[]; totalCount: number }> {
    let filteredLogs = [...this.auditLogs];

    if (filters) {
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }
      if (filters.resourceType) {
        filteredLogs = filteredLogs.filter(log => log.resourceType === filters.resourceType);
      }
      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        filteredLogs = filteredLogs.filter(log => 
          log.timestamp >= start && log.timestamp <= end
        );
      }
      if (filters.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
      }
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

    return {
      logs: paginatedLogs,
      totalCount: filteredLogs.length
    };
  }

  // Consent Management
  async updateConsent(
    patientId: string,
    consentType: keyof ConsentStatus,
    granted: boolean,
    version: string = '1.0',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const currentConsent = this.consentRecords.get(patientId) || this.getDefaultConsent();
    
    const consentRecord: ConsentRecord = {
      granted,
      version,
      ipAddress,
      userAgent,
      ...(granted ? {
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      } : {
        revokedAt: new Date()
      })
    };

    currentConsent[consentType] = consentRecord;
    this.consentRecords.set(patientId, currentConsent);
    this.persistConsentRecords();

    // Log consent action
    await this.logAction(
      'system',
      'System',
      granted ? AuditAction.GRANT_CONSENT : AuditAction.REVOKE_CONSENT,
      'patient',
      patientId,
      { consentType, version, granted },
      ipAddress,
      userAgent
    );
  }

  async getConsentStatus(patientId: string): Promise<ConsentStatus> {
    return this.consentRecords.get(patientId) || this.getDefaultConsent();
  }

  async validateConsent(
    patientId: string,
    requiredConsents: (keyof ConsentStatus)[]
  ): Promise<{ valid: boolean; missingConsents: string[] }> {
    const consentStatus = await this.getConsentStatus(patientId);
    const missingConsents: string[] = [];

    for (const consentType of requiredConsents) {
      const consent = consentStatus[consentType];
      
      if (!consent.granted || 
          (consent.expiresAt && consent.expiresAt < new Date()) ||
          consent.revokedAt) {
        missingConsents.push(consentType);
      }
    }

    return {
      valid: missingConsents.length === 0,
      missingConsents
    };
  }

  // Data Deletion (Right to be Forgotten)
  async requestDataDeletion(
    patientId: string,
    requestedBy: string,
    reason: string
  ): Promise<DataDeletionRequest> {
    const deletionRequest: DataDeletionRequest = {
      id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      requestedBy,
      requestDate: new Date(),
      reason,
      status: 'pending',
      deletedData: [],
      retainedData: []
    };

    this.deletionRequests.push(deletionRequest);
    this.persistDeletionRequests();

    await this.logAction(
      requestedBy,
      'Patient',
      AuditAction.REQUEST_DATA_DELETION,
      'patient',
      patientId,
      { reason }
    );

    return deletionRequest;
  }

  async approveDeletionRequest(
    requestId: string,
    approvedBy: string,
    retainedData: string[] = [],
    retentionReason?: string
  ): Promise<void> {
    const request = this.deletionRequests.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Solicitação de exclusão não encontrada');
    }

    request.status = 'approved';
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();
    request.retainedData = retainedData;
    request.retentionReason = retentionReason;

    this.persistDeletionRequests();

    await this.logAction(
      approvedBy,
      'Administrator',
      AuditAction.APPROVE_DATA_DELETION,
      'patient',
      request.patientId,
      { requestId, retainedData, retentionReason }
    );
  }

  async executeDataDeletion(requestId: string, executedBy: string): Promise<void> {
    const request = this.deletionRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'approved') {
      throw new Error('Solicitação não aprovada para execução');
    }

    // In a real implementation, this would delete data from various systems
    const deletedData = [
      'personal_information',
      'medical_history',
      'documents',
      'appointments',
      'notes'
    ].filter(dataType => !request.retainedData.includes(dataType));

    request.status = 'completed';
    request.completedAt = new Date();
    request.deletedData = deletedData;

    this.persistDeletionRequests();

    await this.logAction(
      executedBy,
      'Administrator',
      AuditAction.COMPLETE_DATA_DELETION,
      'patient',
      request.patientId,
      { requestId, deletedData, retainedData: request.retainedData }
    );
  }

  async getDeletionRequests(
    status?: DataDeletionRequest['status']
  ): Promise<DataDeletionRequest[]> {
    let requests = [...this.deletionRequests];
    
    if (status) {
      requests = requests.filter(r => r.status === status);
    }

    return requests.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
  }

  // Compliance Reporting
  async generateComplianceReport(
    type: ComplianceReport['type'],
    period: { start: Date; end: Date }
  ): Promise<ComplianceReport> {
    const { logs } = await this.getAuditLogs({ dateRange: [period.start, period.end] });
    
    const summary: ComplianceReportSummary = {
      totalDataAccess: logs.filter(log => 
        [AuditAction.VIEW_PATIENT, AuditAction.VIEW_DOCUMENT].includes(log.action)
      ).length,
      consentViolations: await this.calculateConsentViolations(period),
      retentionViolations: await this.calculateRetentionViolations(period),
      securityIncidents: logs.filter(log => log.severity === 'high').length,
      complianceScore: 0 // Will be calculated based on violations
    };

    // Calculate compliance score (lower violations = higher score)
    const totalViolations = summary.consentViolations + summary.retentionViolations + summary.securityIncidents;
    summary.complianceScore = Math.max(0, 100 - (totalViolations * 5));

    return {
      id: `report_${Date.now()}`,
      type,
      generatedAt: new Date(),
      period,
      summary,
      details: this.generateReportDetails(type, logs, period),
      format: 'json'
    };
  }

  async checkDataRetentionCompliance(): Promise<{
    expiredPatients: string[];
    expiredAuditLogs: string[];
    recommendations: string[];
  }> {
    const { getPatients } = await import('./patientService');
    const patients = await getPatients();
    
    const retentionCutoff = new Date();
    retentionCutoff.setFullYear(retentionCutoff.getFullYear() - this.retentionPolicy.patientDataRetentionYears);
    
    const auditRetentionCutoff = new Date();
    auditRetentionCutoff.setFullYear(auditRetentionCutoff.getFullYear() - this.retentionPolicy.auditLogRetentionYears);

    const expiredPatients = patients
      .filter(p => new Date(p.lastVisit) < retentionCutoff && p.status === 'Alta')
      .map(p => p.id);

    const expiredAuditLogs = this.auditLogs
      .filter(log => log.timestamp < auditRetentionCutoff)
      .map(log => log.id);

    const recommendations = [];
    if (expiredPatients.length > 0) {
      recommendations.push(`${expiredPatients.length} pacientes de alta precisam ter dados arquivados/deletados`);
    }
    if (expiredAuditLogs.length > 0) {
      recommendations.push(`${expiredAuditLogs.length} logs de auditoria podem ser arquivados`);
    }

    return { expiredPatients, expiredAuditLogs, recommendations };
  }

  // Data Export for Portability
  async exportPatientData(
    patientId: string,
    requestedBy: string,
    format: 'json' | 'pdf' = 'json'
  ): Promise<any> {
    // Validate consent for data export
    const { valid } = await this.validateConsent(patientId, ['dataProcessing']);
    if (!valid) {
      throw new Error('Consentimento necessário para exportação de dados');
    }

    const { getPatientById } = await import('./patientService');
    const patient = await getPatientById(patientId);
    
    if (!patient) {
      throw new Error('Paciente não encontrado');
    }

    // Log the export action
    await this.logAction(
      requestedBy,
      'User',
      AuditAction.EXPORT_DATA,
      'patient',
      patientId,
      { format }
    );

    // Return patient data in requested format
    const exportData = {
      patient,
      auditTrail: this.auditLogs.filter(log => log.resourceId === patientId),
      consentHistory: this.consentRecords.get(patientId),
      exportedAt: new Date(),
      exportedBy: requestedBy
    };

    return format === 'json' ? exportData : this.convertToPDF(exportData);
  }

  private getDefaultConsent(): ConsentStatus {
    return {
      dataProcessing: { granted: false, version: '1.0' },
      dataSharing: { granted: false, version: '1.0' },
      marketing: { granted: false, version: '1.0' },
      research: { granted: false, version: '1.0' }
    };
  }

  private determineSeverity(action: AuditAction): 'low' | 'medium' | 'high' {
    const highSeverityActions = [
      AuditAction.DELETE_PATIENT,
      AuditAction.DELETE_DOCUMENT,
      AuditAction.EXPORT_DATA,
      AuditAction.COMPLETE_DATA_DELETION
    ];

    const mediumSeverityActions = [
      AuditAction.CREATE_PATIENT,
      AuditAction.UPDATE_PATIENT,
      AuditAction.UPLOAD_DOCUMENT,
      AuditAction.GRANT_CONSENT,
      AuditAction.REVOKE_CONSENT
    ];

    if (highSeverityActions.includes(action)) return 'high';
    if (mediumSeverityActions.includes(action)) return 'medium';
    return 'low';
  }

  private async triggerSecurityAlert(auditLog: AuditLog): Promise<void> {
    console.warn('SECURITY ALERT:', {
      action: auditLog.action,
      user: auditLog.userName,
      resource: `${auditLog.resourceType}:${auditLog.resourceId}`,
      timestamp: auditLog.timestamp,
      details: auditLog.details
    });

    // In a real implementation, this would send alerts via email, SMS, or monitoring systems
  }

  private async calculateConsentViolations(period: { start: Date; end: Date }): Promise<number> {
    // This would analyze actions that required consent but were performed without valid consent
    // For now, return a simulated value
    return 0;
  }

  private async calculateRetentionViolations(period: { start: Date; end: Date }): Promise<number> {
    const { expiredPatients, expiredAuditLogs } = await this.checkDataRetentionCompliance();
    return expiredPatients.length + expiredAuditLogs.length;
  }

  private generateReportDetails(
    type: ComplianceReport['type'],
    logs: AuditLog[],
    period: { start: Date; end: Date }
  ): any {
    switch (type) {
      case 'audit':
        return {
          actionBreakdown: this.groupLogsByAction(logs),
          userActivity: this.groupLogsByUser(logs),
          timeDistribution: this.groupLogsByHour(logs)
        };
      case 'consent':
        return {
          consentStatus: Array.from(this.consentRecords.entries()),
          recentConsentChanges: logs.filter(log => 
            [AuditAction.GRANT_CONSENT, AuditAction.REVOKE_CONSENT].includes(log.action)
          )
        };
      case 'retention':
        return this.checkDataRetentionCompliance();
      case 'security':
        return {
          highSeverityEvents: logs.filter(log => log.severity === 'high'),
          suspiciousPatterns: this.detectSuspiciousPatterns(logs)
        };
      default:
        return {};
    }
  }

  private groupLogsByAction(logs: AuditLog[]): Record<string, number> {
    return logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupLogsByUser(logs: AuditLog[]): Record<string, number> {
    return logs.reduce((acc, log) => {
      acc[log.userName] = (acc[log.userName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupLogsByHour(logs: AuditLog[]): Record<string, number> {
    return logs.reduce((acc, log) => {
      const hour = log.timestamp.getHours().toString().padStart(2, '0');
      acc[`${hour}:00`] = (acc[`${hour}:00`] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private detectSuspiciousPatterns(logs: AuditLog[]): string[] {
    const patterns: string[] = [];
    
    // Multiple failed access attempts
    const failedAccess = logs.filter(log => 
      log.details.error || log.details.unauthorized
    );
    if (failedAccess.length > 5) {
      patterns.push(`${failedAccess.length} tentativas de acesso negadas`);
    }

    // Unusual time access
    const nightAccess = logs.filter(log => {
      const hour = log.timestamp.getHours();
      return hour < 6 || hour > 22;
    });
    if (nightAccess.length > 10) {
      patterns.push(`${nightAccess.length} acessos fora do horário comercial`);
    }

    // Bulk data export
    const bulkExports = logs.filter(log => log.action === AuditAction.EXPORT_DATA);
    if (bulkExports.length > 20) {
      patterns.push(`${bulkExports.length} exportações de dados (possível extração em massa)`);
    }

    return patterns;
  }

  private convertToPDF(data: any): string {
    // In a real implementation, this would generate a proper PDF
    return JSON.stringify(data, null, 2);
  }

  private setupAutomaticCleanup(): void {
    if (this.retentionPolicy.automaticDeletionEnabled) {
      // Setup periodic cleanup (daily check)
      setInterval(() => {
        this.performAutomaticCleanup();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }
  }

  private async performAutomaticCleanup(): Promise<void> {
    const { expiredAuditLogs } = await this.checkDataRetentionCompliance();
    
    // Remove expired audit logs
    this.auditLogs = this.auditLogs.filter(log => 
      !expiredAuditLogs.includes(log.id)
    );
    
    this.persistAuditLogs();
  }

  private loadStoredData(): void {
    try {
      // Load audit logs
      const auditData = localStorage.getItem('fisioflow_audit_logs');
      if (auditData) {
        this.auditLogs = JSON.parse(auditData).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }

      // Load consent records
      const consentData = localStorage.getItem('fisioflow_consent_records');
      if (consentData) {
        const records = JSON.parse(consentData);
        Object.entries(records).forEach(([patientId, consent]: [string, any]) => {
          this.consentRecords.set(patientId, {
            ...consent,
            dataProcessing: {
              ...consent.dataProcessing,
              grantedAt: consent.dataProcessing.grantedAt ? new Date(consent.dataProcessing.grantedAt) : undefined,
              expiresAt: consent.dataProcessing.expiresAt ? new Date(consent.dataProcessing.expiresAt) : undefined,
              revokedAt: consent.dataProcessing.revokedAt ? new Date(consent.dataProcessing.revokedAt) : undefined
            },
            // Apply same date conversion to other consent types...
          });
        });
      }

      // Load deletion requests
      const deletionData = localStorage.getItem('fisioflow_deletion_requests');
      if (deletionData) {
        this.deletionRequests = JSON.parse(deletionData).map((request: any) => ({
          ...request,
          requestDate: new Date(request.requestDate),
          approvedAt: request.approvedAt ? new Date(request.approvedAt) : undefined,
          completedAt: request.completedAt ? new Date(request.completedAt) : undefined
        }));
      }
    } catch (error) {
      console.warn('Error loading compliance data:', error);
    }
  }

  private persistAuditLogs(): void {
    try {
      localStorage.setItem('fisioflow_audit_logs', JSON.stringify(this.auditLogs));
    } catch (error) {
      console.warn('Error persisting audit logs:', error);
    }
  }

  private persistConsentRecords(): void {
    try {
      const records = Object.fromEntries(this.consentRecords);
      localStorage.setItem('fisioflow_consent_records', JSON.stringify(records));
    } catch (error) {
      console.warn('Error persisting consent records:', error);
    }
  }

  private persistDeletionRequests(): void {
    try {
      localStorage.setItem('fisioflow_deletion_requests', JSON.stringify(this.deletionRequests));
    } catch (error) {
      console.warn('Error persisting deletion requests:', error);
    }
  }
}

export const complianceService = new ComplianceService();