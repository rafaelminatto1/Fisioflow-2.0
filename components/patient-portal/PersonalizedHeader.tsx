
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Sparkles, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Star,
  Zap,
  Heart
} from 'lucide-react';

const PersonalizedHeader = () => {
  const { user } = useAuth();
  
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Bom dia';
    }
    if (hour < 18) {
      return 'Boa tarde';
    }
    return 'Boa noite';
  }, []);

  // Mock achievement data - in production this would come from the backend
  const achievements = {
    streakDays: 12,
    totalPoints: 2450,
    level: 7,
    recentAchievement: 'Disciplinado - 10 dias consecutivos',
    nextMilestone: 'Conquistador - 15 dias consecutivos',
    progressToNext: 80,
    weeklyGoalProgress: 85
  };

  const motivationalMessages = [
    'Sua dedicação está fazendo toda a diferença!',
    'Continue assim, você está no caminho certo!',
    'Cada exercício te aproxima da recuperação total!',
    'Seu progresso é inspirador!'
  ];

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="absolute top-8 right-8">
          <Star className="w-6 h-6" />
        </div>
        <div className="absolute bottom-4 left-12">
          <Heart className="w-5 h-5" />
        </div>
        <div className="absolute bottom-8 right-4">
          <Zap className="w-7 h-7" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between">
        {/* Left Side - Greeting and Message */}
        <div className="mb-6 lg:mb-0">
          <motion.h1 
            className="text-3xl lg:text-4xl font-bold mb-2"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {greeting}, {user?.name?.split(' ')[0] || 'Paciente'}!
          </motion.h1>
          
          <motion.p 
            className="text-blue-100 text-lg mb-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {randomMessage}
          </motion.p>

          {/* Achievement Celebration */}
          {achievements.recentAchievement && (
            <motion.div 
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 w-fit"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Trophy className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-medium">
                Conquista: {achievements.recentAchievement}
              </span>
            </motion.div>
          )}
        </div>

        {/* Right Side - Stats and Progress */}
        <motion.div 
          className="flex flex-col lg:flex-row gap-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Streak Counter */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="w-6 h-6 text-yellow-300" />
              <span className="text-3xl font-bold">{achievements.streakDays}</span>
            </div>
            <p className="text-blue-100 text-sm">dias seguidos</p>
          </div>

          {/* Level Progress */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-300" />
              <span className="text-xl font-bold">Nível {achievements.level}</span>
            </div>
            <div className="w-24 bg-white/20 rounded-full h-2">
              <motion.div 
                className="bg-yellow-300 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${achievements.progressToNext}%` }}
                transition={{ delay: 0.8, duration: 1 }}
              />
            </div>
            <p className="text-blue-100 text-xs mt-1">{achievements.progressToNext}% para próximo nível</p>
          </div>

          {/* Weekly Goal */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-green-300" />
              <span className="text-2xl font-bold">{achievements.weeklyGoalProgress}%</span>
            </div>
            <p className="text-blue-100 text-sm">meta semanal</p>
          </div>
        </motion.div>
      </div>

      {/* Next Milestone Progress */}
      <motion.div 
        className="mt-6 pt-6 border-t border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span className="text-blue-100">Próxima conquista:</span>
            <span className="font-medium">{achievements.nextMilestone}</span>
          </div>
          <span className="text-blue-100">
            {15 - achievements.streakDays} dias restantes
          </span>
        </div>
        
        <div className="w-full bg-white/20 rounded-full h-2 mt-2">
          <motion.div 
            className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(achievements.streakDays / 15) * 100}%` }}
            transition={{ delay: 1.2, duration: 1 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PersonalizedHeader;
