import React, { createContext, useContext, useState, useEffect } from 'react';
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
            setActiveBusiness(null);
            localStorage.removeItem('active_business');
        } else {
            // Refetch businesses for the new token
            refetch();
        }
    }, [token, refetch]);

    // Auto-select business logic
    useEffect(() => {
        if (!isLoading && businesses) {
            if (activeBusiness) {
                // If we have an active business, validify it against the list
                const found = businesses.find(b => b.id === activeBusiness.id);
                if (found) {
                    // Update data if changed
                    if (JSON.stringify(found) !== JSON.stringify(activeBusiness)) {
                        setActiveBusiness(found);
                        localStorage.setItem('active_business', JSON.stringify(found));
                    }
                } else if (businesses.length > 0) {
                    // Only switch if the list is NOT empty but our business is missing.
                    // If list is empty, it might be a stale cache state where we haven't loaded the new business yet.
                    // However, if we really have 0 businesses, we should clear.
                    // But 'businesses' is the result of useQuery.

                    // Let's assume if the user has businesses, but the active one isn't in it, switch to first.
                    switchBusiness(businesses[0]);
                }
                // If businesses.length === 0, we don't clear activeBusiness immediately to prevent race condition
                // where invalidateQueries clears the list before fetching the new one.
            } else if (businesses.length > 0) {
                // No active business, but we have some
                // Prefer a team business (where user is NOT the owner) over a personal one
                const teamBusiness = businesses.find(b => b.user_role && b.user_role !== 'OWNER');
                switchBusiness(teamBusiness || businesses[0]);
            }
        }
    }, [businesses, isLoading, token]); // Re-run if businesses or token change

    const queryClient = useQueryClient();

    const switchBusiness = (business) => {
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
    };

    const value = {
        businesses,
        activeBusiness,
        switchBusiness,
        isLoading,
        refetchBusinesses: refetch
    };

    return (
        <BusinessContext.Provider value={value}>
            {children}
        </BusinessContext.Provider>
    );
};
