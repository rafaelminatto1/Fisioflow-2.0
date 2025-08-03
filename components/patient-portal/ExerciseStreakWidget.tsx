
import React from 'react';
import WidgetWrapper from './WidgetWrapper';

const ExerciseStreakWidget = () => {
  const currentStreak = 12;
  const recentExercises = [
    { id: 1, name: "Alongamento Cervical", completed: true, date: "Hoje" },
    { id: 2, name: "Fortalecimento Core", completed: true, date: "Ontem" },
    { id: 3, name: "Mobilidade Lombar", completed: true, date: "23/01" },
    { id: 4, name: "Exercícios Respiratórios", completed: false, date: "Pendente" }
  ];

  return (
    <WidgetWrapper title="Sequência de Exercícios">
      <div className="space-y-4">
        {/* Streak Counter */}
        <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {currentStreak}
          </div>
          <div className="text-sm text-green-700 font-medium">
            dias consecutivos
          </div>
          <div className="text-xs text-green-600 mt-1">
            Continue assim! 🔥
          </div>
        </div>

        {/* Recent Exercises */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Exercícios Recentes
          </h4>
          {recentExercises.map((exercise) => (
            <div 
              key={exercise.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  exercise.completed 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
                }`}>
                  {exercise.completed && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {exercise.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {exercise.date}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-gray-200">
          <button className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Fazer Exercícios Hoje
          </button>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default ExerciseStreakWidget;
