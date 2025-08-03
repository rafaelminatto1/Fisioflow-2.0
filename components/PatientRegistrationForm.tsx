import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Shield, 
  FileText,
  Plus,
  X,
  Save,
  Check
} from 'lucide-react';
import { Patient, PatientPreferences } from '../types';
import { useToast } from '../contexts/ToastContext';

// Validation schema
const patientRegistrationSchema = z.object({
  // Basic Information
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 000.000.000-00'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.enum(['Masculino', 'Feminino', 'Outro'], { required_error: 'Gênero é obrigatório' }),
  
  // Contact Information
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido'),
  
  // Emergency Contact
  emergencyContactName: z.string().min(2, 'Nome do contato de emergência é obrigatório'),
  emergencyContactPhone: z.string().min(10, 'Telefone do contato de emergência é obrigatório'),
  
  // Address
  addressStreet: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  addressCity: z.string().min(2, 'Cidade é obrigatória'),
  addressState: z.string().min(2, 'Estado é obrigatório'),
  addressZip: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato 00000-000'),
  
  // Medical Information
  allergies: z.string().optional(),
  medicalAlerts: z.string().optional(),
  conditions: z.array(z.string()).optional(),
  
  // Preferences
  communicationChannel: z.enum(['email', 'sms', 'whatsapp']),
  appointmentReminders: z.boolean(),
  marketingEmails: z.boolean(),
  dataSharing: z.boolean(),
  
  // Consent
  consentGiven: z.boolean().refine(val => val === true, 'Consentimento é obrigatório'),
});

type PatientRegistrationFormData = z.infer<typeof patientRegistrationSchema>;

interface PatientRegistrationFormProps {
  onSave: (patient: Omit<Patient, 'id' | 'lastVisit'>) => Promise<void>;
  initialData?: Patient;
  isEditing?: boolean;
  onCancel: () => void;
}

const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({
  onSave,
  initialData,
  isEditing = false,
  onCancel
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [conditions, setConditions] = useState<string[]>(initialData?.conditions || []);
  const [newCondition, setNewCondition] = useState('');
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset
  } = useForm<PatientRegistrationFormData>({
    resolver: zodResolver(patientRegistrationSchema),
    mode: 'onChange',
    defaultValues: initialData ? {
      name: initialData.name,
      cpf: initialData.cpf,
      birthDate: initialData.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
      gender: initialData.gender as any,
      phone: initialData.phone,
      email: initialData.email,
      emergencyContactName: initialData.emergencyContact.name,
      emergencyContactPhone: initialData.emergencyContact.phone,
      addressStreet: initialData.address.street,
      addressCity: initialData.address.city,
      addressState: initialData.address.state,
      addressZip: initialData.address.zip,
      allergies: initialData.allergies || '',
      medicalAlerts: initialData.medicalAlerts || '',
      communicationChannel: 'email',
      appointmentReminders: true,
      marketingEmails: false,
      dataSharing: false,
      consentGiven: initialData?.consentGiven || false,
    } : {
      communicationChannel: 'email',
      appointmentReminders: true,
      marketingEmails: false,
      dataSharing: false,
      consentGiven: false,
    }
  });

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  const addCondition = () => {
    if (newCondition.trim() && !conditions.includes(newCondition.trim())) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (conditionToRemove: string) => {
    setConditions(conditions.filter(c => c !== conditionToRemove));
  };

  const onSubmit = async (data: PatientRegistrationFormData) => {
    setIsSaving(true);
    try {
      const patientData: Omit<Patient, 'id' | 'lastVisit'> = {
        name: data.name,
        cpf: data.cpf,
        birthDate: data.birthDate,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        emergencyContact: {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone,
        },
        address: {
          street: data.addressStreet,
          city: data.addressCity,
          state: data.addressState,
          zip: data.addressZip,
        },
        status: 'Ativo',
        registrationDate: initialData?.registrationDate || new Date().toISOString(),
        avatarUrl: initialData?.avatarUrl || `https://picsum.photos/seed/${Date.now()}/200/200`,
        consentGiven: data.consentGiven,
        allergies: data.allergies,
        medicalAlerts: data.medicalAlerts,
        conditions: conditions,
        attachments: initialData?.attachments || [],
        trackedMetrics: initialData?.trackedMetrics || [],
        therapistId: initialData?.therapistId,
      };

      await onSave(patientData);
      showToast('Paciente salvo com sucesso!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao salvar paciente', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { id: 1, title: 'Informações Básicas', icon: User },
    { id: 2, title: 'Contato', icon: Phone },
    { id: 3, title: 'Endereço', icon: MapPin },
    { id: 4, title: 'Informações Médicas', icon: FileText },
    { id: 5, title: 'Preferências', icon: Shield },
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
            ${currentStep >= step.id 
              ? 'bg-blue-500 border-blue-500 text-white' 
              : 'border-gray-300 text-gray-400'
            }`}
          >
            {currentStep > step.id ? (
              <Check size={20} />
            ) : (
              <step.icon size={20} />
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={`h-1 w-12 mx-2 
              ${currentStep > step.id ? 'bg-blue-500' : 'bg-gray-300'}`} 
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome completo do paciente"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CPF *
          </label>
          <input
            {...register('cpf')}
            type="text"
            maxLength={14}
            onChange={(e) => {
              const formatted = formatCPF(e.target.value);
              setValue('cpf', formatted);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="000.000.000-00"
          />
          {errors.cpf && (
            <p className="text-red-500 text-sm mt-1">{errors.cpf.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Nascimento *
          </label>
          <input
            {...register('birthDate')}
            type="date"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.birthDate && (
            <p className="text-red-500 text-sm mt-1">{errors.birthDate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gênero *
          </label>
          <select
            {...register('gender')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
            <option value="Outro">Outro</option>
          </select>
          {errors.gender && (
            <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Informações de Contato</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone *
          </label>
          <input
            {...register('phone')}
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(11) 99999-9999"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            {...register('email')}
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="email@exemplo.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contato de Emergência *
          </label>
          <input
            {...register('emergencyContactName')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome do contato"
          />
          {errors.emergencyContactName && (
            <p className="text-red-500 text-sm mt-1">{errors.emergencyContactName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone do Contato *
          </label>
          <input
            {...register('emergencyContactPhone')}
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(11) 99999-9999"
          />
          {errors.emergencyContactPhone && (
            <p className="text-red-500 text-sm mt-1">{errors.emergencyContactPhone.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Endereço</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logradouro *
          </label>
          <input
            {...register('addressStreet')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Rua, Avenida, etc."
          />
          {errors.addressStreet && (
            <p className="text-red-500 text-sm mt-1">{errors.addressStreet.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade *
            </label>
            <input
              {...register('addressCity')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Cidade"
            />
            {errors.addressCity && (
              <p className="text-red-500 text-sm mt-1">{errors.addressCity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado *
            </label>
            <input
              {...register('addressState')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Estado"
            />
            {errors.addressState && (
              <p className="text-red-500 text-sm mt-1">{errors.addressState.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CEP *
            </label>
            <input
              {...register('addressZip')}
              type="text"
              maxLength={9}
              onChange={(e) => {
                const formatted = formatCEP(e.target.value);
                setValue('addressZip', formatted);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="00000-000"
            />
            {errors.addressZip && (
              <p className="text-red-500 text-sm mt-1">{errors.addressZip.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Informações Médicas</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alergias
          </label>
          <textarea
            {...register('allergies')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descreva alergias conhecidas..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alertas Médicos
          </label>
          <textarea
            {...register('medicalAlerts')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Condições ou alertas médicos importantes..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condições Médicas
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite uma condição médica..."
            />
            <button
              type="button"
              onClick={addCondition}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {conditions.map((condition, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center space-x-1"
              >
                <span>{condition}</span>
                <button
                  type="button"
                  onClick={() => removeCondition(condition)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Preferências e Consentimento</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Canal de Comunicação Preferido
          </label>
          <select
            {...register('communicationChannel')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              {...register('appointmentReminders')}
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Receber lembretes de consultas</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              {...register('marketingEmails')}
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Receber emails promocionais</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              {...register('dataSharing')}
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Permitir compartilhamento de dados para pesquisa</span>
          </label>
        </div>

        <div className="border-t pt-4">
          <label className="flex items-start space-x-2">
            <input
              {...register('consentGiven')}
              type="checkbox"
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="text-sm">
              <span className="font-medium">Consentimento de Tratamento *</span>
              <p className="text-gray-600 mt-1">
                Eu consinto com o processamento dos meus dados pessoais para fins de tratamento médico, 
                conforme descrito na política de privacidade da clínica.
              </p>
            </div>
          </label>
          {errors.consentGiven && (
            <p className="text-red-500 text-sm mt-1">{errors.consentGiven.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
      </div>

      {renderStepIndicator()}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {renderCurrentStep()}

        <div className="flex justify-between pt-6 border-t">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Anterior
              </button>
            )}
          </div>

          <div className="space-x-2">
            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Próximo
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
              >
                <Save size={16} />
                <span>{isSaving ? 'Salvando...' : 'Salvar Paciente'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistrationForm;