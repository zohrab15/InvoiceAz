import axios from 'axios';
import { API_URL } from '../config';

const client = axios.create({
    baseURL: `${API_URL}/api`,
    timeout: 60000, // 60 seconds timeout - better for Render cold starts
});

client.interceptors.request.use((config) => {
    const token = localStorage.getItem('invoice_token');
    const activeBusiness = localStorage.getItem('active_business');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (activeBusiness) {
        const business = JSON.parse(activeBusiness);
        if (business && business.id) {
            config.headers['X-Business-ID'] = business.id;
        }
    }

    return config;
});

export default client;
