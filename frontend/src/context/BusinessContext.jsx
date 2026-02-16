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
        if (!isLoading && businesses && businesses.length > 0) {
            // Check if current active business belongs to this account
            const found = activeBusiness ? businesses.find(b => b.id === activeBusiness.id) : null;

            if (!found) {
                // If not found (new account or deleted), pick the first one
                switchBusiness(businesses[0]);
            } else if (JSON.stringify(found) !== JSON.stringify(activeBusiness)) {
                // Update active business if data changed (e.g. name update)
                setActiveBusiness(found);
                localStorage.setItem('active_business', JSON.stringify(found));
            }
        }
    }, [businesses, isLoading, token]); // Re-run if businesses or token change

    const queryClient = useQueryClient();

    const switchBusiness = (business) => {
        setActiveBusiness(business);
        if (business) {
            localStorage.setItem('active_business', JSON.stringify(business));
            // CRITICAL: Clear all cached data on switch to prevent cross-business visibility
            queryClient.clear();
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
