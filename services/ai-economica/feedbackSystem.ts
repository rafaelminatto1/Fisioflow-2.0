import { KnowledgeEntry, UserFeedback, QualityMetrics, ImprovementSuggestion } from '@/types/ai-economica.types';
import { logger } from './logger';

export class FeedbackSystem {
  private feedbackStorage: Map<string, UserFeedback[]> = new Map();
  private qualityThresholds = {
    excellent: 0.9,
    good: 0.7,
    average: 0.5,
    poor: 0.3
  };

  /**
   * Registra feedback do usuário sobre uma resposta
   */
  async submitFeedback(feedback: UserFeedback): Promise<void> {
    try {
      const entryId = feedback.entryId;
      
      if (!this.feedbackStorage.has(entryId)) {
        this.feedbackStorage.set(entryId, []);
      }
      
      const entryFeedbacks = this.feedbackStorage.get(entryId)!;
      entryFeedbacks.push({
        ...feedback,
        timestamp: new Date(),
        id: this.generateFeedbackId()
      });

      // Atualizar confiança da entrada baseado no feedback
      await this.updateEntryConfidence(entryId);

      logger.info('Feedback registrado', {
        entryId,
        rating: feedback.rating,
        userId: feedback.userId
      });

    } catch (error) {
      logger.error('Erro ao registrar feedback', { feedback, error });
      throw error;
    }
  }

  /**
   * Avalia qualidade de uma resposta baseado nos feedbacks
   */
  async evaluateResponseQuality(entryId: string): Promise<QualityMetrics> {
    const feedbacks = this.feedbackStorage.get(entryId) || [];
    
    if (feedbacks.length === 0) {
      return {
        averageRating: 0,
        totalFeedbacks: 0,
        qualityLevel: 'unknown',
        confidenceLevel: 0,
        lastUpdated: new Date()
      };
    }

    const ratings = feedbacks.map(f => f.rating);
    const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    
    // Calcular métricas adicionais
    const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
    const negativeCount = feedbacks.filter(f => f.rating <= 2).length;
    const neutralCount = feedbacks.length - positiveCount - negativeCount;

    const qualityLevel = this.determineQualityLevel(averageRating);
    const confidenceLevel = this.calculateConfidenceLevel(feedbacks);

    return {
      averageRating,
      totalFeedbacks: feedbacks.length,
      qualityLevel,
      confidenceLevel,
      positiveCount,
      negativeCount,
      neutralCount,
      lastUpdated: new Date(),
      trends: this.calculateTrends(feedbacks)
    };
  }

  /**
   * Atualiza confiança de uma entrada baseado no feedback agregado
   */
  private async updateEntryConfidence(entryId: string): Promise<void> {
    const metrics = await this.evaluateResponseQuality(entryId);
    
    // Nova confiança baseada no feedback
    let newConfidence = metrics.averageRating / 5; // Normalizar para 0-1
    
    // Ajustar baseado na quantidade de feedbacks
    const feedbackWeight = Math.min(metrics.totalFeedbacks / 10, 1); // Peso máximo com 10+ feedbacks
    newConfidence = newConfidence * feedbackWeight + (1 - feedbackWeight) * 0.5; // Começar com 0.5

    // Penalizar se muitos feedbacks negativos
    if (metrics.negativeCount && metrics.negativeCount > metrics.positiveCount) {
      newConfidence *= 0.8;
    }

    logger.info('Confiança atualizada', {
      entryId,
      oldConfidence: 'unknown', // Seria obtido da base de dados
      newConfidence,
      feedbackCount: metrics.totalFeedbacks
    });
  }

  /**
   * Gera sugestões de melhoria baseadas no feedback
   */
  async generateImprovementSuggestions(entryId: string): Promise<ImprovementSuggestion[]> {
    const feedbacks = this.feedbackStorage.get(entryId) || [];
    const suggestions: ImprovementSuggestion[] = [];

    if (feedbacks.length === 0) {
      return suggestions;
    }

    const metrics = await this.evaluateResponseQuality(entryId);
    const comments = feedbacks
      .filter(f => f.comment && f.comment.trim().length > 0)
      .map(f => f.comment!);

    // Analisar padrões nos comentários
    const commonIssues = this.identifyCommonIssues(comments);
    
    // Sugestões baseadas na qualidade
    if (metrics.qualityLevel === 'poor' || metrics.averageRating < 3) {
      suggestions.push({
        type: 'content_improvement',
        priority: 'high',
        title: 'Melhorar qualidade do conteúdo',
        description: 'Esta entrada está recebendo avaliações baixas. Considere revisar e atualizar o conteúdo.',
        impactEstimate: 'high',
        category: 'quality'
      });
    }

    // Sugestões baseadas em comentários
    if (commonIssues.outdated > 2) {
      suggestions.push({
        type: 'content_update',
        priority: 'high',
        title: 'Atualizar informações desatualizadas',
        description: 'Múltiplos usuários indicaram que as informações estão desatualizadas.',
        impactEstimate: 'high',
        category: 'accuracy'
      });
    }

    if (commonIssues.incomplete > 2) {
      suggestions.push({
        type: 'content_expansion',
        priority: 'medium',
        title: 'Expandir conteúdo incompleto',
        description: 'Usuários indicaram que o conteúdo está incompleto ou superficial.',
        impactEstimate: 'medium',
        category: 'completeness'
      });
    }

    if (commonIssues.unclear > 1) {
      suggestions.push({
        type: 'clarity_improvement',
        priority: 'medium',
        title: 'Melhorar clareza da explicação',
        description: 'Alguns usuários tiveram dificuldade para compreender o conteúdo.',
        impactEstimate: 'medium',
        category: 'clarity'
      });
    }

    // Sugestões baseadas em tendências
    if (metrics.trends && metrics.trends.declining) {
      suggestions.push({
        type: 'urgent_review',
        priority: 'high',
        title: 'Revisão urgente necessária',
        description: 'A qualidade desta entrada está em declínio. Revisão imediata recomendada.',
        impactEstimate: 'high',
        category: 'urgent'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Gera relatório de qualidade da base de conhecimento
   */
  async generateQualityReport(): Promise<{
    overallMetrics: QualityMetrics;
    entriesByQuality: Record<string, number>;
    topIssues: ImprovementSuggestion[];
    recommendations: string[];
  }> {
    const allFeedbacks: UserFeedback[] = [];
    const entriesCount = { excellent: 0, good: 0, average: 0, poor: 0, unknown: 0 };
    const allSuggestions: ImprovementSuggestion[] = [];

    // Agregar dados de todas as entradas
    for (const [entryId, feedbacks] of this.feedbackStorage.entries()) {
      allFeedbacks.push(...feedbacks);
      
      const metrics = await this.evaluateResponseQuality(entryId);
      entriesCount[metrics.qualityLevel]++;
      
      const suggestions = await this.generateImprovementSuggestions(entryId);
      allSuggestions.push(...suggestions);
    }

    // Calcular métricas gerais
    const overallMetrics = await this.calculateOverallMetrics(allFeedbacks);
    
    // Identificar principais problemas
    const topIssues = this.prioritizeSuggestions(allSuggestions);
    
    // Gerar recomendações
    const recommendations = this.generateRecommendations(overallMetrics, entriesCount, topIssues);

    return {
      overallMetrics,
      entriesByQuality: entriesCount,
      topIssues: topIssues.slice(0, 10), // Top 10 issues
      recommendations
    };
  }

  /**
   * Calcula ajuste automático de confiança baseado no padrão de feedbacks
   */
  async calculateConfidenceAdjustment(entryId: string): Promise<number> {
    const feedbacks = this.feedbackStorage.get(entryId) || [];
    
    if (feedbacks.length < 3) {
      return 0; // Need minimum feedbacks for adjustment
    }

    const recent = feedbacks.slice(-10); // Last 10 feedbacks
    const averageRating = recent.reduce((sum, f) => sum + f.rating, 0) / recent.length;
    
    // Calculate adjustment factor
    let adjustment = 0;
    
    if (averageRating >= 4.5) {
      adjustment = +0.1; // Boost for excellent feedback
    } else if (averageRating >= 4.0) {
      adjustment = +0.05; // Small boost for good feedback
    } else if (averageRating <= 2.0) {
      adjustment = -0.15; // Penalty for poor feedback
    } else if (averageRating <= 2.5) {
      adjustment = -0.1; // Smaller penalty
    }

    // Factor in feedback consistency
    const variance = this.calculateVariance(recent.map(f => f.rating));
    if (variance > 2) {
      adjustment *= 0.5; // Reduce adjustment if feedback is inconsistent
    }

    return Math.max(-0.3, Math.min(0.2, adjustment)); // Clamp adjustment
  }

  // Helper methods

  private generateFeedbackId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private determineQualityLevel(averageRating: number): 'excellent' | 'good' | 'average' | 'poor' | 'unknown' {
    if (averageRating >= 4.5) return 'excellent';
    if (averageRating >= 3.5) return 'good';
    if (averageRating >= 2.5) return 'average';
    if (averageRating > 0) return 'poor';
    return 'unknown';
  }

  private calculateConfidenceLevel(feedbacks: UserFeedback[]): number {
    const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
    const feedbackWeight = Math.min(feedbacks.length / 10, 1);
    
    return (averageRating / 5) * feedbackWeight;
  }

  private calculateTrends(feedbacks: UserFeedback[]): { improving: boolean; declining: boolean; stable: boolean } {
    if (feedbacks.length < 5) {
      return { improving: false, declining: false, stable: true };
    }

    const recent = feedbacks.slice(-5);
    const older = feedbacks.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, f) => sum + f.rating, 0) / recent.length;
    const olderAvg = older.reduce((sum, f) => sum + f.rating, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 0.5) return { improving: true, declining: false, stable: false };
    if (difference < -0.5) return { improving: false, declining: true, stable: false };
    return { improving: false, declining: false, stable: true };
  }

  private identifyCommonIssues(comments: string[]): {
    outdated: number;
    incomplete: number;
    unclear: number;
    incorrect: number;
  } {
    const issues = { outdated: 0, incomplete: 0, unclear: 0, incorrect: 0 };
    
    for (const comment of comments) {
      const lowerComment = comment.toLowerCase();
      
      if (lowerComment.includes('desatualizado') || lowerComment.includes('antigo') || lowerComment.includes('obsoleto')) {
        issues.outdated++;
      }
      
      if (lowerComment.includes('incompleto') || lowerComment.includes('falta') || lowerComment.includes('superficial')) {
        issues.incomplete++;
      }
      
      if (lowerComment.includes('confuso') || lowerComment.includes('não entendi') || lowerComment.includes('pouco claro')) {
        issues.unclear++;
      }
      
      if (lowerComment.includes('incorreto') || lowerComment.includes('errado') || lowerComment.includes('não funciona')) {
        issues.incorrect++;
      }
    }
    
    return issues;
  }

  private async calculateOverallMetrics(allFeedbacks: UserFeedback[]): Promise<QualityMetrics> {
    if (allFeedbacks.length === 0) {
      return {
        averageRating: 0,
        totalFeedbacks: 0,
        qualityLevel: 'unknown',
        confidenceLevel: 0,
        lastUpdated: new Date()
      };
    }

    const averageRating = allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length;
    const qualityLevel = this.determineQualityLevel(averageRating);
    
    return {
      averageRating,
      totalFeedbacks: allFeedbacks.length,
      qualityLevel,
      confidenceLevel: averageRating / 5,
      positiveCount: allFeedbacks.filter(f => f.rating >= 4).length,
      negativeCount: allFeedbacks.filter(f => f.rating <= 2).length,
      lastUpdated: new Date()
    };
  }

  private prioritizeSuggestions(suggestions: ImprovementSuggestion[]): ImprovementSuggestion[] {
    const priorityScore = (s: ImprovementSuggestion): number => {
      let score = 0;
      
      if (s.priority === 'high') score += 3;
      else if (s.priority === 'medium') score += 2;
      else score += 1;
      
      if (s.impactEstimate === 'high') score += 3;
      else if (s.impactEstimate === 'medium') score += 2;
      else score += 1;
      
      return score;
    };

    return suggestions.sort((a, b) => priorityScore(b) - priorityScore(a));
  }

  private generateRecommendations(
    overallMetrics: QualityMetrics,
    entriesCount: Record<string, number>,
    topIssues: ImprovementSuggestion[]
  ): string[] {
    const recommendations: string[] = [];

    if (overallMetrics.averageRating < 3.0) {
      recommendations.push('A qualidade geral da base de conhecimento precisa de melhoria urgente.');
    }

    if (entriesCount.poor > entriesCount.good) {
      recommendations.push('Priorize a revisão das entradas com qualidade baixa.');
    }

    if (topIssues.some(issue => issue.category === 'accuracy')) {
      recommendations.push('Foque em melhorar a precisão e atualidade das informações.');
    }

    if (overallMetrics.totalFeedbacks < 100) {
      recommendations.push('Incentive mais feedback dos usuários para melhorar a avaliação.');
    }

    return recommendations;
  }

  private calculateVariance(ratings: number[]): number {
    const mean = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    const squaredDiffs = ratings.map(rating => Math.pow(rating - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / ratings.length;
  }
}

export const feedbackSystem = new FeedbackSystem();