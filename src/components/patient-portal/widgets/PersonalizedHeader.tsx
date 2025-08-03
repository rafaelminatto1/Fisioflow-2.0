import React, { useState, useEffect } from 'react';
import { Award, Star, Trophy, Target, TrendingUp, Calendar, Zap } from 'lucide-react';
import { useEnhancedDashboard } from '../../../contexts/EnhancedDashboardContext';
import { Achievement, Milestone } from '../../../types/enhancedDashboard';

const PersonalizedHeader: React.FC = () => {
  const { data } = useEnhancedDashboard();
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Show celebration for new achievements
  useEffect(() => {
    if (data?.greeting.achievement && !data.greeting.achievement.unlockedAt) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [data?.greeting.achievement]);

  if (!data) return null;

  const { greeting, patient, gamification } = data;
  const currentLevel = gamification.level;
  const progressPercentage = (gamification.experiencePoints / gamification.experienceToNextLevel) * 100;

  // Get time-based icon
  const getTimeIcon = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '🌅';
    if (hour < 18) return '☀️';
    return '🌙';
  };

  // Get motivational emoji based on progress
  const getMotivationalEmoji = () => {
    if (gamification.totalPoints > 1000) return '🏆';
    if (gamification.totalPoints > 500) return '⭐';
    if (gamification.totalPoints > 100) return '💪';
    return '🎯';
  };

  // Achievement celebration animation
  const AchievementCelebration = ({ achievement }: { achievement: Achievement }) => (
    <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl transition-all duration-1000 ${showCelebration ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
      <div className="text-center text-white">
        <div className="mb-4 animate-bounce">
          <Trophy className="w-16 h-16 mx-auto text-yellow-200" />
        </div>
        <h3 className="text-2xl font-bold mb-2">🎉 Nova Conquista!</h3>
        <p className="text-lg font-semibold">{achievement.title}</p>
        <p className="text-yellow-100 mt-1">{achievement.description}</p>
        <div className="mt-4 inline-flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2">
          <Star className="w-4 h-4 mr-2" />
          <span>+{achievement.points} pontos</span>
        </div>
      </div>
    </div>
  );

  // Milestone progress indicator
  const MilestoneProgress = ({ milestone }: { milestone: Milestone }) => (
    <div className="bg-white bg-opacity-10 rounded-lg p-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{milestone.title}</span>
        <span className="text-sm text-blue-100">
          {milestone.currentValue}/{milestone.targetValue} {milestone.unit}
        </span>
      </div>
      <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
        <div 
          className="bg-white h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min((milestone.currentValue / milestone.targetValue) * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs text-blue-100 mt-1">{milestone.description}</p>
    </div>
  );

  // Treatment days calculation
  const treatmentDays = Math.floor(
    (new Date().getTime() - patient.treatmentStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-xl p-6 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full transform rotate-45" />
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-white rounded-full" />
        </div>

        {/* Main content */}
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Main greeting */}
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">{getTimeIcon()}</span>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {greeting.timeBasedMessage}
                </h1>
              </div>

              {/* Motivational message */}
              <p className="text-blue-100 text-lg mb-4 leading-relaxed">
                {greeting.motivationalMessage} {getMotivationalEmoji()}
              </p>

              {/* Treatment info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Dia {treatmentDays} de tratamento</span>
                </div>
                <div className="flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  <span>Condição: {patient.condition}</span>
                </div>
              </div>
            </div>

            {/* Level and progress */}
            <div className="text-right ml-4">
              <div className="bg-white bg-opacity-10 rounded-lg p-3 min-w-32">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5 mr-2 text-yellow-300" />
                  <span className="text-2xl font-bold">Nível {currentLevel}</span>
                </div>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-blue-100">
                  {gamification.experiencePoints}/{gamification.experienceToNextLevel} XP
                </p>
              </div>

              {/* Points display */}
              <div className="mt-3 text-center">
                <div className="inline-flex items-center bg-white bg-opacity-10 rounded-full px-3 py-1">
                  <Star className="w-4 h-4 mr-1 text-yellow-300" />
                  <span className="font-semibold">{gamification.totalPoints.toLocaleString('pt-BR')} pontos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent achievement display */}
          {greeting.achievement && !showCelebration && (
            <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-3">
              <div className="flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-300" />
                <div className="flex-1">
                  <p className="font-medium">Última conquista: {greeting.achievement.title}</p>
                  <p className="text-sm text-blue-100">{greeting.achievement.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">+{greeting.achievement.points} pts</span>
                  <p className="text-xs text-blue-100">
                    {new Date(greeting.achievement.unlockedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Milestone progress */}
          {greeting.milestone && (
            <MilestoneProgress milestone={greeting.milestone} />
          )}

          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold">{data.exerciseData.streaks.find(s => s.type === 'exercise')?.currentCount || 0}</div>
              <div className="text-xs text-blue-100">dias seguidos</div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold">{gamification.badges.filter(b => b.unlockedAt).length}</div>
              <div className="text-xs text-blue-100">badges</div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
              <div className="text-lg font-bold">{data.painData.currentLevel || 0}/10</div>
              <div className="text-xs text-blue-100">dor atual</div>
            </div>
          </div>
        </div>

        {/* Achievement celebration overlay */}
        {greeting.achievement && (
          <AchievementCelebration achievement={greeting.achievement} />
        )}
      </div>

      {/* Floating achievement notification */}
      {showCelebration && (
        <div className="absolute -top-4 -right-4 animate-bounce">
          <div className="bg-yellow-400 text-yellow-900 rounded-full p-2 shadow-lg">
            <Trophy className="w-6 h-6" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizedHeader;