import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EquipmentPage from '../../pages/EquipmentPage';
import { MemoryRouter } from 'react-router-dom';

describe('EquipmentPage', () => {
  it('renders the equipment page with a title', () => {
    render(
      <MemoryRouter>
        <EquipmentPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Gestão de Equipamentos')).toBeInTheDocument();
  });
});''