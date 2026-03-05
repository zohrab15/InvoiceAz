import React, { useEffect } from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast } from './Toast';

// Mock framer-motion to avoid animation delays
vi.mock('framer-motion', () => {
    const React = require('react');
    return {
        motion: {
            div: React.forwardRef((props, ref) => {
                const { layout, initial, animate, exit, transition, ...rest } = props;
                return <div ref={ref} {...rest} />;
            })
        },
        AnimatePresence: ({ children }) => <>{children}</>
    };
});

// Test component that triggers toasts
const ToastTrigger = ({ message, type }) => {
    const showToast = useToast();

    useEffect(() => {
        if (message) {
            showToast(message, type);
        }
    }, [message, type, showToast]);

    return <div>Trigger Component</div>;
};

describe('Toast Component', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('renders provider without crashing', () => {
        render(
            <ToastProvider>
                <div>Child Content</div>
            </ToastProvider>
        );
        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('shows a toast message when requested', () => {
        render(
            <ToastProvider>
                <ToastTrigger message="Success Message" type="success" />
            </ToastProvider>
        );

        expect(screen.getByText('Success Message')).toBeInTheDocument();
    });

    it('removes toast after timeout', () => {
        render(
            <ToastProvider>
                <ToastTrigger message="Auto Remove Me" type="success" />
            </ToastProvider>
        );

        expect(screen.getByText('Auto Remove Me')).toBeInTheDocument();

        // Fast forward time by 4 seconds (timeout is 3.5s)
        act(() => {
            vi.advanceTimersByTime(4000);
        });

        expect(screen.queryByText('Auto Remove Me')).not.toBeInTheDocument();
    });
});
