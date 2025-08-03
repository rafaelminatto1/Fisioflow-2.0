
import { render, screen } from '@testing-library/react';
import PatientListPage from './PatientListPage';

describe('PatientListPage', () => {
  it('renders the page header', () => {
    render(<PatientListPage />);
    expect(screen.getByText('Gestão de Pacientes')).toBeInTheDocument();
  });
});
