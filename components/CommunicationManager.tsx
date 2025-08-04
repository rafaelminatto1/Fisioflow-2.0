import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Send, 
  Users, 
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Eye,
  Edit,
  Trash2,
  Paperclip,
  Mic,
  Video,
  Bell,
  Settings
} from 'lucide-react';
import { Patient } from '../types';
import { useToast } from '../contexts/ToastContext';

interface Message {
  id: string;
  type: 'sms' | 'email' | 'whatsapp' | 'phone' | 'internal';
  from: string;
  to: string[];
  subject?: string;
  content: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduledFor?: Date;
  attachments?: Array<{ name: string; url: string; type: string }>;
  patientId?: string;
  isTemplate?: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface MessageTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'whatsapp';
  subject?: string;
  content: string;
  variables: string[];
  category: 'appointment' | 'reminder' | 'marketing' | 'followup' | 'emergency';
  isActive: boolean;
}

interface CommunicationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPatient?: Patient;
}

const CommunicationManager: React.FC<CommunicationManagerProps> = ({
  isOpen,
  onClose,
  selectedPatient
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'compose' | 'templates' | 'settings'>('messages');
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      loadTemplates();
    }
  }, [isOpen]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      // Mock messages data
      const mockMessages: Message[] = [
        {
          id: '1',
          type: 'sms',
          from: 'Clínica FisioFlow',
          to: ['11999887766'],
          content: 'Olá João! Lembrete: sua consulta é amanhã às 14:00. Confirme sua presença.',
          sentAt: new Date('2024-01-15T10:30:00'),
          status: 'delivered',
          patientId: '1',
          priority: 'medium'
        },
        {
          id: '2',
          type: 'email',
          from: 'contato@fisioflow.com',
          to: ['maria@email.com'],
          subject: 'Resultado dos seus exames',
          content: 'Prezada Maria, seus exames chegaram. Agende uma consulta para discutirmos os resultados.',
          sentAt: new Date('2024-01-14T16:45:00'),
          status: 'read',
          attachments: [
            { name: 'exame_resultado.pdf', url: '/files/exame.pdf', type: 'pdf' }
          ],
          patientId: '2',
          priority: 'high'
        },
        {
          id: '3',
          type: 'whatsapp',
          from: 'FisioFlow',
          to: ['11987654321'],
          content: 'Oi Pedro! Como você está se sentindo após a última sessão? Alguma dor ou desconforto?',
          sentAt: new Date('2024-01-13T09:15:00'),
          status: 'read',
          patientId: '3',
          priority: 'low'
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      showToast('Erro ao carregar mensagens', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    const mockTemplates: MessageTemplate[] = [
      {
        id: '1',
        name: 'Lembrete de Consulta',
        type: 'sms',
        content: 'Olá {{NOME}}! Lembrete: sua consulta é {{DATA}} às {{HORA}}. Confirme sua presença.',
        variables: ['NOME', 'DATA', 'HORA'],
        category: 'reminder',
        isActive: true
      },
      {
        id: '2',
        name: 'Confirmação de Agendamento',
        type: 'email',
        subject: 'Consulta Agendada - {{DATA}}',
        content: 'Prezado(a) {{NOME}},\n\nSua consulta foi agendada para {{DATA}} às {{HORA}} com {{TERAPEUTA}}.\n\nLocal: {{LOCAL}}\n\nAtenciosamente,\nEquipe FisioFlow',
        variables: ['NOME', 'DATA', 'HORA', 'TERAPEUTA', 'LOCAL'],
        category: 'appointment',
        isActive: true
      },
      {
        id: '3',
        name: 'Follow-up Pós-Consulta',
        type: 'whatsapp',
        content: 'Oi {{NOME}}! Como você está se sentindo após nossa última sessão? Alguma dor ou desconforto que gostaria de relatar?',
        variables: ['NOME'],
        category: 'followup',
        isActive: true
      },
      {
        id: '4',
        name: 'Aviso de Cancelamento',
        type: 'sms',
        content: 'Olá {{NOME}}, informamos que sua consulta do dia {{DATA}} às {{HORA}} foi cancelada. Entre em contato para reagendar.',
        variables: ['NOME', 'DATA', 'HORA'],
        category: 'appointment',
        isActive: true
      }
    ];
    setTemplates(mockTemplates);
  };

  const handleSendMessage = async (messageData: Partial<Message>) => {
    setIsLoading(true);
    try {
      const newMessage: Message = {
        id: Date.now().toString(),
        from: 'Clínica FisioFlow',
        sentAt: new Date(),
        status: 'pending',
        priority: 'medium',
        ...messageData
      } as Message;

      setMessages(prev => [newMessage, ...prev]);
      showToast('Mensagem enviada com sucesso!', 'success');
      setShowComposeModal(false);

      // Simulate delivery status update
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'sent' }
            : msg
        ));
      }, 1000);

      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' }
            : msg
        ));
      }, 3000);

    } catch (error) {
      showToast('Erro ao enviar mensagem', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="text-blue-600" size={14} />;
      case 'delivered': return <CheckCircle className="text-green-600" size={14} />;
      case 'read': return <CheckCircle className="text-green-700" size={14} />;
      case 'failed': return <AlertCircle className="text-red-600" size={14} />;
      default: return <Clock className="text-gray-400" size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-800 bg-blue-100';
      case 'delivered': return 'text-green-800 bg-green-100';
      case 'read': return 'text-green-900 bg-green-200';
      case 'failed': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms': return <MessageSquare className="text-blue-600" size={16} />;
      case 'email': return <Mail className="text-green-600" size={16} />;
      case 'whatsapp': return <MessageSquare className="text-green-500" size={16} />;
      case 'phone': return <Phone className="text-purple-600" size={16} />;
      default: return <MessageSquare className="text-gray-600" size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-red-500';
      case 'medium': return 'border-l-4 border-yellow-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

  const ComposeModal: React.FC<{ isOpen: boolean; onClose: () => void; template?: MessageTemplate }> = ({
    isOpen,
    onClose,
    template
  }) => {
    const [formData, setFormData] = useState({
      type: template?.type || 'sms',
      to: selectedPatient ? [selectedPatient.phone] : [''],
      subject: template?.subject || '',
      content: template?.content || '',
      priority: 'medium' as const,
      scheduledFor: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const messageData: Partial<Message> = {
        type: formData.type as any,
        to: formData.to.filter(t => t.trim()),
        subject: formData.subject,
        content: formData.content,
        priority: formData.priority,
        scheduledFor: formData.scheduledFor ? new Date(formData.scheduledFor) : undefined,
        patientId: selectedPatient?.id
      };

      handleSendMessage(messageData);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold">Nova Mensagem</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destinatários</label>
              <input
                type="text"
                value={formData.to[0]}
                onChange={(e) => setFormData({ ...formData, to: [e.target.value] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={formData.type === 'email' ? 'email@exemplo.com' : '(11) 99999-9999'}
                required
              />
            </div>

            {formData.type === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Assunto da mensagem"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Digite sua mensagem..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.type === 'sms' && `${formData.content.length}/160 caracteres`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agendar envio (opcional)</label>
              <input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
              >
                <Send size={16} />
                <span>{isLoading ? 'Enviando...' : 'Enviar'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderMessages = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Central de Mensagens</h3>
          <p className="text-gray-600">{messages.length} mensagens</p>
        </div>
        
        <button
          onClick={() => setShowComposeModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Nova Mensagem</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar mensagens..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os tipos</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="sent">Enviado</option>
            <option value="delivered">Entregue</option>
            <option value="read">Lido</option>
            <option value="failed">Falhou</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('');
              setStatusFilter('');
            }}
            className="px-3 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${getPriorityColor(message.priority)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {getTypeIcon(message.type)}
                  <span className="font-medium text-gray-900">
                    {message.type.toUpperCase()}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(message.status)}
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(message.status)}`}>
                      {message.status === 'pending' ? 'Pendente' :
                       message.status === 'sent' ? 'Enviado' :
                       message.status === 'delivered' ? 'Entregue' :
                       message.status === 'read' ? 'Lido' : 'Falhou'}
                    </span>
                  </div>

                  <span className="text-sm text-gray-500">
                    para {message.to.join(', ')}
                  </span>
                </div>

                {message.subject && (
                  <h4 className="font-medium text-gray-800 mb-1">{message.subject}</h4>
                )}

                <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                  {message.content}
                </p>

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Clock size={12} />
                    <span>{message.sentAt.toLocaleString('pt-BR')}</span>
                  </span>
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <span className="flex items-center space-x-1">
                      <Paperclip size={12} />
                      <span>{message.attachments.length} anexo(s)</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => setSelectedMessage(message)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                  title="Visualizar"
                >
                  <Eye size={16} />
                </button>
                
                <button
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  title="Reenviar"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma mensagem encontrada</h3>
          <p className="text-gray-500 mb-4">Comece enviando sua primeira mensagem.</p>
          <button
            onClick={() => setShowComposeModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Enviar Mensagem
          </button>
        </div>
      )}
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Templates de Mensagem</h3>
          <p className="text-gray-600">{templates.length} templates disponíveis</p>
        </div>
        
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2">
          <Plus size={16} />
          <span>Novo Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-800">{template.name}</h4>
                <div className="flex items-center space-x-2 mt-1">
                  {getTypeIcon(template.type)}
                  <span className="text-sm text-gray-600">{template.type.toUpperCase()}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.category === 'appointment' ? 'bg-blue-100 text-blue-800' :
                    template.category === 'reminder' ? 'bg-yellow-100 text-yellow-800' :
                    template.category === 'followup' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {template.category}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowComposeModal(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                  title="Usar template"
                >
                  <Send size={16} />
                </button>
                
                <button
                  className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
              </div>
            </div>

            {template.subject && (
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-700">Assunto:</p>
                <p className="text-sm text-gray-600">{template.subject}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Conteúdo:</p>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border line-clamp-3">
                {template.content}
              </p>
            </div>

            {template.variables.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Variáveis:</p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable) => (
                    <span key={variable} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <MessageSquare className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Central de Comunicação</h2>
              <p className="text-gray-600">
                {selectedPatient ? `Comunicando com ${selectedPatient.name}` : 'Gerenciar mensagens e comunicações'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'messages', label: 'Mensagens', icon: MessageSquare },
              { id: 'compose', label: 'Compor', icon: Send },
              { id: 'templates', label: 'Templates', icon: FileText },
              { id: 'settings', label: 'Configurações', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {activeTab === 'messages' && renderMessages()}
          {activeTab === 'compose' && (
            <ComposeModal
              isOpen={true}
              onClose={() => setActiveTab('messages')}
            />
          )}
          {activeTab === 'templates' && renderTemplates()}
          {activeTab === 'settings' && (
            <div className="text-center py-12">
              <Settings size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações de Comunicação</h3>
              <p className="text-gray-500">Configurações avançadas serão implementadas na próxima versão.</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
      />
    </div>
  );
};

export default CommunicationManager;