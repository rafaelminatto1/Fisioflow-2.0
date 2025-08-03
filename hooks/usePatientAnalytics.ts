
import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';

export const usePatientAnalytics = () => {
  const [stats, setStats] = useState<any>(null);
  const [demographics, setDemographics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsData, demographicsData] = await Promise.all([
          analyticsService.getPatientStatistics(),
          analyticsService.getPatientDemographics(),
        ]);
        setStats(statsData);
        setDemographics(demographicsData);
      } catch (e) {
        setError('Failed to fetch analytics');
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  return { stats, demographics, loading, error };
};
