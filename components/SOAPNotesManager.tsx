import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock,
  Download,
  Print,
  Copy,
  Activity,
  Heart,
  MapPin,
  Star,
  AlertCircle,
  X,
  Save,
  ArrowLeft
} from 'lucide-react';
import { SoapNote, Patient, MetricResult } from '../types';
import { useToast } from '../contexts/ToastContext';
import NewSoapNoteModal from './NewSoapNoteModal';
import { getNotesByPatientId, addNote, saveNote } from '../services/soapNoteService';

interface SOAPNotesManagerProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

const SOAPNotesManager: React.FC<SOAPNotesManagerProps> = ({
  patient,
  isOpen,
  onClose
}) => {
  const [notes, setNotes] = useState<SoapNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<SoapNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<SoapNote | null>(null);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<SoapNote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [therapistFilter, setTherapistFilter] = useState('');
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useToast();

  // Load notes when component opens
  useEffect(() => {
    if (isOpen && patient.id) {
      loadNotes();
    }
  }, [isOpen, patient.id]);

  // Filter notes when search or filter criteria change
  useEffect(() => {
    filterNotes();
  }, [notes, searchTerm, dateFilter, therapistFilter]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const patientNotes = await getNotesByPatientId(patient.id);
      setNotes(patientNotes);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao carregar notas SOAP', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = [...notes];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(note => 
        note.subjective.toLowerCase().includes(term) ||
        note.objective.toLowerCase().includes(term) ||
        note.assessment.toLowerCase().includes(term) ||
        note.plan.toLowerCase().includes(term) ||
        note.therapist.toLowerCase().includes(term)
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(note => {
        const noteDate = new Date(note.date.split('/').reverse().join('-'));
        const filterDate = new Date(dateFilter);
        return noteDate.toDateString() === filterDate.toDateString();
      });
    }

    // Therapist filter
    if (therapistFilter) {
      filtered = filtered.filter(note => note.therapist === therapistFilter);
    }

    setFilteredNotes(filtered);
  };

  const handleSaveNote = async (noteData: Omit<SoapNote, 'id' | 'patientId' | 'therapist'>) => {
    try {
      if (editingNote) {
        // Update existing note
        const updatedNote = await saveNote({
          ...editingNote,
          ...noteData
        });
        setNotes(prev => prev.map(note => note.id === updatedNote.id ? updatedNote : note));
        showToast('Nota SOAP atualizada com sucesso', 'success');
      } else {
        // Create new note
        const newNote = await addNote(patient.id, noteData);
        setNotes(prev => [newNote, ...prev]);
        showToast('Nova nota SOAP criada com sucesso', 'success');
      }
      
      setShowNewNoteModal(false);
      setEditingNote(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao salvar nota SOAP', 'error');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota SOAP?')) {
      try {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        showToast('Nota SOAP excluída com sucesso', 'success');
        
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
          setView('list');
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Erro ao excluir nota SOAP', 'error');
      }
    }
  };

  const handleDuplicateNote = (note: SoapNote) => {
    setEditingNote(note);
    setShowNewNoteModal(true);
  };

  const formatDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getUniqueTherapists = () => {
    const therapists = [...new Set(notes.map(note => note.therapist))];
    return therapists;
  };

  const getPainScaleColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score <= 3) return 'text-green-600';
    if (score <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderNotesList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Notas SOAP</h3>
          <p className="text-gray-600">{patient.name} - {notes.length} registros</p>
        </div>
        <button
          onClick={() => {
            setEditingNote(null);
            setShowNewNoteModal(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Nova Nota SOAP</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nas notas..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Therapist Filter */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os terapeutas</option>
              {getUniqueTherapists().map(therapist => (
                <option key={therapist} value={therapist}>{therapist}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || dateFilter || therapistFilter) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFilter('');
              setTherapistFilter('');
            }}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
          >
            <X size={14} />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>

      {/* Notes List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando notas...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {notes.length === 0 ? 'Nenhuma nota SOAP encontrada' : 'Nenhuma nota encontrada com os filtros aplicados'}
          </h3>
          <p className="text-gray-500 mb-4">
            {notes.length === 0 ? 'Comece criando a primeira nota SOAP para este paciente.' : 'Tente ajustar os filtros para encontrar as notas desejadas.'}
          </p>
          {notes.length === 0 && (
            <button
              onClick={() => {
                setEditingNote(null);
                setShowNewNoteModal(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Criar primeira nota SOAP
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="text-blue-600" size={20} />
                      <span className="font-semibold text-gray-900">
                        Sessão {note.sessionNumber || '#'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      <span>{note.date}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User size={14} />
                      <span>{note.therapist}</span>
                    </div>

                    {note.painScale && (
                      <div className="flex items-center space-x-2">
                        <Heart size={14} className={getPainScaleColor(note.painScale)} />
                        <span className={`text-sm font-medium ${getPainScaleColor(note.painScale)}`}>
                          Dor: {note.painScale}/10
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Parts */}
                  {note.bodyParts && note.bodyParts.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {note.bodyParts.map((part, index) => (
                          <span key={index} className="inline-flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            <MapPin size={12} />
                            <span>{part}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Subjetivo</h4>
                      <p className="text-gray-600 line-clamp-2">{note.subjective || 'Não informado'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Objetivo</h4>
                      <p className="text-gray-600 line-clamp-2">{note.objective || 'Não informado'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Avaliação</h4>
                      <p className="text-gray-600 line-clamp-2">{note.assessment || 'Não informado'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Plano</h4>
                      <p className="text-gray-600 line-clamp-2">{note.plan || 'Não informado'}</p>
                    </div>
                  </div>

                  {/* Attachments & Metrics */}
                  {(note.attachments?.length || note.metricResults?.length) && (
                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                      {note.attachments?.length && (
                        <span className="flex items-center space-x-1">
                          <Download size={14} />
                          <span>{note.attachments.length} anexo(s)</span>
                        </span>
                      )}
                      {note.metricResults?.length && (
                        <span className="flex items-center space-x-1">
                          <Activity size={14} />
                          <span>{note.metricResults.length} métrica(s)</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedNote(note);
                      setView('detail');
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Visualizar"
                  >
                    <Eye size={16} />
                  </button>
                  
                  <button
                    onClick={() => {
                      setEditingNote(note);
                      setShowNewNoteModal(true);
                    }}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  
                  <button
                    onClick={() => handleDuplicateNote(note)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                    title="Duplicar"
                  >
                    <Copy size={16} />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderNoteDetail = () => {
    if (!selectedNote) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setView('list')}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                Sessão {selectedNote.sessionNumber || '#'} - {formatDate(selectedNote.date)}
              </h3>
              <p className="text-gray-600">{selectedNote.therapist}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setEditingNote(selectedNote);
                setShowNewNoteModal(true);
              }}
              className="px-3 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 flex items-center space-x-2"
            >
              <Edit size={16} />
              <span>Editar</span>
            </button>
            
            <button
              onClick={() => window.print()}
              className="px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
            >
              <Print size={16} />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Patient Info & Pain Scale */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Paciente</h4>
              <p className="text-gray-900">{patient.name}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Data da Sessão</h4>
              <p className="text-gray-900">{formatDate(selectedNote.date)}</p>
            </div>
            {selectedNote.painScale && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Escala de Dor</h4>
                <div className="flex items-center space-x-2">
                  <Heart className={getPainScaleColor(selectedNote.painScale)} size={20} />
                  <span className={`text-lg font-bold ${getPainScaleColor(selectedNote.painScale)}`}>
                    {selectedNote.painScale}/10
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Body Parts */}
        {selectedNote.bodyParts && selectedNote.bodyParts.length > 0 && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-3 flex items-center space-x-2">
              <MapPin size={16} />
              <span>Áreas Afetadas</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedNote.bodyParts.map((part, index) => (
                <span key={index} className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full border border-red-200">
                  {part}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SOAP Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subjective */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-600 mb-3 flex items-center space-x-2">
              <User size={20} />
              <span>S - Subjetivo</span>
            </h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-line">
                {selectedNote.subjective || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Objective */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-green-600 mb-3 flex items-center space-x-2">
              <Activity size={20} />
              <span>O - Objetivo</span>
            </h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-line">
                {selectedNote.objective || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Assessment */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center space-x-2">
              <AlertCircle size={20} />
              <span>A - Avaliação</span>
            </h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-line">
                {selectedNote.assessment || 'Não informado'}
              </p>
            </div>
          </div>

          {/* Plan */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-purple-600 mb-3 flex items-center space-x-2">
              <Star size={20} />
              <span>P - Plano</span>
            </h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-line">
                {selectedNote.plan || 'Não informado'}
              </p>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {selectedNote.attachments && selectedNote.attachments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Download size={20} />
              <span>Anexos</span>
            </h4>
            <div className="space-y-2">
              {selectedNote.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="text-gray-700">{attachment.name}</span>
                  <button
                    onClick={() => window.open(attachment.url, '_blank')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metric Results */}
        {selectedNote.metricResults && selectedNote.metricResults.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Activity size={20} />
              <span>Resultados de Métricas</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedNote.metricResults.map((result, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700">{result.metricName}</span>
                    <span className="text-lg font-bold text-blue-600">{result.value} {result.unit}</span>
                  </div>
                  <p className="text-sm text-gray-600">{result.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Sistema SOAP</h2>
              <p className="text-gray-600">Gerenciamento de documentação clínica</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {view === 'list' ? renderNotesList() : renderNoteDetail()}
        </div>
      </div>

      {/* New Note Modal */}
      {showNewNoteModal && (
        <NewSoapNoteModal
          isOpen={showNewNoteModal}
          onClose={() => {
            setShowNewNoteModal(false);
            setEditingNote(null);
          }}
          onSave={handleSaveNote}
          noteToDuplicate={editingNote}
        />
      )}
    </div>
  );
};

export default SOAPNotesManager;