import { Patient, Appointment, SoapNote, Exercise, Group, Task, Notification } from '../types';

interface MockDataConfig {
  useNetworkDelay?: boolean;
  networkDelay?: number;
  shouldFailSometimes?: boolean;
  failureRate?: number;
}

class MockDataProvider {
  private config: MockDataConfig;
  private data: {
    patients: Patient[];
    appointments: Appointment[];
    soapNotes: SoapNote[];
    exercises: Exercise[];
    groups: Group[];
    tasks: Task[];
    notifications: Notification[];
  };

  constructor(config: MockDataConfig = {}) {
    this.config = {
      useNetworkDelay: true,
      networkDelay: 500,
      shouldFailSometimes: false,
      failureRate: 0.1,
      ...config,
    };

    this.data = this.initializeData();
  }

  private initializeData() {
    return {
      patients: this.loadFromStorage('patients', []),
      appointments: this.loadFromStorage('appointments', []),
      soapNotes: this.loadFromStorage('soapNotes', []),
      exercises: this.loadFromStorage('exercises', []),
      groups: this.loadFromStorage('groups', []),
      tasks: this.loadFromStorage('tasks', []),
      notifications: this.loadFromStorage('notifications', []),
    };
  }

  private loadFromStorage<T>(key: string, defaultValue: T[]): T[] {
    try {
      const stored = localStorage.getItem(`mock_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(`mock_${key}`, JSON.stringify(data));
    } catch {
      // Storage failed, continue without persistence
    }
  }

  private async simulateNetworkDelay(): Promise<void> {
    if (this.config.useNetworkDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.config.networkDelay)
      );
    }
  }

  private shouldSimulateFailure(): boolean {
    return this.config.shouldFailSometimes && 
           Math.random() < (this.config.failureRate || 0.1);
  }

  async getPatients(): Promise<Patient[]> {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Simulated network failure');
    }

    return [...this.data.patients];
  }

  async getPatient(id: string): Promise<Patient | null> {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Simulated network failure');
    }

    return this.data.patients.find(p => p.id === id) || null;
  }

  async createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Simulated network failure');
    }

    const newPatient: Patient = {
      ...patient,
      id: this.generateId(),
    };

    this.data.patients.push(newPatient);
    this.saveToStorage('patients', this.data.patients);
    
    return newPatient;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | null> {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Simulated network failure');
    }

    const index = this.data.patients.findIndex(p => p.id === id);
    if (index === -1) return null;

    this.data.patients[index] = { ...this.data.patients[index], ...updates };
    this.saveToStorage('patients', this.data.patients);
    
    return this.data.patients[index];
  }

  async deletePatient(id: string): Promise<boolean> {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Simulated network failure');
    }

    const index = this.data.patients.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.data.patients.splice(index, 1);
    this.saveToStorage('patients', this.data.patients);
    
    return true;
  }

  async getAppointments(filters?: {
    patientId?: string;
    therapistId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Appointment[]> {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Simulated network failure');
    }

    let appointments = [...this.data.appointments];

    if (filters) {
      if (filters.patientId) {
        appointments = appointments.filter(a => a.patientId === filters.patientId);
      }
      if (filters.therapistId) {
        appointments = appointments.filter(a => a.therapistId === filters.therapistId);
      }
      if (filters.startDate) {
        appointments = appointments.filter(a => a.startTime >= filters.startDate);
      }
      if (filters.endDate) {
        appointments = appointments.filter(a => a.startTime <= filters.endDate);
      }
    }

    return appointments;
  }

  async createAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Simulated network failure');
    }

    const newAppointment: Appointment = {
      ...appointment,
      id: this.generateId(),
    };

    this.data.appointments.push(newAppointment);
    this.saveToStorage('appointments', this.data.appointments);
    
    return newAppointment;
  }

  async getSoapNotes(patientId: string): Promise<SoapNote[]> {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Simulated network failure');
    }

    return this.data.soapNotes.filter(note => note.patientId === patientId);
  }

  async createSoapNote(soapNote: Omit<SoapNote, 'id'>): Promise<SoapNote> {
    await this.simulateNetworkDelay();
    
    if (this.shouldSimulateFailure()) {
      throw new Error('Simulated network failure');
    }

    const newSoapNote: SoapNote = {
      ...soapNote,
      id: this.generateId(),
    };

    this.data.soapNotes.push(newSoapNote);
    this.saveToStorage('soapNotes', this.data.soapNotes);
    
    return newSoapNote;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  clearAllData(): void {
    this.data = {
      patients: [],
      appointments: [],
      soapNotes: [],
      exercises: [],
      groups: [],
      tasks: [],
      notifications: [],
    };

    Object.keys(this.data).forEach(key => {
      localStorage.removeItem(`mock_${key}`);
    });
  }

  seedData(seedData: Partial<typeof this.data>): void {
    this.data = { ...this.data, ...seedData };
    
    Object.entries(seedData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        this.saveToStorage(key, value as any[]);
      }
    });
  }
}

export const mockDataProvider = new MockDataProvider();
export default mockDataProvider;