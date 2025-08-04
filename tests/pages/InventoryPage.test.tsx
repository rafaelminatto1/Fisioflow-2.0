import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InventoryPage from '../../pages/InventoryPage';
import { MemoryRouter } from 'react-router-dom';

describe('InventoryPage', () => {
  it('renders the inventory page with a title', () => {
    render(
      <MemoryRouter>
        <InventoryPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Gestão de Inventário')).toBeInTheDocument();
  });
});''