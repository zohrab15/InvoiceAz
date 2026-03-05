import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CountUp from './CountUp';

vi.mock('framer-motion', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        animate: (from, to, options) => {
            options.onUpdate(to);
            return { stop: vi.fn() };
        }
    };
});

describe('CountUp Component', () => {
    it('renders and instantly animates to the target value', () => {
        render(<CountUp to={100} duration={1} />);
        expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('formats with decimals', () => {
        render(<CountUp to={100.55} duration={1} decimals={2} />);
        expect(screen.getByText('100,55')).toBeInTheDocument(); // az-AZ locale uses comma
    });

    it('adds prefix and suffix correctly', () => {
        render(<CountUp to={50} duration={1} prefix="$" suffix="k" />);
        expect(screen.getByText('$50k')).toBeInTheDocument();
    });
});
