import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import clientApi from '../api/client';
import useAuthStore from '../store/useAuthStore';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: React.forwardRef((props, ref) => {
            const { initial, animate, transition, ...rest } = props;
            return <div ref={ref} {...rest} />;
        })
    }
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

// Mock clientApi
vi.mock('../api/client', () => ({
    default: {
        post: vi.fn()
    }
}));

// Mock Toast
const mockShowToast = vi.fn();
vi.mock('../components/Toast', () => ({
    useToast: () => mockShowToast
}));

describe('Login Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset auth store
        useAuthStore.setState({ user: null, token: null });
    });

    const renderLogin = () => {
        return render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );
    };

    it('renders login form correctly', () => {
        renderLogin();
        expect(screen.getByText('Daxil olun')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('ad@domain.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('shows validation errors when fields are empty', () => {
        renderLogin();
        const submitButton = screen.getByText('Giriş et');

        fireEvent.click(submitButton);
        expect(mockShowToast).toHaveBeenCalledWith('E-poçt ünvanını daxil edin', 'error');

        fireEvent.change(screen.getByPlaceholderText('ad@domain.com'), { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);
        expect(mockShowToast).toHaveBeenCalledWith('Şifrəni daxil edin', 'error');
    });

    it('toggles password visibility', () => {
        renderLogin();
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const toggleButton = passwordInput.nextElementSibling;

        expect(passwordInput.type).toBe('password');

        fireEvent.click(toggleButton);
        expect(passwordInput.type).toBe('text');

        fireEvent.click(toggleButton);
        expect(passwordInput.type).toBe('password');
    });

    it('handles successful login', async () => {
        clientApi.post.mockResolvedValueOnce({
            data: { access: 'test_token', user: { email: 'test@example.com' } }
        });

        renderLogin();

        fireEvent.change(screen.getByPlaceholderText('ad@domain.com'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });

        fireEvent.click(screen.getByText('Giriş et'));

        await waitFor(() => {
            expect(clientApi.post).toHaveBeenCalledWith('/auth/login/', {
                email: 'test@example.com',
                password: 'password123'
            });
            expect(mockShowToast).toHaveBeenCalledWith('Xoş gəldiniz!');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });

        // Assert store was updated
        const state = useAuthStore.getState();
        expect(state.token).toBe('test_token');
        expect(state.user.email).toBe('test@example.com');
    });

    it('handles failed login', async () => {
        clientApi.post.mockRejectedValueOnce({
            response: { data: { detail: 'Xəta baş verdi' } }
        });

        renderLogin();

        fireEvent.change(screen.getByPlaceholderText('ad@domain.com'), { target: { value: 'wrong@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });

        fireEvent.click(screen.getByText('Giriş et'));

        await waitFor(() => {
            expect(clientApi.post).toHaveBeenCalled();
            expect(mockShowToast).toHaveBeenCalledWith('Xəta baş verdi', 'error');
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
