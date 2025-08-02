import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { ModalProvider, useModal } from '../../contexts/ModalContext';

// Test component that uses the modal context
const TestComponent: React.FC = () => {
  const { openModal, closeModal, closeAllModals, isModalOpen } = useModal();

  const handleOpenModal = () => {
    openModal('test-modal', <div>Test Modal Content</div>);
  };

  const handleOpenSecondModal = () => {
    openModal('second-modal', <div>Second Modal Content</div>);
  };

  const handleCloseModal = () => {
    closeModal('test-modal');
  };

  const handleCloseAllModals = () => {
    closeAllModals();
  };

  return (
    <div>
      <button onClick={handleOpenModal}>Open Modal</button>
      <button onClick={handleOpenSecondModal}>Open Second Modal</button>
      <button onClick={handleCloseModal}>Close Modal</button>
      <button onClick={handleCloseAllModals}>Close All Modals</button>
      <div>Modal Open: {isModalOpen('test-modal') ? 'Yes' : 'No'}</div>
      <div>Second Modal Open: {isModalOpen('second-modal') ? 'Yes' : 'No'}</div>
    </div>
  );
};

describe('ModalContext', () => {
  it('should throw error when useModal is used outside ModalProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useModal must be used within a ModalProvider');
    
    consoleSpy.mockRestore();
  });

  it('should provide modal context functions', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    expect(screen.getByText('Open Modal')).toBeInTheDocument();
    expect(screen.getByText('Close Modal')).toBeInTheDocument();
    expect(screen.getByText('Close All Modals')).toBeInTheDocument();
    expect(screen.getByText('Modal Open: No')).toBeInTheDocument();
  });

  it('should open and render modal', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    const openButton = screen.getByText('Open Modal');
    fireEvent.click(openButton);

    expect(screen.getByText('Test Modal Content')).toBeInTheDocument();
    expect(screen.getByText('Modal Open: Yes')).toBeInTheDocument();
  });

  it('should close specific modal', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    // Open modal
    const openButton = screen.getByText('Open Modal');
    fireEvent.click(openButton);
    expect(screen.getByText('Test Modal Content')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('Close Modal');
    fireEvent.click(closeButton);
    expect(screen.queryByText('Test Modal Content')).not.toBeInTheDocument();
    expect(screen.getByText('Modal Open: No')).toBeInTheDocument();
  });

  it('should handle multiple modals', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    // Open first modal
    const openButton = screen.getByText('Open Modal');
    fireEvent.click(openButton);
    expect(screen.getByText('Test Modal Content')).toBeInTheDocument();
    expect(screen.getByText('Modal Open: Yes')).toBeInTheDocument();

    // Open second modal
    const openSecondButton = screen.getByText('Open Second Modal');
    fireEvent.click(openSecondButton);
    expect(screen.getByText('Second Modal Content')).toBeInTheDocument();
    expect(screen.getByText('Second Modal Open: Yes')).toBeInTheDocument();

    // Both modals should be open
    expect(screen.getByText('Test Modal Content')).toBeInTheDocument();
    expect(screen.getByText('Second Modal Content')).toBeInTheDocument();
  });

  it('should close all modals', () => {
    render(
      <ModalProvider>
        <TestComponent />
      </ModalProvider>
    );

    // Open both modals
    fireEvent.click(screen.getByText('Open Modal'));
    fireEvent.click(screen.getByText('Open Second Modal'));
    
    expect(screen.getByText('Test Modal Content')).toBeInTheDocument();
    expect(screen.getByText('Second Modal Content')).toBeInTheDocument();

    // Close all modals
    const closeAllButton = screen.getByText('Close All Modals');
    fireEvent.click(closeAllButton);

    expect(screen.queryByText('Test Modal Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Second Modal Content')).not.toBeInTheDocument();
    expect(screen.getByText('Modal Open: No')).toBeInTheDocument();
    expect(screen.getByText('Second Modal Open: No')).toBeInTheDocument();
  });

  it('should replace modal with same id', () => {
    const TestComponentWithReplace: React.FC = () => {
      const { openModal } = useModal();

      const handleOpenModal = () => {
        openModal('test-modal', <div>First Modal Content</div>);
      };

      const handleReplaceModal = () => {
        openModal('test-modal', <div>Replaced Modal Content</div>);
      };

      return (
        <div>
          <button onClick={handleOpenModal}>Open Modal</button>
          <button onClick={handleReplaceModal}>Replace Modal</button>
        </div>
      );
    };

    render(
      <ModalProvider>
        <TestComponentWithReplace />
      </ModalProvider>
    );

    // Open first modal
    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByText('First Modal Content')).toBeInTheDocument();

    // Replace with new content
    fireEvent.click(screen.getByText('Replace Modal'));
    expect(screen.queryByText('First Modal Content')).not.toBeInTheDocument();
    expect(screen.getByText('Replaced Modal Content')).toBeInTheDocument();
  });
});