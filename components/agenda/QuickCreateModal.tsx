import { useState, useEffect } from 'react';
import { X, Clock, User, Calendar, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment, AppointmentType, Patient, Therapist } from '@/types';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Partial<Appointment>) => void;
  selectedDate: Date;
  selectedTime?: Date;
  patients: Patient[];
  therapists: Therapist[];
  existingAppointments: Appointment[];
}

const QuickCreateModal = ({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  selectedTime,
  patients,
  therapists,
  existingAppointments
}: QuickCreateModalProps) => {
  const [formData, setFormData] = useState({
    patientId: '',
    therapistId: '',
    type: AppointmentType.Session,
    date: format(selectedDate, 'yyyy-MM-dd'),
    startTime: selectedTime ? format(selectedTime, 'HH:mm') : '09:00',
    duration: 60,
    title: '',
    notes: ''
  });

  const [suggestions, setSuggestions] = useState<{
    patients: Patient[];
    conflicts: Appointment[];
  }>({
    patients: [],
    conflicts: []
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        patientId: '',
        therapistId: '',
        type: AppointmentType.Session,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime ? format(selectedTime, 'HH:mm') : '09:00',
        duration: 60,
        title: '',
        notes: ''
      });
      setSearchTerm('');
    }
  }, [isOpen, selectedDate, selectedTime]);

  useEffect(() => {
    // Filter patients based on search term
    const filteredPatients = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cpf.includes(searchTerm)
    ).slice(0, 5);

    // Check for conflicts
    const appointmentDate = new Date(formData.date + 'T' + formData.startTime);
    const endTime = new Date(appointmentDate.getTime() + (formData.duration * 60 * 1000));
    
    const conflicts = existingAppointments.filter(apt => {
      if (apt.therapistId !== formData.therapistId) return false;
      
      const aptStart = apt.startTime;
      const aptEnd = apt.endTime;
      
      return (
        (appointmentDate >= aptStart && appointmentDate < aptEnd) ||
        (endTime > aptStart && endTime <= aptEnd) ||
        (appointmentDate <= aptStart && endTime >= aptEnd)
      );
    });

    setSuggestions({
      patients: filteredPatients,
      conflicts
    });
  }, [searchTerm, formData, patients, existingAppointments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedPatient = patients.find(p => p.id === formData.patientId);
    if (!selectedPatient) return;

    const startDateTime = new Date(formData.date + 'T' + formData.startTime);
    const endDateTime = new Date(startDateTime.getTime() + (formData.duration * 60 * 1000));

    const newAppointment: Partial<Appointment> = {
      patientId: formData.patientId,
      patientName: selectedPatient.name,
      therapistId: formData.therapistId,
      type: formData.type,
      startTime: startDateTime,
      endTime: endDateTime,
      title: formData.title || `${formData.type} - ${selectedPatient.name}`,
      notes: formData.notes
    };

    onSave(newAppointment);
    onClose();
  };

  const handleQuickFill = (patient: Patient) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      title: `${prev.type} - ${patient.name}`
    }));
    setSearchTerm(patient.name);
  };

  const getTypeColors = (type: AppointmentType) => {
    const colors = {
      [AppointmentType.Evaluation]: 'bg-green-100 text-green-800 border-green-200',
      [AppointmentType.Session]: 'bg-blue-100 text-blue-800 border-blue-200',
      [AppointmentType.Return]: 'bg-purple-100 text-purple-800 border-purple-200',
      [AppointmentType.Group]: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[type] || colors[AppointmentType.Session];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Criar Agendamento</h2>
              <p className="text-sm text-gray-500">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                {selectedTime && ` às ${format(selectedTime, 'HH:mm')}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient selection with search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Paciente
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome ou CPF do paciente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            
            {/* Patient suggestions */}
            {searchTerm && suggestions.patients.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                {suggestions.patients.map(patient => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handleQuickFill(patient)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-gray-500">{patient.cpf}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Therapist selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fisioterapeuta
            </label>
            <select
              value={formData.therapistId}
              onChange={(e) => setFormData(prev => ({ ...prev, therapistId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Selecione um fisioterapeuta</option>
              {therapists.map(therapist => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.name}
                </option>
              ))}
            </select>
          </div>

          {/* Appointment type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Consulta
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(AppointmentType).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type }))}
                  className={`
                    px-3 py-2 rounded-lg border text-sm font-medium transition-all
                    ${formData.type === type 
                      ? getTypeColors(type) + ' ring-2 ring-offset-2 ring-current/20' 
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Time and duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Horário
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração (min)
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>
          </div>

          {/* Conflict warning */}
          {suggestions.conflicts.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-sm font-medium text-yellow-800 mb-1">
                ⚠️ Conflito de horário detectado
              </div>
              <div className="text-sm text-yellow-700">
                Já existe um agendamento no mesmo horário para este fisioterapeuta.
              </div>
            </div>
          )}

          {/* Title (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título (opcional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Fisioterapia respiratória"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formData.patientId || !formData.therapistId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Criar Agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickCreateModal;