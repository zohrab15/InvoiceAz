import { useQuery } from '@tanstack/react-query';
import clientApi from '../api/client';
import useAuthStore from '../store/useAuthStore';
import { useBusiness } from '../context/BusinessContext';

export const usePlanLimits = () => {
    const { token, user } = useAuthStore();
    const { activeBusiness } = useBusiness();

    const { data: planStatus, isLoading } = useQuery({
        queryKey: ['planStatus', user?.id, activeBusiness?.id],
        queryFn: async () => {
            const params = activeBusiness?.id ? { business_id: activeBusiness.id } : {};
            const res = await clientApi.get('/users/plan/status/', { params });
            return res.data;
        },
        enabled: !!token,
        staleTime: 1000 * 30, // Cache for 30 seconds
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
            case 'products':
                limit = limits.products;
                current = usage.products;
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
            case 'custom_themes':
                return !planStatus.limits.custom_themes;
            default:
                return false;
        }
    };

    const isDemo = useAuthStore.getState().user?.email === 'demo_user@invoice.az';

    return {
        plan: isDemo ? 'pro' : (planStatus?.plan || 'free'),
        limits: planStatus?.limits,
        usage: planStatus?.usage,
        isLoading,
        checkLimit: (resource) => {
            if (isDemo) return { allowed: true, limit: null, current: 0 };
            return checkLimit(resource);
        },
        isFeatureLocked: (feature) => {
            if (isDemo) return false;
            return isFeatureLocked(feature);
        },
        isPro: isDemo || ['pro', 'premium'].includes(planStatus?.plan),
        canUseThemes: isDemo || planStatus?.limits?.custom_themes
    };
};

export default usePlanLimits;
