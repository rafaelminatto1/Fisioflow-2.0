import { vi } from 'vitest';
import { factories } from '../factories';

// Mock Auth Service
export const mockAuthService = {
  signIn: vi.fn().mockResolvedValue({ 
    user: factories.user(), 
    error: null 
  }),
  signUp: vi.fn().mockResolvedValue({ 
    user: factories.user(), 
    error: null 
  }),
  signOut: vi.fn().mockResolvedValue({ 
    error: null 
  }),
  getCurrentUser: vi.fn().mockResolvedValue(factories.user()),
  updateProfile: vi.fn().mockResolvedValue({ 
    user: factories.user(), 
    error: null 
  }),
  resetPassword: vi.fn().mockResolvedValue({ 
    error: null 
  }),
  refreshSession: vi.fn().mockResolvedValue({ 
    user: factories.user(), 
    error: null 
  }),
};

// Mock Patient Service
export const mockPatientService = {
  getPatients: vi.fn().mockResolvedValue(factories.batch(factories.patient, 5)),
  getPatientById: vi.fn().mockResolvedValue(factories.patient()),
  createPatient: vi.fn().mockResolvedValue(factories.patient()),
  updatePatient: vi.fn().mockResolvedValue(factories.patient()),
  deletePatient: vi.fn().mockResolvedValue(true),
  searchPatients: vi.fn().mockResolvedValue(factories.batch(factories.patient, 3)),
};

// Mock Appointment Service
export const mockAppointmentService = {
  getAppointments: vi.fn().mockResolvedValue(factories.batch(factories.appointment, 10)),
  getAppointmentById: vi.fn().mockResolvedValue(factories.appointment()),
  createAppointment: vi.fn().mockResolvedValue(factories.appointment()),
  updateAppointment: vi.fn().mockResolvedValue(factories.appointment()),
  deleteAppointment: vi.fn().mockResolvedValue(true),
  getAppointmentsByDate: vi.fn().mockResolvedValue(factories.batch(factories.appointment, 5)),
  getAppointmentsByPatient: vi.fn().mockResolvedValue(factories.batch(factories.appointment, 3)),
  getAppointmentsByTherapist: vi.fn().mockResolvedValue(factories.batch(factories.appointment, 8)),
};

// Mock Therapist Service
export const mockTherapistService = {
  getTherapists: vi.fn().mockResolvedValue(factories.batch(factories.therapist, 3)),
  getTherapistById: vi.fn().mockResolvedValue(factories.therapist()),
  createTherapist: vi.fn().mockResolvedValue(factories.therapist()),
  updateTherapist: vi.fn().mockResolvedValue(factories.therapist()),
  deleteTherapist: vi.fn().mockResolvedValue(true),
  getAvailableTherapists: vi.fn().mockResolvedValue(factories.batch(factories.therapist, 2)),
};

// Mock Notification Service
export const mockNotificationService = {
  getNotifications: vi.fn().mockResolvedValue(factories.batch(factories.notification, 5)),
  markAsRead: vi.fn().mockResolvedValue(true),
  markAllAsRead: vi.fn().mockResolvedValue(true),
  deleteNotification: vi.fn().mockResolvedValue(true),
  createNotification: vi.fn().mockResolvedValue(factories.notification()),
  getUnreadCount: vi.fn().mockResolvedValue(3),
};

// Mock Error Logging Service
export const mockErrorLoggingService = {
  logError: vi.fn().mockResolvedValue(true),
  getErrorLogs: vi.fn().mockResolvedValue(factories.batch(factories.errorLog, 5)),
  resolveError: vi.fn().mockResolvedValue(true),
  deleteErrorLog: vi.fn().mockResolvedValue(true),
};

// Mock Gemini Service
export const mockGeminiService = {
  generateText: vi.fn().mockResolvedValue('Generated AI text response'),
  analyzeImage: vi.fn().mockResolvedValue('Image analysis result'),
  generateSummary: vi.fn().mockResolvedValue('Generated summary'),
  askQuestion: vi.fn().mockResolvedValue('AI answer to question'),
};

// Mock Exercise Service
export const mockExerciseService = {
  getExercises: vi.fn().mockResolvedValue([
    {
      id: '1',
      name: 'Shoulder Flexion',
      description: 'Raise your arm forward and up',
      category: 'Shoulder',
      difficulty: 'Easy',
      duration: 30,
      repetitions: 10,
      videoUrl: 'https://example.com/video1.mp4',
      imageUrl: 'https://example.com/image1.jpg',
    },
    {
      id: '2',
      name: 'Knee Extension',
      description: 'Straighten your knee while seated',
      category: 'Knee',
      difficulty: 'Medium',
      duration: 45,
      repetitions: 15,
      videoUrl: 'https://example.com/video2.mp4',
      imageUrl: 'https://example.com/image2.jpg',
    },
  ]),
  getExerciseById: vi.fn().mockResolvedValue({
    id: '1',
    name: 'Shoulder Flexion',
    description: 'Raise your arm forward and up',
    category: 'Shoulder',
    difficulty: 'Easy',
    duration: 30,
    repetitions: 10,
    videoUrl: 'https://example.com/video1.mp4',
    imageUrl: 'https://example.com/image1.jpg',
  }),
  searchExercises: vi.fn().mockResolvedValue([]),
  getExercisesByCategory: vi.fn().mockResolvedValue([]),
};

// Mock Financial Service
export const mockFinancialService = {
  getRevenue: vi.fn().mockResolvedValue({
    total: 50000,
    monthly: 8500,
    growth: 12.5,
  }),
  getExpenses: vi.fn().mockResolvedValue({
    total: 30000,
    monthly: 5000,
    categories: {
      rent: 2000,
      salaries: 2500,
      equipment: 500,
    },
  }),
  getProfit: vi.fn().mockResolvedValue({
    total: 20000,
    monthly: 3500,
    margin: 40,
  }),
  getFinancialReport: vi.fn().mockResolvedValue({
    revenue: 50000,
    expenses: 30000,
    profit: 20000,
    profitMargin: 40,
    period: 'monthly',
  }),
};

// Mock Group Service
export const mockGroupService = {
  getGroups: vi.fn().mockResolvedValue([
    {
      id: '1',
      name: 'Back Pain Support Group',
      description: 'Group for patients with chronic back pain',
      therapistId: 'therapist-1',
      maxParticipants: 8,
      currentParticipants: 5,
      schedule: 'Tuesdays 10:00 AM',
      isActive: true,
    },
  ]),
  getGroupById: vi.fn().mockResolvedValue({
    id: '1',
    name: 'Back Pain Support Group',
    description: 'Group for patients with chronic back pain',
    therapistId: 'therapist-1',
    maxParticipants: 8,
    currentParticipants: 5,
    schedule: 'Tuesdays 10:00 AM',
    isActive: true,
  }),
  createGroup: vi.fn().mockResolvedValue({
    id: '2',
    name: 'New Group',
    description: 'New group description',
    therapistId: 'therapist-1',
    maxParticipants: 10,
    currentParticipants: 0,
    schedule: 'Mondays 2:00 PM',
    isActive: true,
  }),
  updateGroup: vi.fn().mockResolvedValue(true),
  deleteGroup: vi.fn().mockResolvedValue(true),
  addPatientToGroup: vi.fn().mockResolvedValue(true),
  removePatientFromGroup: vi.fn().mockResolvedValue(true),
};

// Mock Task Service
export const mockTaskService = {
  getTasks: vi.fn().mockResolvedValue([
    {
      id: '1',
      title: 'Complete patient evaluation',
      description: 'Finish the initial evaluation for new patient',
      patientId: 'patient-1',
      therapistId: 'therapist-1',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      priority: 'high',
      status: 'pending',
      completed: false,
    },
  ]),
  getTaskById: vi.fn().mockResolvedValue({
    id: '1',
    title: 'Complete patient evaluation',
    description: 'Finish the initial evaluation for new patient',
    patientId: 'patient-1',
    therapistId: 'therapist-1',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    priority: 'high',
    status: 'pending',
    completed: false,
  }),
  createTask: vi.fn().mockResolvedValue({
    id: '2',
    title: 'New Task',
    description: 'New task description',
    patientId: 'patient-1',
    therapistId: 'therapist-1',
    dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
    priority: 'medium',
    status: 'pending',
    completed: false,
  }),
  updateTask: vi.fn().mockResolvedValue(true),
  deleteTask: vi.fn().mockResolvedValue(true),
  completeTask: vi.fn().mockResolvedValue(true),
};

// Export all mocks
export const serviceMocks = {
  auth: mockAuthService,
  patient: mockPatientService,
  appointment: mockAppointmentService,
  therapist: mockTherapistService,
  notification: mockNotificationService,
  errorLogging: mockErrorLoggingService,
  gemini: mockGeminiService,
  exercise: mockExerciseService,
  financial: mockFinancialService,
  group: mockGroupService,
  task: mockTaskService,
};

// Helper to reset all service mocks
export const resetAllServiceMocks = () => {
  Object.values(serviceMocks).forEach(service => {
    Object.values(service).forEach(method => {
      if (vi.isMockFunction(method)) {
        method.mockClear();
      }
    });
  });
};