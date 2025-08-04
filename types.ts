

export enum Role {
  Admin = 'Admin',
  Therapist = 'Fisioterapeuta',
  Patient = 'Paciente',
  EducadorFisico = 'EducadorFisico',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  patientId?: string;
}

export interface Surgery {
  name: string;
  date: string; // YYYY-MM-DD
}

export interface Condition {
  name: string;
  date: string; // YYYY-MM-DD
}

export interface TrackedMetric {
  id: string;
  name: string;
  unit: string;
  isActive: boolean;
}

export interface MetricResult {
  metricId: string;
  value: number;
}

export interface PatientAttachment {
    name: string;
    url: string;
    type: string;
    size: number;
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  gender?: string;
  emergencyContact: {
    name: string;
    phone:string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  status: 'Ativo' | 'Inativo' | 'Alta';
  lastVisit: string;
  registrationDate?: string;
  avatarUrl: string;
  consentGiven: boolean;
  allergies?: string;
  medicalAlerts?: string;
  surgeries?: Surgery[];
  conditions?: string[];
  attachments?: PatientAttachment[];
  trackedMetrics?: TrackedMetric[];
  therapistId?: string;
}

export interface Therapist {
  id: string;
  name: string;
  color: string; // e.g., 'teal', 'sky', 'indigo'
  avatarUrl: string;
}

export enum AppointmentStatus {
  Scheduled = 'Agendado',
  Completed = 'Realizado',
  Canceled = 'Cancelado',
  NoShow = 'Faltou',
  // Additional statuses for compatibility
  scheduled = 'Agendado',
  confirmed = 'Confirmado',
  completed = 'Realizado',
  cancelled = 'Cancelado',
  canceled = 'Cancelado',
  no_show = 'Faltou',
  rescheduled = 'Reagendado'
}

export enum AppointmentType {
    Evaluation = 'Avaliação',
    Session = 'Sessão',
    Return = 'Retorno',
    Group = 'Grupo'
}

export interface RecurrenceRule {
    frequency: 'daily' | 'weekly' | 'monthly';
    days: number[]; // 0=Sun, 1=Mon, ...
    until: string; // YYYY-MM-DD
    interval?: number;
    daysOfWeek?: number[];
    endDate?: string;
    occurrences?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  therapistId: string;
  startTime: Date;
  endTime: Date;
  title: string;
  type: AppointmentType;
  status: AppointmentStatus;
  value: number;
  paymentStatus: 'paid' | 'pending';
  observations?: string;
  seriesId?: string;
  recurrenceRule?: RecurrenceRule;
  sessionNumber?: number;
  totalSessions?: number;
  location?: string;
  notes?: string;
}

export interface SoapNote {
  id: string;
  patientId: string;
  date: string;
  therapist: string;
  sessionNumber?: number;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  bodyParts?: string[];
  painScale?: number;
  attachments?: { name: string; url: string; }[];
  metricResults?: MetricResult[];
}

export interface StatCardData {
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  coffitoDiagnosisCodes: string;
  treatmentGoals: string;
  frequencyPerWeek: number;
  durationWeeks: number;
  modalities: string[];
  outcomeMeasures: string[];
  createdByCrefito: string;
  exercises?: ExercisePrescription[];
}

export interface ExercisePrescription {
    id: string;
    treatmentPlanId: string;
    exerciseName: string;
    sets: number;
    repetitions: string; // Can be "15" or "30s"
    resistanceLevel: string;
    progressionCriteria: string;
    demonstrationVideoUrl?: string;
}

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
}

export interface Protocol {
  id: string;
  name: string;
  description: string;
}

export interface LibraryExercise {
  id: string;
  name: string;
  duration: string;
  videoUrl: string;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  exercises: LibraryExercise[];
}


export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: 'Fortalecimento' | 'Alongamento' | 'Mobilidade' | 'Propriocepção' | 'Cardio';
  bodyParts: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  equipment: string[];
  instructions: string[];
  media: {
    videoUrl?: string;
    thumbnailUrl: string;
  };
  contraindications?: string[];
  modifications?: {
    easier?: string;
    harder?: string;
  };
  status?: 'approved' | 'pending_approval';
  authorId?: string;
}

export interface GroupMember {
  patientId: string;
  patientName: string;
  joinDate: string;
  status: 'active' | 'paused';
  level: 'beginner' | 'intermediate' | 'advanced';
  points?: number;
  avatarUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  therapistId: string;
  capacity: {
    max: number;
    current: number;
  };
  members: GroupMember[];
  schedule: {
    days: string[]; // e.g., ["monday", "wednesday", "friday"]
    time: string; // e.g., "08:00"
    duration: number; // in minutes
  };
  exercises: {
    exerciseId: string;
    order: number;
  }[];
  status: 'active' | 'paused' | 'completed';
  gamification?: {
    totalPoints: number;
    level: number;
    badges: string[];
    challenges: {
      id: string;
      title: string;
      description: string;
      progress: number; // 0-100
    }[];
  };
  metrics?: {
    averageAdherence: number;
    averageSatisfaction: number;
    cohesionScore: number;
    progressRate: number;
  };
}

export interface AppointmentHeatmapData {
    day: string;
    '8h': number; '9h': number; '10h': number; '11h': number;
    '12h': number; '13h': number; '14h': number; '15h': number;
    '16h': number; '17h': number; '18h': number; '19h': number;
}


export interface ClinicalMaterialData {
  nome_material: string;
  tipo_material: 'Escala de Avaliação' | 'Protocolo Clínico' | 'Material de Orientação';
}

// --- Task Management Types ---
export enum TaskStatus {
  ToDo = 'A Fazer',
  InProgress = 'Em Andamento',
  Done = 'Concluído',
}

export enum TaskPriority {
  High = 'Alta',
  Medium = 'Média',
  Low = 'Baixa',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  assignedUserId: string;
  actorUserId: string; // Who created/assigned it
}

// --- Patient Portal Types ---

export interface PainLog {
    id: string;
    patientId: string;
    date: Date;
    painLevel: number;
    notes?: string;
}

export interface Document {
  id: string;
  patientId: string;
  name: string;
  type: 'Atestado' | 'Recibo' | 'Exame';
  issueDate: string;
  url: string;
}


// --- UI Types ---
export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

// --- Clinical Library Types ---

export interface Material {
  id: string;
  name: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  materials: Material[];
}

// --- Specialty Assessment Types ---
export interface Specialty {
  id: string;
  name: string;
  imageUrl: string;
}

// --- Partnership System Types ---
export interface VoucherPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  credits: number; // e.g., number of sessions
  features: string[];
  popular?: boolean;
}

export interface Voucher {
  id: string;
  code: string;
  patientId: string;
  plan: VoucherPlan;
  status: 'activated' | 'expired' | 'cancelled';
  purchaseDate: Date;
  activationDate: Date;
  expiryDate: Date;
  remainingCredits: number;
}

export interface PartnershipClient {
    patient: Patient;
    voucher: Voucher;
}

export interface FinancialSummary {
  grossRevenue: number;
  platformFee: number;
  taxAmount: number;
  netRevenue: number;
  period: string;
}

export interface CommissionBreakdown {
    grossAmount: number;
    platformFee: number;
    taxAmount: number;
    netAmount: number;
}

export interface Transaction {
  id: string;
  type: 'voucher_purchase';
  patientName: string;
  planName: string;
  status: 'completed';
  breakdown: CommissionBreakdown;
  createdAt: Date;
}

// --- AI System Types ---

export enum AIProvider {
    CACHE = 'Cache',
    INTERNAL_KB = 'Base de Conhecimento',
    GEMINI = 'Gemini',
    CHATGPT = 'ChatGPT',
    CLAUDE = 'Claude',
    PERPLEXITY = 'Perplexity',
    MARS = 'Mars',
}

export interface AIResponse {
  content: string;
  source: AIProvider;
}

export interface AIQueryLog extends AIResponse {
    id: number;
    prompt: string;
    timestamp: Date;
}

export interface KnowledgeBaseEntry {
  id: string;
  type: 'protocol' | 'technique' | 'exercise' | 'case';
  title: string;
  content: string;
  tags: string[];
}
export type Achievement = {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: React.ElementType;
};
// --- Notifications ---
export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  type: 'task_assigned' | 'announcement' | 'appointment_reminder';
}

// --- Enhanced Patient Management Types ---

// Enhanced Patient Interfaces
export interface EnhancedPatient extends Patient {
  // Analytics fields
  riskScore?: number;
  engagementLevel?: 'low' | 'medium' | 'high';
  predictedChurn?: number;
  lifetimeValue?: number;
  
  // Enhanced tracking
  tags?: PatientTag[];
  customFields?: CustomField[];
  preferences?: PatientPreferences;
}

export interface PatientTag {
  id: string;
  name: string;
  color: string;
  category: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  value: any;
  required: boolean;
}

export interface PatientPreferences {
  communicationChannel: 'email' | 'sms' | 'whatsapp';
  appointmentReminders: boolean;
  marketingEmails: boolean;
  dataSharing: boolean;
}

// Enhanced Document Management
export interface PatientDocument extends PatientAttachment {
  id: string;
  category: DocumentCategory;
  tags: string[];
  annotations?: Annotation[];
  version: number;
  extractedText?: string;
  shareLinks: ShareLink[];
  uploadedBy?: string;
  uploadedAt: Date;
}

export interface DocumentCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Annotation {
  id: string;
  userId: string;
  userName: string;
  text: string;
  position: { x: number; y: number };
  createdAt: Date;
}

export interface ShareLink {
  id: string;
  url: string;
  expiresAt: Date;
  accessCount: number;
  maxAccess: number;
  password?: string;
}

// Enhanced Metrics
export interface EnhancedMetric extends TrackedMetric {
  template?: MetricTemplate;
  predictions: MetricPrediction[];
  alerts: MetricAlert[];
  correlations: MetricCorrelation[];
  normalRanges?: { min: number; max: number; ageGroup: string }[];
}

export interface MetricTemplate {
  id: string;
  name: string;
  specialty: string;
  defaultUnit: string;
  normalRanges: { min: number; max: number; ageGroup: string }[];
  alertThresholds: { value: number; severity: 'low' | 'medium' | 'high' }[];
  description?: string;
}

export interface MetricPrediction {
  date: Date;
  predictedValue: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'declining';
  factors?: string[];
}

export interface MetricAlert {
  id: string;
  type: 'threshold' | 'trend' | 'anomaly';
  severity: 'low' | 'medium' | 'high';
  message: string;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface MetricCorrelation {
  withMetricId: string;
  withMetricName: string;
  correlationValue: number; // -1 to 1
  significance: number; // 0 to 1
}

// Search and Filtering
export interface SearchFilters {
  text: string;
  status: string[];
  ageRange: [number, number];
  registrationDateRange: [Date | null, Date | null];
  lastVisitRange: [Date | null, Date | null];
  therapistIds: string[];
  hasConditions: string[];
  hasSurgeries: boolean | null;
  tags?: string[];
  customFilters?: Record<string, any>;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
  userId: string;
  isShared?: boolean;
}

export interface SearchResult {
  patients: Patient[];
  totalCount: number;
  facets: SearchFacets;
  suggestions?: SearchSuggestion[];
}

export interface SearchFacets {
  statuses: { value: string; count: number }[];
  therapists: { id: string; name: string; count: number }[];
  conditions: { value: string; count: number }[];
  ageGroups: { range: string; count: number }[];
  tags?: { value: string; count: number }[];
}

export interface SearchSuggestion {
  type: 'patient' | 'condition' | 'therapist' | 'tag';
  value: string;
  label: string;
  score: number;
}

// Import/Export
export interface ImportResults {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  duplicatesFound: number;
  warnings?: string[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: string;
  severity: 'error' | 'warning';
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  fields: string[];
  filters?: Partial<SearchFilters>;
  includeDocuments?: boolean;
  includeMetrics?: boolean;
}

// Analytics and Reporting
export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  trend: number;
  period: 'day' | 'week' | 'month' | 'year';
  calculatedAt: Date;
  filters?: Record<string, any>;
  previousValue?: number;
}

export interface PatientSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  patientCount: number;
  lastUpdated: Date;
  color?: string;
  description?: string;
}

export interface SegmentCriteria {
  ageRange?: [number, number];
  conditions?: string[];
  treatmentDuration?: [number, number];
  engagementLevel?: string[];
  status?: string[];
  therapistIds?: string[];
  tags?: string[];
  customFilters?: Record<string, any>;
}

export interface DemographicData {
  ageDistribution: { range: string; count: number; percentage: number }[];
  genderDistribution: { gender: string; count: number; percentage: number }[];
  statusDistribution: { status: string; count: number; percentage: number }[];
  conditionDistribution: { condition: string; count: number; percentage: number }[];
}

export interface TrendData {
  period: string;
  newPatients: number;
  activePatients: number;
  dischargedPatients: number;
  totalAppointments: number;
  retention?: number;
}

export interface PredictiveMetrics {
  churnRisk: { patientId: string; patientName: string; score: number; factors: string[] }[];
  demandForecast: { period: string; predictedAppointments: number; confidence: number }[];
  lifetimeValuePrediction: { segment: string; averageLTV: number; confidence: number }[];
}

export interface PerformanceMetrics {
  patientRetentionRate: number;
  averageTreatmentDuration: number;
  appointmentShowRate: number;
  patientSatisfactionScore: number;
  revenuePerPatient: number;
  newPatientAcquisitionRate: number;
}

// Compliance and Audit
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
  witnessId?: string;
  witnessName?: string;
}

export interface DataRetentionPolicy {
  patientDataRetentionYears: number;
  auditLogRetentionYears: number;
  automaticDeletionEnabled: boolean;
  lastPolicyUpdate: Date;
  exceptions?: DataRetentionException[];
}

export interface DataRetentionException {
  resourceType: string;
  resourceId: string;
  retentionYears: number;
  reason: string;
  approvedBy: string;
  approvedAt: Date;
}

export interface ComplianceReport {
  id: string;
  type: 'audit' | 'consent' | 'retention' | 'security';
  generatedAt: Date;
  period: { start: Date; end: Date };
  summary: ComplianceReportSummary;
  details: any;
  format: 'json' | 'pdf' | 'csv';
  generatedBy: string;
}

export interface ComplianceReportSummary {
  totalDataAccess: number;
  consentViolations: number;
  retentionViolations: number;
  securityIncidents: number;
  complianceScore: number; // 0-100
  recommendations?: string[];
}

export interface DataDeletionRequest {
  id: string;
  patientId: string;
  patientName: string;
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
  estimatedCompletionDate?: Date;
}

// Error Handling
export interface PatientManagementError extends Error {
  code: string;
  category: 'validation' | 'permission' | 'system' | 'compliance';
  details?: Record<string, any>;
  userMessage: string;
  technicalMessage: string;
  suggestions?: string[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'unique' | 'custom';
  message: string;
  validator?: (value: any, context: any) => boolean;
}

// UI State Management
export interface PatientListState {
  patients: Patient[];
  filteredPatients: Patient[];
  filters: Partial<SearchFilters>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  pageSize: number;
  totalCount: number;
  loading: boolean;
  error?: string;
  selectedPatients: string[];
}

export interface PatientDetailState {
  patient?: Patient;
  documents: PatientDocument[];
  metrics: EnhancedMetric[];
  auditLog: AuditLogEntry[];
  consentStatus: ConsentStatus;
  loading: boolean;
  error?: string;
  activeTab: string;
}

// Workflow and Notifications
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  dependencies?: string[];
}

export interface PatientWorkflow {
  id: string;
  patientId: string;
  type: 'admission' | 'treatment' | 'discharge';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  steps: WorkflowStep[];
  startedAt: Date;
  completedAt?: Date;
  assignedTo?: string;
}

export interface PatientNotification {
  id: string;
  patientId: string;
  type: 'appointment_reminder' | 'status_change' | 'document_ready' | 'treatment_complete';
  title: string;
  message: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'push';
  scheduled: Date;
  sent?: Date;
  delivered?: Date;
  read?: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}

// --- Enhanced Patient Dashboard Types ---

export interface DashboardWidget {
  id: string;
  type: 'PainTrend' | 'ExerciseStreak' | 'EducationalContent' | 'Communication' | 'Gamification';
  position: { x: number; y: number; w: number; h: number };
}

export interface PatientDashboard {
  patientId: string;
  layout: DashboardWidget[];
  preferences: {
    theme: 'light' | 'dark';
    showMotivationalMessages: boolean;
  };
}

// --- Medical Reports Types ---

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

export interface DocumentGenerationRequest {
  templateId: string;
  variables: Record<string, string>;
  patientId: string;
  reportData: Partial<MedicalReport>;
}

export interface DocumentGenerationResult {
  success: boolean;
  report?: MedicalReport;
  error?: string;
  validationErrors?: Array<{ field: string; message: string }>;
}

// --- Documentation System Types ---

export interface DocumentationSystem {
  soapNotes: SoapNote[];
  medicalReports: MedicalReport[];
  templates: ReportTemplate[];
  auditLog: DocumentAuditEntry[];
}

export interface DocumentAuditEntry {
  id: string;
  documentId: string;
  documentType: 'soap_note' | 'medical_report';
  action: 'created' | 'updated' | 'viewed' | 'signed' | 'sent' | 'deleted';
  performedBy: string;
  performedAt: Date;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface DocumentViewPermission {
  documentId: string;
  userId: string;
  userType: 'therapist' | 'patient' | 'external';
  permissions: ('view' | 'edit' | 'delete' | 'sign' | 'share')[];
  expiresAt?: Date;
}

export interface DocumentShareLink {
  id: string;
  documentId: string;
  documentType: 'soap_note' | 'medical_report';
  url: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  maxViews?: number;
  currentViews: number;
  password?: string;
  requiresLogin: boolean;
  viewLog: Array<{
    viewedAt: Date;
    ipAddress: string;
    userAgent: string;
    viewerId?: string;
  }>;
}