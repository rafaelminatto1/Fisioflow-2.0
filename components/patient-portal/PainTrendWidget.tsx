
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import WidgetWrapper from './WidgetWrapper';

const data = [
  { name: 'Seg', dor: 4 },
  { name: 'Ter', dor: 3 },
  { name: 'Qua', dor: 5 },
  { name: 'Qui', dor: 2 },
  { name: 'Sex', dor: 3 },
  { name: 'Sáb', dor: 1 },
  { name: 'Dom', dor: 2 },
];

const PainTrendWidget = () => {
  return (
    <WidgetWrapper title="Tendência de Dor">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="dor" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </WidgetWrapper>
  );
};

export default PainTrendWidget;
