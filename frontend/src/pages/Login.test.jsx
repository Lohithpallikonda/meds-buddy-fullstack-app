import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../utils/AuthContext';
import Login from './Login';

vi.mock('../utils/AuthContext', async () => {
  const actual = await vi.importActual('../utils/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      login: vi.fn().mockResolvedValue({ success: true }),
      isAuthenticated: false,
      isLoading: false,
    }),
  };
});

const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  it('should display required error messages when form is submitted empty', async () => {
    renderWithProviders(<Login />);
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('should display "invalid email" error for a badly formatted email', async () => {
    renderWithProviders(<Login />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Password is required')).not.toBeInTheDocument();
  });

  it('should display password length error if password is too short', async () => {
    renderWithProviders(<Login />);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });
});