import { useState, useEffect } from 'react';
import { Plus, Save, X, Tag, FileText, Lightbulb, Stethoscope, Target } from 'lucide-react';
import { KnowledgeEntry } from '../../types/ai-economica.types';
import KnowledgeBaseService from '../../services/ai-economica/knowledgeBaseService';
import { useToast } from '../../contexts/ToastContext';

interface KnowledgeContributionProps {
  onClose?: () => void;
  onSaved?: (entryId: string) => void;
  initialData?: Partial<KnowledgeEntry>;
}

const KnowledgeContribution = ({ 
  onClose, 
  onSaved, 
  initialData 
}: KnowledgeContributionProps) => {
  const [formData, setFormData] = useState({
    type: 'experience' as KnowledgeEntry['type'],
    title: '',
    content: '',
    summary: '',
    tags: [] as string[],
    conditions: [] as string[],
    techniques: [] as string[],
    contraindications: [] as string[],
    references: [] as string[],
    metadata: {
      difficulty: 'intermediate' as const,
      evidenceLevel: 'moderate' as const,
      specialty: [] as string[]
    }
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentCondition, setCurrentCondition] = useState('');
  const [currentTechnique, setCurrentTechnique] = useState('');
  const [currentContraindication, setCurrentContraindication] = useState('');
  const [currentReference, setCurrentReference] = useState('');
  const [currentSpecialty, setCurrentSpecialty] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { showToast } = useToast();
  const knowledgeBase = new KnowledgeBaseService();

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMetadataChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  };

  const addToArray = (field: keyof typeof formData, value: string, setter: (val: string) => void) => {
    if (value.trim()) {
      const currentArray = formData[field] as string[];
      if (!currentArray.includes(value.trim())) {
        setFormData(prev => ({
          ...prev,
          [field]: [...currentArray, value.trim()]
        }));
      }
      setter('');
    }
  };

  const removeFromArray = (field: keyof typeof formData, index: number) => {
    const currentArray = formData[field] as string[];
    setFormData(prev => ({
      ...prev,
      [field]: currentArray.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Título e conteúdo são obrigatórios', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Pegar dados do usuário (simulado)
      const currentUser = {
        id: 'user_123',
        name: 'Dr. João Silva',
        role: 'Fisioterapeuta',
        experience: 8
      };

      const entryData = {
        ...formData,
        tenantId: 'tenant_fisioflow',
        author: currentUser,
        summary: formData.summary || formData.content.substring(0, 200) + '...'
      };

      const entryId = await knowledgeBase.addKnowledge(entryData);
      
      showToast('Conhecimento adicionado com sucesso!', 'success');
      
      if (onSaved) {
        onSaved(entryId);
      }
      
      if (onClose) {
        onClose();
      } else {
        // Reset form
        setFormData({
          type: 'experience',
          title: '',
          content: '',
          summary: '',
          tags: [],
          conditions: [],
          techniques: [],
          contraindications: [],
          references: [],
          metadata: {
            difficulty: 'intermediate',
            evidenceLevel: 'moderate',
            specialty: []
          }
        });
      }
    } catch (error) {
      showToast('Erro ao salvar conhecimento', 'error');
      console.error('Erro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeIcons = {
    protocol: <FileText className="w-4 h-4" />,
    exercise: <Target className="w-4 h-4" />,
    case: <Stethoscope className="w-4 h-4" />,
    technique: <Lightbulb className="w-4 h-4" />,
    experience: <Plus className="w-4 h-4" />
  };

  const typeLabels = {
    protocol: 'Protocolo Clínico',
    exercise: 'Exercício Terapêutico',
    case: 'Caso Clínico',
    technique: 'Técnica Específica',
    experience: 'Experiência Clínica'
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Preview do Conhecimento</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                {typeIcons[formData.type]}
                <span className="text-sm text-gray-600">{typeLabels[formData.type]}</span>
              </div>

              <h3 className="text-xl font-semibold">{formData.title}</h3>

              {formData.summary && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Resumo</h4>
                  <p className="text-gray-700">{formData.summary}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Conteúdo</h4>
                <div className="prose max-w-none">
                  {formData.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3">{paragraph}</p>
                  ))}
                </div>
              </div>

              {formData.techniques.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Técnicas</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.techniques.map((technique, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {technique}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.conditions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Condições Relacionadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.conditions.map((condition, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.contraindications.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Contraindicações</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.contraindications.map((contra, index) => (
                      <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                        {contra}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.references.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Referências</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {formData.references.map((ref, index) => (
                      <li key={index} className="text-gray-700">{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Voltar à Edição
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Salvando...' : 'Confirmar e Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Contribuir com Conhecimento</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Conhecimento */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Conhecimento</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(typeLabels).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('type', type)}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                      formData.type === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {typeIcons[type as keyof typeof typeIcons]}
                    <span className="text-xs text-center">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block text-sm font-medium mb-2">Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Protocolo para dor lombar crônica"
                required
              />
            </div>

            {/* Resumo */}
            <div>
              <label className="block text-sm font-medium mb-2">Resumo (opcional)</label>
              <textarea
                value={formData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                rows={2}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Breve resumo do conhecimento..."
              />
            </div>

            {/* Conteúdo */}
            <div>
              <label className="block text-sm font-medium mb-2">Conteúdo *</label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={10}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva detalhadamente o conhecimento, incluindo procedimentos, observações e resultados..."
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('tags', currentTag, setCurrentTag))}
                  className="flex-1 p-2 border rounded-lg"
                  placeholder="Digite uma tag e pressione Enter"
                />
                <button
                  type="button"
                  onClick={() => addToArray('tags', currentTag, setCurrentTag)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeFromArray('tags', index)}
                      className="ml-1 text-gray-500 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Condições Relacionadas */}
            <div>
              <label className="block text-sm font-medium mb-2">Condições/Diagnósticos Relacionados</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentCondition}
                  onChange={(e) => setCurrentCondition(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('conditions', currentCondition, setCurrentCondition))}
                  className="flex-1 p-2 border rounded-lg"
                  placeholder="Ex: Lombalgia, Hérnia de disco..."
                />
                <button
                  type="button"
                  onClick={() => addToArray('conditions', currentCondition, setCurrentCondition)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.conditions.map((condition, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {condition}
                    <button
                      type="button"
                      onClick={() => removeFromArray('conditions', index)}
                      className="ml-1 text-green-600 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Técnicas */}
            <div>
              <label className="block text-sm font-medium mb-2">Técnicas Aplicadas</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentTechnique}
                  onChange={(e) => setCurrentTechnique(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('techniques', currentTechnique, setCurrentTechnique))}
                  className="flex-1 p-2 border rounded-lg"
                  placeholder="Ex: Mobilização articular, Terapia manual..."
                />
                <button
                  type="button"
                  onClick={() => addToArray('techniques', currentTechnique, setCurrentTechnique)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.techniques.map((technique, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {technique}
                    <button
                      type="button"
                      onClick={() => removeFromArray('techniques', index)}
                      className="ml-1 text-purple-600 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Contraindicações */}
            <div>
              <label className="block text-sm font-medium mb-2">Contraindicações</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentContraindication}
                  onChange={(e) => setCurrentContraindication(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('contraindications', currentContraindication, setCurrentContraindication))}
                  className="flex-1 p-2 border rounded-lg"
                  placeholder="Ex: Gravidez, Osteoporose severa..."
                />
                <button
                  type="button"
                  onClick={() => addToArray('contraindications', currentContraindication, setCurrentContraindication)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.contraindications.map((contra, index) => (
                  <span
                    key={index}
                    className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {contra}
                    <button
                      type="button"
                      onClick={() => removeFromArray('contraindications', index)}
                      className="ml-1 text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Metadados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Dificuldade</label>
                <select
                  value={formData.metadata.difficulty}
                  onChange={(e) => handleMetadataChange('difficulty', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Iniciante</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="advanced">Avançado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nível de Evidência</label>
                <select
                  value={formData.metadata.evidenceLevel}
                  onChange={(e) => handleMetadataChange('evidenceLevel', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Baixo</option>
                  <option value="moderate">Moderado</option>
                  <option value="high">Alto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Especialidade</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentSpecialty}
                    onChange={(e) => setCurrentSpecialty(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('metadata.specialty' as any, currentSpecialty, setCurrentSpecialty))}
                    className="flex-1 p-2 border rounded-lg"
                    placeholder="Ex: Ortopedia"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (currentSpecialty.trim()) {
                        handleMetadataChange('specialty', [...formData.metadata.specialty, currentSpecialty.trim()]);
                        setCurrentSpecialty('');
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.metadata.specialty.map((spec, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center gap-1"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecialties = formData.metadata.specialty.filter((_, i) => i !== index);
                          handleMetadataChange('specialty', newSpecialties);
                        }}
                        className="text-blue-600 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Referências */}
            <div>
              <label className="block text-sm font-medium mb-2">Referências Bibliográficas</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentReference}
                  onChange={(e) => setCurrentReference(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('references', currentReference, setCurrentReference))}
                  className="flex-1 p-2 border rounded-lg"
                  placeholder="URL ou citação completa..."
                />
                <button
                  type="button"
                  onClick={() => addToArray('references', currentReference, setCurrentReference)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {formData.references.map((ref, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-3 rounded-lg flex justify-between items-start gap-3"
                  >
                    <span className="text-sm text-gray-700 flex-1">{ref}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('references', index)}
                      className="text-gray-500 hover:text-red-500 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Visualizar
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Salvando...' : 'Salvar Conhecimento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeContribution;