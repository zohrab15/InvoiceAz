import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';

const TestComponent = () => {
    const navigate = useNavigate();
    return (
        <div>
            <button onClick={() => navigate('/other')}>Go</button>
        </div>
    );
};

describe('ScrollToTop Component', () => {
    beforeEach(() => {
        window.scrollTo = vi.fn();
    });

    it('scrolls to top when pathname changes', async () => {
        const { getByText } = render(
            <MemoryRouter initialEntries={['/']}>
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<TestComponent />} />
                    <Route path="/other" element={<div>Other</div>} />
                </Routes>
            </MemoryRouter>
        );

        // Initial render triggers it once
        expect(window.scrollTo).toHaveBeenCalledWith({
            top: 0,
            left: 0,
            behavior: 'instant'
        });

        const initialCount = window.scrollTo.mock.calls.length;

        // Navigate
        const button = getByText('Go');
        fireEvent.click(button);

        // Should trigger again
        await waitFor(() => {
            expect(window.scrollTo.mock.calls.length).toBeGreaterThan(initialCount);
        });
    });
});
