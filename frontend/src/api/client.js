import axios from 'axios';

const client = axios.create({
    baseURL: 'http://localhost:8000/api',
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
