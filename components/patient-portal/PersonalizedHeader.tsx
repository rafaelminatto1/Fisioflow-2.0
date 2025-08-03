
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const PersonalizedHeader = () => {
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

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {greeting}, [Patient Name]!
      </motion.h1>
      {/* Add personalized header UI here */}
    </div>
  );
};

export default PersonalizedHeader;
