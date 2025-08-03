
import React from 'react';
import WidgetWrapper from './WidgetWrapper';

const EducationalContentWidget = () => {
  const educationalContent = [
    {
      id: 1,
      title: "Como Melhorar sua Postura",
      description: "Dicas essenciais para manter uma postura saudável no dia a dia",
      type: "Artigo",
      readTime: "5 min"
    },
    {
      id: 2,
      title: "Exercícios para Dor nas Costas",
      description: "Série de exercícios recomendados para alívio da dor lombar",
      type: "Vídeo",
      readTime: "10 min"
    },
    {
      id: 3,
      title: "Ergonomia no Trabalho",
      description: "Guia completo para organizar seu ambiente de trabalho",
      type: "Guia",
      readTime: "8 min"
    }
  ];

  return (
    <WidgetWrapper title="Conteúdo Educacional">
      <div className="space-y-3">
        {educationalContent.map((content) => (
          <div 
            key={content.id}
            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm mb-1">
                  {content.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  {content.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {content.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {content.readTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver Mais Conteúdos →
          </button>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default EducationalContentWidget;
