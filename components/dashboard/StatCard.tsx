
import React from 'react';
import { StatCardData } from '../../types';

const StatCard: React.FC<StatCardData> = ({ title, value, change, changeType, icon }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
    <div className="bg-sky-100 text-sky-600 p-3 rounded-full">
      {icon}
    </div>
  </div>
);

export default StatCard;