import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ErrorBoundary, { RouteErrorBoundary } from './ErrorBoundary';
import { MemoryRouter } from 'react-router-dom';

const ThrowError = () => {
    throw new Error('Test Error');
};

const SafeComponent = () => <div>Safe Content</div>;

describe('ErrorBoundary Component', () => {
    beforeEach(() => {
        // Suppress console.error for expected errors
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <SafeComponent />
            </ErrorBoundary>
        );
        expect(screen.getByText('Safe Content')).toBeInTheDocument();
    });

    it('renders error UI when child throws', () => {
        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        expect(screen.getByText('Xəta Baş Verdi')).toBeInTheDocument();
        expect(screen.getByText('Yenidən Cəhd Et')).toBeInTheDocument();
    });

    it('allows retry via Yinidən Cəhd Et button', () => {
        const { getByText, rerender } = render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );

        expect(screen.getByText('Xəta Baş Verdi')).toBeInTheDocument();

        // Rerender with safe component
        rerender(
            <ErrorBoundary>
                <SafeComponent />
            </ErrorBoundary>
        );

        // Click retry
        fireEvent.click(getByText('Yenidən Cəhd Et'));

        // Should now show safe content
        expect(screen.getByText('Safe Content')).toBeInTheDocument();
    });

    it('RouteErrorBoundary works within Router', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <RouteErrorBoundary>
                    <ThrowError />
                </RouteErrorBoundary>
            </MemoryRouter>
        );

        expect(screen.getByText('Xəta Baş Verdi')).toBeInTheDocument();
    });
});
