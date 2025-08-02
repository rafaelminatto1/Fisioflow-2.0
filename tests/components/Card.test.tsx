import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import Card from '../../components/ui/Card';

describe('Card Component', () => {
  it('should render with default props', () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>
    );
    
    const card = screen.getByText('Card content').parentElement;
    expect(card).toHaveClass('rounded-lg', 'bg-white', 'border', 'border-gray-200', 'p-4');
  });

  it('should render with default variant', () => {
    render(
      <Card variant="default">
        <div>Default card</div>
      </Card>
    );
    
    const card = screen.getByText('Default card').parentElement;
    expect(card).toHaveClass('bg-white', 'border', 'border-gray-200');
  });

  it('should render with outlined variant', () => {
    render(
      <Card variant="outlined">
        <div>Outlined card</div>
      </Card>
    );
    
    const card = screen.getByText('Outlined card').parentElement;
    expect(card).toHaveClass('bg-white', 'border-2', 'border-gray-300');
  });

  it('should render with elevated variant', () => {
    render(
      <Card variant="elevated">
        <div>Elevated card</div>
      </Card>
    );
    
    const card = screen.getByText('Elevated card').parentElement;
    expect(card).toHaveClass('bg-white', 'shadow-lg', 'border', 'border-gray-100');
  });

  it('should render with flat variant', () => {
    render(
      <Card variant="flat">
        <div>Flat card</div>
      </Card>
    );
    
    const card = screen.getByText('Flat card').parentElement;
    expect(card).toHaveClass('bg-gray-50');
  });

  it('should render with no padding', () => {
    render(
      <Card padding="none">
        <div>No padding card</div>
      </Card>
    );
    
    const card = screen.getByText('No padding card').parentElement;
    expect(card).not.toHaveClass('p-3', 'p-4', 'p-6');
  });

  it('should render with small padding', () => {
    render(
      <Card padding="sm">
        <div>Small padding card</div>
      </Card>
    );
    
    const card = screen.getByText('Small padding card').parentElement;
    expect(card).toHaveClass('p-3');
  });

  it('should render with medium padding', () => {
    render(
      <Card padding="md">
        <div>Medium padding card</div>
      </Card>
    );
    
    const card = screen.getByText('Medium padding card').parentElement;
    expect(card).toHaveClass('p-4');
  });

  it('should render with large padding', () => {
    render(
      <Card padding="lg">
        <div>Large padding card</div>
      </Card>
    );
    
    const card = screen.getByText('Large padding card').parentElement;
    expect(card).toHaveClass('p-6');
  });

  it('should apply custom className', () => {
    render(
      <Card className="custom-class">
        <div>Custom card</div>
      </Card>
    );
    
    const card = screen.getByText('Custom card').parentElement;
    expect(card).toHaveClass('custom-class');
  });

  it('should render Card.Header with proper styling', () => {
    render(
      <Card>
        <Card.Header>
          <h2>Card Title</h2>
        </Card.Header>
      </Card>
    );
    
    const header = screen.getByText('Card Title').parentElement;
    expect(header).toHaveClass('border-b', 'border-gray-200', 'pb-3', 'mb-4');
  });

  it('should render Card.Body', () => {
    render(
      <Card>
        <Card.Body>
          <p>Card body content</p>
        </Card.Body>
      </Card>
    );
    
    expect(screen.getByText('Card body content')).toBeInTheDocument();
  });

  it('should render Card.Footer with proper styling', () => {
    render(
      <Card>
        <Card.Footer>
          <button>Action</button>
        </Card.Footer>
      </Card>
    );
    
    const footer = screen.getByText('Action').parentElement;
    expect(footer).toHaveClass('border-t', 'border-gray-200', 'pt-3', 'mt-4');
  });

  it('should render complete card with header, body, and footer', () => {
    render(
      <Card>
        <Card.Header>
          <h2>Card Title</h2>
        </Card.Header>
        <Card.Body>
          <p>This is the card body content.</p>
        </Card.Body>
        <Card.Footer>
          <button>Save</button>
          <button>Cancel</button>
        </Card.Footer>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('This is the card body content.')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should apply custom className to Card.Header', () => {
    render(
      <Card>
        <Card.Header className="custom-header">
          <h2>Custom Header</h2>
        </Card.Header>
      </Card>
    );
    
    const header = screen.getByText('Custom Header').parentElement;
    expect(header).toHaveClass('custom-header');
  });

  it('should apply custom className to Card.Body', () => {
    render(
      <Card>
        <Card.Body className="custom-body">
          <p>Custom Body</p>
        </Card.Body>
      </Card>
    );
    
    const body = screen.getByText('Custom Body').parentElement;
    expect(body).toHaveClass('custom-body');
  });

  it('should apply custom className to Card.Footer', () => {
    render(
      <Card>
        <Card.Footer className="custom-footer">
          <button>Custom Footer</button>
        </Card.Footer>
      </Card>
    );
    
    const footer = screen.getByText('Custom Footer').parentElement;
    expect(footer).toHaveClass('custom-footer');
  });

  it('should work with mixed content', () => {
    render(
      <Card variant="elevated" padding="lg">
        <Card.Header>
          <h1>Patient Information</h1>
          <span>ID: 12345</span>
        </Card.Header>
        <Card.Body>
          <div>
            <p>Name: John Doe</p>
            <p>Age: 35</p>
            <p>Condition: Lower back pain</p>
          </div>
        </Card.Body>
        <Card.Footer>
          <div className="flex gap-2">
            <button>Edit</button>
            <button>Delete</button>
          </div>
        </Card.Footer>
      </Card>
    );
    
    expect(screen.getByText('Patient Information')).toBeInTheDocument();
    expect(screen.getByText('ID: 12345')).toBeInTheDocument();
    expect(screen.getByText('Name: John Doe')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});