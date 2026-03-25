import axios from 'axios';

const getRawURL = () => {
    return import.meta.env.VITE_API_URL || 'https://api.ferreterianoa.com';
};

const rawURL = getRawURL();
// Remove trailing slash and /api suffix to get the root URL for images
export const BASE_URL = rawURL.replace(/\/api\/?$/, '').replace(/\/$/, '');
export const API_URL = `${BASE_URL}/api`;

const api = axios.create({
    baseURL: API_URL,
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
