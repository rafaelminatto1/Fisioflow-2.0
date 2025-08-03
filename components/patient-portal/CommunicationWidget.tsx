
import React from 'react';
import WidgetWrapper from './WidgetWrapper';

const CommunicationWidget = () => {
  return (
    <WidgetWrapper title="Comunicação">
      <div className="space-y-4">
        <p className="text-gray-600">Nenhuma mensagem nova.</p>
        <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Nova Mensagem
        </button>
      </div>
    </WidgetWrapper>
  );
};

export default CommunicationWidget;
