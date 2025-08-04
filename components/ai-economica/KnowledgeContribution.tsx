import React, { useState, useRef } from 'react';
import { Plus, Save, X, Tag, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface KnowledgeEntry {
  id?: string;
  title: string;
  content: string;
  tags: string[];
  category: 'symptom' | 'diagnosis' | 'technique' | 'protocol' | 'general';
  confidence: number;
  author: string;
  references?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface KnowledgeContributionProps {
  onSubmit: (entry: KnowledgeEntry) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<KnowledgeEntry>;
}

const CATEGORIES = [
  { value: 'symptom', label: 'Sintoma', icon: '🩺' },
  { value: 'diagnosis', label: 'Diagnóstico', icon: '🔍' },
  { value: 'technique', label: 'Técnica', icon: '🤲' },
  { value: 'protocol', label: 'Protocolo', icon: '📋' },
  { value: 'general', label: 'Geral', icon: '💡' }
] as const;

export const KnowledgeContribution: React.FC<KnowledgeContributionProps> = ({
  onSubmit,
  onCancel,
  initialData = {}
}) => {
  const [entry, setEntry] = useState<KnowledgeEntry>({
    title: initialData.title || '',
    content: initialData.content || '',
    tags: initialData.tags || [],
    category: initialData.category || 'general',
    confidence: initialData.confidence || 80,
    author: initialData.author || 'Current User',
    references: initialData.references || []
  });

  const [newTag, setNewTag] = useState('');
  const [newReference, setNewReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleAddTag = () => {
    if (newTag.trim() && !entry.tags.includes(newTag.trim())) {
      setEntry(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEntry(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddReference = () => {
    if (newReference.trim() && !entry.references?.includes(newReference.trim())) {
      setEntry(prev => ({
        ...prev,
        references: [...(prev.references || []), newReference.trim()]
      }));
      setNewReference('');
    }
  };

  const handleRemoveReference = (refToRemove: string) => {
    setEntry(prev => ({
      ...prev,
      references: prev.references?.filter(ref => ref !== refToRemove)
    }));
  };

  const validateEntry = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!entry.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!entry.content.trim()) {
      newErrors.content = 'Conteúdo é obrigatório';
    } else if (entry.content.length < 50) {
      newErrors.content = 'Conteúdo deve ter pelo menos 50 caracteres';
    }

    if (entry.tags.length === 0) {
      newErrors.tags = 'Pelo menos uma tag é obrigatória';
    }

    if (entry.confidence < 1 || entry.confidence > 100) {
      newErrors.confidence = 'Confiança deve estar entre 1 e 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateEntry()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(entry);
    } catch (error) {
      console.error('Failed to submit knowledge entry:', error);
      setErrors({ submit: 'Erro ao salvar entrada. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const insertAtCursor = (text: string) => {
    if (contentRef.current) {
      const start = contentRef.current.selectionStart;
      const end = contentRef.current.selectionEnd;
      const newContent = entry.content.substring(0, start) + text + entry.content.substring(end);
      
      setEntry(prev => ({ ...prev, content: newContent }));
      
      // Restore cursor position
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.selectionStart = start + text.length;
          contentRef.current.selectionEnd = start + text.length;
          contentRef.current.focus();
        }
      }, 0);
    }
  };

  const selectedCategory = CATEGORIES.find(cat => cat.value === entry.category);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Contribuir com Conhecimento
              </h2>
              <p className="text-sm text-gray-500">
                Adicione conhecimento à base interna para economizar custos de IA
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Title and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={entry.title}
                  onChange={(e) => setEntry(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Tratamento para dor lombar crônica"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={entry.category}
                  onChange={(e) => setEntry(prev => ({ 
                    ...prev, 
                    category: e.target.value as KnowledgeEntry['category']
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.icon} {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Conteúdo * ({entry.content.length} caracteres)
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {previewMode ? 'Editor' : 'Preview'}
                  </button>
                </div>
              </div>

              {/* Formatting Toolbar */}
              {!previewMode && (
                <div className="flex items-center space-x-2 mb-2 p-2 bg-gray-50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => insertAtCursor('**texto em negrito**')}
                    className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50"
                    title="Negrito"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('*texto em itálico*')}
                    className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50 italic"
                    title="Itálico"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('\n- Item da lista')}
                    className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50"
                    title="Lista"
                  >
                    •
                  </button>
                  <button
                    type="button"
                    onClick={() => insertAtCursor('`código`')}
                    className="px-2 py-1 text-sm bg-white border rounded hover:bg-gray-50 font-mono"
                    title="Código"
                  >
                    {'<>'}
                  </button>
                </div>
              )}

              {previewMode ? (
                <div 
                  className="w-full min-h-[200px] p-3 border border-gray-300 rounded-lg bg-gray-50 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: entry.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/`(.*?)`/g, '<code>$1</code>')
                      .replace(/\n/g, '<br>')
                  }}
                />
              ) : (
                <textarea
                  ref={contentRef}
                  value={entry.content}
                  onChange={(e) => setEntry(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Descreva detalhadamente o conhecimento que deseja compartilhar..."
                  rows={10}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y ${
                    errors.content ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}
              
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.content}
                </p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags * (para facilitar busca)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {entry.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Adicionar tag"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {errors.tags && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.tags}
                </p>
              )}
            </div>

            {/* Confidence and References */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Confiança: {entry.confidence}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={entry.confidence}
                  onChange={(e) => setEntry(prev => ({ 
                    ...prev, 
                    confidence: parseInt(e.target.value) 
                  }))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Baixa</span>
                  <span>Alta</span>
                </div>
                {errors.confidence && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.confidence}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referências (opcional)
                </label>
                <div className="space-y-2">
                  {entry.references?.map((ref, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{ref}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveReference(ref)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newReference}
                      onChange={(e) => setNewReference(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddReference()}
                      placeholder="URL ou citação"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddReference}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Preview da Entrada:</h4>
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">{entry.title || 'Título da entrada'}</h5>
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {selectedCategory?.icon} {selectedCategory?.label}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {entry.content ? entry.content.substring(0, 150) + '...' : 'Conteúdo da entrada aparecerá aqui...'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>Confiança: {entry.confidence}%</span>
                    <span>Tags: {entry.tags.length}</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    Entrada válida
                  </div>
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-red-800">{errors.submit}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Esta entrada será revisada pela equipe antes de ser incluída na base de conhecimento.
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Contribuir
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeContribution;