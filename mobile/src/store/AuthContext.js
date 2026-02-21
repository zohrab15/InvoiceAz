import React, { createContext, useState, useEffect } from 'react';
import { getItem, saveItem, deleteItem } from '../utils/storage';
import apiClient from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        checkToken();
    }, []);

    const checkToken = async () => {
        try {
            const token = await getItem('access_token');
            if (token) {
                setUserToken(token);
                // Optionally fetch user info here
            }
        } catch (e) {
            console.log('Error restoring token', e);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username, password) => {
        setIsLoading(true);
        try {
            // Endpoint depends on Django configuration
            const response = await apiClient.post('/token/', {
                username,
                password,
            });

            const { access, refresh } = response.data;

            if (access) {
                setUserToken(access);
                await saveItem('access_token', access);
                if (refresh) await saveItem('refresh_token', refresh);
                // await fetchUserInfo();
                return true;
            }
        } catch (error) {
            console.error('Login error', error.response?.data || error);
            throw error;
        } finally {
            setIsLoading(false);
        }
        return false;
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        await deleteItem('access_token');
        await deleteItem('refresh_token');
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
