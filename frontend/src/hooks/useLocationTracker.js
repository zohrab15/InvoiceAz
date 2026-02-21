import { useEffect, useRef } from 'react';
import useAuthStore from '../store/useAuthStore';
import client from '../api/client';

const useLocationTracker = () => {
    const { token, user } = useAuthStore();
    const intervalRef = useRef(null);

    useEffect(() => {
        // Track only if user is logged in
        if (!token || !user) {
            stopTracking();
            return;
        }

        // Check if user is a team member (not OWNER)
        // Usually, the dashboard fetches activeBusiness, but at the App context, 
        // we might not have it loaded if it's the first render.
        // Let's rely on the activeBusiness from localStorage for an immediate check
        const activeBusinessRaw = localStorage.getItem('active_business');
        let isOwner = false;

        if (activeBusinessRaw) {
            try {
                const activeBusiness = JSON.parse(activeBusinessRaw);
                // If it's an owner, or user_role is empty (which defaults to owner for direct businesses)
                if (!activeBusiness.user_role || activeBusiness.user_role === 'OWNER') {
                    isOwner = true;
                }
            } catch (e) {
                // Parse error, ignore
            }
        }

        if (isOwner) {
            // Do not track owners
            return;
        }

        if (!navigator.geolocation) {
            console.warn('Geolocation is not supported by your browser');
            return;
        }

        // Initial quick check immediately after login/mount
        sendLocation();

        // Set up 10-minute interval (600,000 milliseconds)
        const TEN_MINUTES = 10 * 60 * 1000;
        intervalRef.current = setInterval(sendLocation, TEN_MINUTES);

        return () => stopTracking();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, user]);

    const sendLocation = () => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Send to backend
                    await client.post('/users/team/location/', {
                        latitude,
                        longitude
                    });
                } catch (error) {
                    // Ignore 403 Forbidden silently. It means the user is not a team member
                    // or doesn't have the correct roles to be tracked.
                    if (error.response && error.response.status !== 403) {
                        console.error('Failed to send location update:', error);
                    }
                }
            },
            (error) => {
                // If user denies permission, or position is unavailable
                console.warn('Geolocation error:', error.message);
                // We don't automatically stop the interval because the user 
                // might grant permission later or move to an area with better signal.
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    };

    const stopTracking = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    return null; // This hook doesn't render anything
};

export default useLocationTracker;
