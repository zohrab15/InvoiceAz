import { describe, it, expect, beforeEach } from 'vitest';
import useAuthStore from './useAuthStore';

// Mock window.location
Object.defineProperty(window, 'location', {
    value: { href: '' },
    writable: true
});

describe('useAuthStore', () => {
    beforeEach(() => {
        // Reset localStorage
        localStorage.clear();

        // Reset store state
        useAuthStore.setState({
            user: null,
            token: null
        });

        // Reset window.location mock
        window.location.href = '';
    });

    it('should initialize with null user and token', () => {
        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
    });

    it('should setAuth properly', () => {
        const testUser = { id: 1, name: 'Test User' };
        const testToken = 'abc123token';

        useAuthStore.getState().setAuth(testUser, testToken);

        const state = useAuthStore.getState();
        expect(state.user).toEqual(testUser);
        expect(state.token).toBe(testToken);
        expect(localStorage.getItem('invoice_token')).toBe(testToken);
    });

    it('should clearAuth properly', () => {
        localStorage.setItem('invoice_token', 'test_token');
        localStorage.setItem('active_business', '1');
        useAuthStore.setState({ user: { id: 1 }, token: 'test_token' });

        useAuthStore.getState().clearAuth();

        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
        expect(localStorage.getItem('invoice_token')).toBeNull();
        expect(localStorage.getItem('active_business')).toBeNull();
    });

    it('should handle logout properly and redirect', () => {
        localStorage.setItem('invoice_token', 'test_token');
        localStorage.setItem('active_business', '1');
        useAuthStore.setState({ user: { id: 1 }, token: 'test_token' });

        useAuthStore.getState().logout();

        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
        expect(localStorage.getItem('invoice_token')).toBeNull();
        expect(localStorage.getItem('active_business')).toBeNull();
        expect(window.location.href).toBe('/');
    });
});
