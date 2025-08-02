import React, { createContext, useContext, useState, useCallback } from 'react';

interface ModalState {
  id: string;
  component: React.ReactNode;
  props?: any;
}

interface ModalContextType {
  modals: ModalState[];
  openModal: (id: string, component: React.ReactNode, props?: any) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  isModalOpen: (id: string) => boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: React.ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modals, setModals] = useState<ModalState[]>([]);

  const openModal = useCallback((id: string, component: React.ReactNode, props?: any) => {
    setModals(prev => {
      // Remove existing modal with same id if it exists
      const filtered = prev.filter(modal => modal.id !== id);
      return [...filtered, { id, component, props }];
    });
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  const isModalOpen = useCallback((id: string) => {
    return modals.some(modal => modal.id === id);
  }, [modals]);

  const value: ModalContextType = {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      {/* Render all active modals */}
      {modals.map(modal => (
        <div key={modal.id}>
          {modal.component}
        </div>
      ))}
    </ModalContext.Provider>
  );
};

export default ModalContext;