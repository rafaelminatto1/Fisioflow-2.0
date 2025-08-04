import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, User, Calendar, Zap, Sparkles } from 'lucide-react';
import { Appointment, Patient, Therapist, AppointmentType } from '../../types';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Partial<Appointment>) => Promise<boolean>;
  initialDate?: Date;
  initialTherapistId?: string;
  patients: Patient[];
  therapists: Therapist[];
  suggestions?: {
    recentPatients: Patient[];
    frequentAppointmentTypes: string[];
    suggestedTimes: Date[];
  };
}

const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialTherapistId,
  patients,
  therapists,
  suggestions
}) => {
  const [patientId, setPatientId] = useState('');
  const [therapistId, setTherapistId] = useState(initialTherapistId || '');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('Sessão');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const patientInputRef = useRef<HTMLInputElement>(null);

  // Set initial date and time
  useEffect(() => {
    if (initialDate) {
      const hours = initialDate.getHours().toString().padStart(2, '0');
      const minutes = initialDate.getMinutes().toString().padStart(2, '0');
      setStartTime(`${hours}:${minutes}`);
    }
  }, [initialDate]);

  // Focus on patient input when modal opens
  useEffect(() => {
    if (isOpen && patientInputRef.current) {
      setTimeout(() => patientInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf.includes(searchTerm)
  );

  const recentPatients = suggestions?.recentPatients?.slice(0, 5) || [];
  const displayPatients = searchTerm 
    ? filteredPatients.slice(0, 10)
    : [...recentPatients, ...patients.filter(p => !recentPatients.find(rp => rp.id === p.id))].slice(0, 10);

  const selectedPatient = patients.find(p => p.id === patientId);
  const selectedTherapist = therapists.find(t => t.id === therapistId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !therapistId || !startTime) return;

    setIsLoading(true);

    const [hours, minutes] = startTime.split(':').map(Number);
    const appointmentDate = initialDate ? new Date(initialDate) : new Date();
    appointmentDate.setHours(hours, minutes, 0, 0);

    const endTime = new Date(appointmentDate);
    endTime.setMinutes(endTime.getMinutes() + duration);

    const appointmentData: Partial<Appointment> = {
      patientId,
      patientName: selectedPatient?.name || '',
      therapistId,
      type: appointmentType,
      startTime: appointmentDate,
      endTime,
      title: notes || undefined,
      status: 'scheduled' as any,
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const success = await onSave(appointmentData);
    setIsLoading(false);

    if (success) {
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setPatientId('');
    setTherapistId(initialTherapistId || '');
    setAppointmentType('Sessão');
    setStartTime('');
    setDuration(60);
    setNotes('');
    setSearchTerm('');
    setShowPatientSuggestions(false);
  };

  const handlePatientSelect = (patient: Patient) => {
    setPatientId(patient.id);
    setSearchTerm(patient.name);
    setShowPatientSuggestions(false);

    // Auto-suggest appointment type based on patient history
    // This would be enhanced with actual patient appointment history
    if (patient.name.toLowerCase().includes('avaliação')) {
      setAppointmentType('Avaliação');
    }
  };

  const suggestedTimes = suggestions?.suggestedTimes || [];
  const frequentTypes = suggestions?.frequentAppointmentTypes || ['Sessão', 'Avaliação', 'Retorno'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100"
        style={{
          animation: isOpen ? 'slideUp 0.3s ease-out' : 'slideDown 0.3s ease-in'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Criação Rápida</h2>
              <p className="text-sm text-slate-600">
                {initialDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/70 rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              <User className="w-4 h-4 inline mr-2" />
              Paciente
            </label>
            <div className="relative">
              <input
                ref={patientInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowPatientSuggestions(true);
                  setPatientId('');
                }}
                onFocus={() => setShowPatientSuggestions(true)}
                placeholder="Digite o nome ou CPF do paciente..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
              />
              
              {showPatientSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-10">
                  {recentPatients.length > 0 && !searchTerm && (
                    <div className="p-3 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                        <Sparkles className="w-3 h-3" />
                        Pacientes recentes
                      </div>
                    </div>
                  )}
                  
                  {displayPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handlePatientSelect(patient)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-200 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="font-medium text-slate-800">{patient.name}</div>
                      <div className="text-xs text-slate-500">{patient.cpf}</div>
                    </button>
                  ))}
                  
                  {displayPatients.length === 0 && (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      Nenhum paciente encontrado
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Therapist Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Terapeuta
            </label>
            <select
              value={therapistId}
              onChange={(e) => setTherapistId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            >
              <option value="">Selecione um terapeuta</option>
              {therapists.map((therapist) => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                <Clock className="w-4 h-4 inline mr-2" />
                Horário
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Duração (min)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>
          </div>

          {/* Appointment Type */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              <Calendar className="w-4 h-4 inline mr-2" />
              Tipo de Consulta
            </label>
            <div className="grid grid-cols-3 gap-2">
              {frequentTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAppointmentType(type as AppointmentType)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    appointmentType === type
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Quick time suggestions */}
          {suggestedTimes.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                <Sparkles className="w-4 h-4 inline mr-2" />
                Horários sugeridos
              </label>
              <div className="flex gap-2 flex-wrap">
                {suggestedTimes.slice(0, 4).map((time, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      const hours = time.getHours().toString().padStart(2, '0');
                      const minutes = time.getMinutes().toString().padStart(2, '0');
                      setStartTime(`${hours}:${minutes}`);
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors duration-200"
                  >
                    {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre a consulta..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !patientId || !therapistId || !startTime}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Criar Consulta
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
        }
      `}</style>
    </div>
  );
};

export default QuickCreateModal;