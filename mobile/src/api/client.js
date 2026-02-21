import axios from 'axios';
import { getItem, deleteItem } from '../utils/storage';

// Replace with your computer's local IP address (e.g., 192.168.1.10) when testing on a physical device.
// Use 10.0.2.2 for Android Emulator connecting to localhost.
export const BASE_URL = 'http://10.0.2.2:8000/api';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        const token = await getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Optional: Implement refresh token logic here if the backend supports it.
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            console.warn('Unauthorized. Logging out...');
            await deleteItem('access_token');
            await deleteItem('refresh_token');
            // Ideally, trigger context logout
        }

        return Promise.reject(error);
    }
);

export default apiClient;
