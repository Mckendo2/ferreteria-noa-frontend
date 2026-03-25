import axios from 'axios';

const getBaseURL = () => {
    const envUrl = import.meta.env.VITE_API_URL || 'https://api.ferreterianoa.com';
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
};

const api = axios.create({
    baseURL: getBaseURL(),
});

// Debug interceptor for tracing requests in browser console
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('--- API Connection Debug ---');
        console.error('URL Request:', error.config?.url);
        console.error('Full BaseURL:', error.config?.baseURL);
        console.error('Status Code:', error.response?.status);
        console.error('Response Data:', error.response?.data);
        return Promise.reject(error);
    }
);

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
