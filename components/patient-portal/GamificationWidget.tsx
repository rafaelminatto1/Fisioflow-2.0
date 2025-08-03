
import React from 'react';
import WidgetWrapper from './WidgetWrapper';

const GamificationWidget = () => {
  const playerStats = {
    currentPoints: 2450,
    level: 8,
    levelProgress: 75,
    nextLevelPoints: 3000
  };

  const achievements = [
    { id: 1, name: "Primeiro Exercício", icon: "🎯", earned: true },
    { id: 2, name: "Streak de 7 Dias", icon: "🔥", earned: true },
    { id: 3, name: "Mestre da Postura", icon: "👑", earned: true },
    { id: 4, name: "Maratonista", icon: "🏃", earned: false }
  ];

  return (
    <WidgetWrapper title="Gamificação">
      <div className="space-y-4">
        {/* Player Level & Points */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-lg font-bold text-purple-700">
                Nível {playerStats.level}
              </div>
              <div className="text-sm text-purple-600">
                {playerStats.currentPoints} pontos
              </div>
            </div>
            <div className="text-2xl">🏆</div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-purple-200 rounded-full h-2 mb-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${playerStats.levelProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-purple-600 text-center">
            {playerStats.nextLevelPoints - playerStats.currentPoints} pontos para o próximo nível
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Conquistas
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`p-2 rounded-lg text-center transition-all ${
                  achievement.earned
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-gray-50 border border-gray-200 opacity-60'
                }`}
              >
                <div className="text-lg mb-1">{achievement.icon}</div>
                <div className={`text-xs font-medium ${
                  achievement.earned ? 'text-yellow-700' : 'text-gray-500'
                }`}>
                  {achievement.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Challenge */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-700">
                Desafio Diário
              </div>
              <div className="text-xs text-blue-600">
                Complete 3 exercícios hoje
              </div>
            </div>
            <div className="text-sm font-bold text-blue-700">
              2/3
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: '66%' }}
            ></div>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default GamificationWidget;
