/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import useAuthStore from '../store/useAuthStore';

const BusinessContext = createContext();

export const useBusiness = () => {
    return useContext(BusinessContext);
};

export const BusinessProvider = ({ children }) => {
    const token = useAuthStore(state => state.token);
    const [activeBusiness, setActiveBusiness] = useState(() => {
        // Restore from localStorage if available
        const saved = localStorage.getItem('active_business');
        return saved ? JSON.parse(saved) : null;
    });

    const { data: businesses, isLoading, refetch } = useQuery({
        queryKey: ['business', token], // Include token in key to force refetch on account change
        queryFn: async () => {
            if (!token) return [];
            const res = await client.get('/users/business/');
            return res.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!token,
    });

    // Clear active business and refetch if token changes
    useEffect(() => {
        if (!token) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveBusiness(null);
            localStorage.removeItem('active_business');
        } else {
            refetch();
        }
    }, [token, refetch]);

    const queryClient = useQueryClient();

    const switchBusiness = useCallback((business) => {
        setActiveBusiness(business);
        if (business) {
            localStorage.setItem('active_business', JSON.stringify(business));
            // CRITICAL: Clear all cached data on switch to prevent cross-business visibility
            // But preserve the business list itself so we don't lose context specific logic
            queryClient.removeQueries({
                predicate: (query) => {
                    // Keep 'business' queries, remove everything else (clients, invoices, etc)
                    return !query.queryKey.includes('business');
                }
            });
        } else {
            localStorage.removeItem('active_business');
        }
    }, [queryClient]);

    // Auto-select business logic
    useEffect(() => {
        if (!isLoading && businesses) {
            if (activeBusiness) {
                // If we have an active business, validify it against the list
                const found = businesses.find(b => b.id === activeBusiness.id);
                if (found) {
                    // Update data if changed
                    if (JSON.stringify(found) !== JSON.stringify(activeBusiness)) {
                        // eslint-disable-next-line react-hooks/set-state-in-effect
                        setActiveBusiness(found);
                        localStorage.setItem('active_business', JSON.stringify(found));
                    }
                } else {
                    // Current active business is NOT in the new list. 
                    // This happens when access is revoked (e.g. removed from team).
                    if (businesses.length > 0) {
                        // Prefer owned business over team membership to avoid showing restricted UI
                        const ownedBusiness = businesses.find(b => b.user_role === 'OWNER');
                        switchBusiness(ownedBusiness || businesses[0]);
                    } else {
                        // No businesses left at all
                        switchBusiness(null);
                    }
                }
                // If businesses.length === 0, we don't clear activeBusiness immediately to prevent race condition
                // where invalidateQueries clears the list before fetching the new one.
            } else if (businesses.length > 0) {
                // No active business, but we have some
                // Prefer owned business over team membership to avoid showing restricted UI
                const ownedBusiness = businesses.find(b => b.user_role === 'OWNER');
                switchBusiness(ownedBusiness || businesses[0]);
            }
        }
    }, [businesses, isLoading, activeBusiness, switchBusiness]); // Added missing deps

    const value = useMemo(() => ({
        businesses,
        activeBusiness,
        switchBusiness,
        isLoading,
        refetchBusinesses: refetch
    }), [businesses, activeBusiness, switchBusiness, isLoading, refetch]);

    return (
        <BusinessContext.Provider value={value}>
            {children}
        </BusinessContext.Provider>
    );
};
