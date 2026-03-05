import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { useBusiness } from '../context/BusinessContext';
import useAuthStore from '../store/useAuthStore';
import { useQuery } from '@tanstack/react-query';

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
    useQuery: vi.fn()
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: React.forwardRef((props, ref) => {
            const { initial, animate, transition, ...rest } = props;
            return <div ref={ref} {...rest} />;
        }),
        button: React.forwardRef((props, ref) => {
            const { initial, animate, transition, whileHover, whileTap, ...rest } = props;
            return <button ref={ref} {...rest} />;
        })
    }
}));

// Mock recharts
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    ComposedChart: () => <div data-testid="composed-chart" />,
    AreaChart: () => null,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Bar: () => null,
    CartesianGrid: () => null
}));

// Mock CountUp
vi.mock('../components/CountUp', () => ({
    default: ({ to }) => <span data-testid="countup">{to}</span>
}));

// Mock TopProductsChart
vi.mock('../components/TopProductsChart', () => ({
    default: () => <div data-testid="top-products-chart" />
}));

// Mock context
vi.mock('../context/BusinessContext', () => ({
    useBusiness: vi.fn()
}));

// Mock clientApi
vi.mock('../api/client', () => ({
    default: { get: vi.fn() }
}));

describe('Dashboard Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default auth store
        useAuthStore.setState({ user: { id: 1, first_name: 'TestUser', email: 'test@example.com' } });

        // Setup default queries: invoices, expenses are paginated {results:[]}, payments are not []
        useQuery.mockImplementation(({ queryKey }) => {
            const key = queryKey[0];
            if (key === 'payments') return { data: [], isLoading: false, isError: false };
            return { data: { results: [] }, isLoading: false, isError: false };
        });
    });

    const renderDashboard = () => {
        return render(
            <MemoryRouter>
                <Dashboard />
            </MemoryRouter>
        );
    };

    it('shows loading state initially if queries are loading', () => {
        useBusiness.mockReturnValue({ activeBusiness: { id: 1, user_role: 'OWNER' } });
        useQuery.mockReturnValue({ isLoading: true });

        const { container } = renderDashboard();

        // Dashboard uses a generic loader with a Clock icon when isLoading is true
        expect(container.querySelector('.h-full.flex.items-center.justify-center')).toBeInTheDocument();
    });

    it('shows business creation prompt when no active business', () => {
        useBusiness.mockReturnValue({ activeBusiness: null });

        renderDashboard();

        expect(screen.getByText('Biznes Profili Yarat')).toBeInTheDocument();
        expect(screen.getByText('Xoş Gəlmisiniz! 🚀')).toBeInTheDocument();
    });

    it('renders dashboard with stats for OWNER', () => {
        useBusiness.mockReturnValue({ activeBusiness: { id: 1, user_role: 'OWNER' } });

        useQuery.mockImplementation(({ queryKey }) => {
            const key = queryKey[0];
            if (key === 'invoices') return { data: { results: [{ total: '1500', status: 'paid' }] }, isLoading: false };
            if (key === 'inventory-stats') return { data: { total_products: 42, total_value: 3000 }, isLoading: false };
            if (key === 'payments') return { data: [], isLoading: false };
            return { data: { results: [] }, isLoading: false };
        });

        renderDashboard();

        expect(screen.getByText(/TestUser/i)).toBeInTheDocument(); // Greeting
        expect(screen.getByText('Anbar Dəyəri')).toBeInTheDocument();
        expect(screen.getByText('Ümumi Gəlir')).toBeInTheDocument();
        expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
        expect(screen.getByTestId('top-products-chart')).toBeInTheDocument();
    });

    it('renders pipeline layout for SALES_REP', () => {
        useBusiness.mockReturnValue({ activeBusiness: { id: 1, user_role: 'SALES_REP' } });

        useQuery.mockImplementation(({ queryKey }) => {
            const key = queryKey[0];
            if (key === 'team-info') return { data: { monthly_target: '5000' }, isLoading: false };
            if (key === 'invoices') return { data: { results: [{ total: '500', status: 'sent' }] }, isLoading: false };
            if (key === 'payments') return { data: [], isLoading: false };
            return { data: { results: [] }, isLoading: false };
        });

        renderDashboard();

        expect(screen.getByText('Sizin Satış')).toBeInTheDocument();
        expect(screen.getByText('Satış Tuneli (Pipeline)')).toBeInTheDocument();
        expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument(); // Sales reps shouldn't see company financial chart
    });
});
