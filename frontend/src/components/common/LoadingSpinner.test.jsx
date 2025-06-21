import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders with the default message and size', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    const spinnerContainer = screen.getByText('Loading...').previousSibling;
    expect(spinnerContainer).toHaveClass('loading-spinner medium');
  });

  it('renders with a custom message', () => {
    const customMessage = 'Fetching your data, please wait...';
    render(<LoadingSpinner message={customMessage} />);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('renders with a custom size (large)', () => {
    render(<LoadingSpinner size="large" />);
    const spinnerContainer = screen.getByText('Loading...').previousSibling;
    expect(spinnerContainer).toHaveClass('loading-spinner large');
  });

  it('renders with a custom size (small)', () => {
    render(<LoadingSpinner size="small" />);
    const spinnerContainer = screen.getByText('Loading...').previousSibling;
    expect(spinnerContainer).toHaveClass('loading-spinner small');
  });
});