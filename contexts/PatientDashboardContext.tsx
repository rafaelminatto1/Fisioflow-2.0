
import React, { createContext, useState } from 'react';
import { PatientDashboard } from '../types';

interface PatientDashboardContextType {
  dashboard: PatientDashboard | null;
  setDashboard: (dashboard: PatientDashboard) => void;
}

export const PatientDashboardContext = createContext<PatientDashboardContextType | undefined>(undefined);

export const PatientDashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dashboard, setDashboard] = useState<PatientDashboard | null>(null);

  return (
    <PatientDashboardContext.Provider value={{ dashboard, setDashboard }}>
      {children}
    </PatientDashboardContext.Provider>
  );
};
