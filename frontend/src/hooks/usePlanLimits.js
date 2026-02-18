import { useQuery } from '@tanstack/react-query';
import clientApi from '../api/client';
import useAuthStore from '../store/useAuthStore';

export const usePlanLimits = () => {
    const { token } = useAuthStore();

    const { data: planStatus, isLoading } = useQuery({
        queryKey: ['planStatus'],
        queryFn: async () => {
            const res = await clientApi.get('/users/plan/status/');
            return res.data;
        },
        enabled: !!token,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const checkLimit = (resource) => {
        if (!planStatus) return { allowed: true, limit: null, current: 0 };

        const limits = planStatus.limits;
        const usage = planStatus.usage;

        let limit = null;
        let current = 0;

        switch (resource) {
            case 'invoices':
                limit = limits.invoices_per_month;
                current = usage.invoices_this_month;
                break;
            case 'clients':
                limit = limits.clients;
                current = usage.clients;
                break;
            case 'expenses':
                limit = limits.expenses_per_month;
                current = usage.expenses_this_month;
                break;
            case 'businesses':
                limit = limits.businesses;
                current = usage.businesses;
                break;
            default:
                return { allowed: true, limit: null, current: 0 };
        }

        // If limit is null, it means unlimited
        if (limit === null) return { allowed: true, limit: null, current };

        return {
            allowed: current < limit,
            limit,
            current,
            remaining: limit - current
        };
    };

    const isFeatureLocked = (feature) => {
        if (!planStatus) return false;

        switch (feature) {
            case 'forecast':
                return !planStatus.limits.forecast_analytics;
            case 'csv_export':
                return !planStatus.limits.csv_export;
            case 'premium_pdf':
                return !planStatus.limits.premium_pdf;
            default:
                return false;
        }
    };

    return {
        plan: planStatus?.plan || 'free',
        limits: planStatus?.limits,
        usage: planStatus?.usage,
        isLoading,
        checkLimit,
        isFeatureLocked,
        isPro: ['pro', 'premium'].includes(planStatus?.plan)
    };
};

export default usePlanLimits;
