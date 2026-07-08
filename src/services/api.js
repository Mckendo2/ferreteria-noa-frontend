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
    timeout: 60000, // 60 segundos de tiempo de espera
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

        // Si no hay respuesta del servidor (Timeout o Network Error)
        if (!error.response) {
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                error.response = {
                    data: {
                        error: 'El servidor tardó demasiado en responder (Tiempo de espera agotado). Verifica tu conexión o intenta nuevamente.'
                    }
                };
            } else {
                error.response = {
                    data: {
                        error: 'Error de conexión. No se pudo contactar al servidor. Verifica tu conexión a internet.'
                    }
                };
            }
        } else if (error.response.status === 401) {
            // Manejar expiración de credenciales / token inválido
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            
            error.response.data = {
                ...error.response.data,
                error: 'Tu sesión ha expirado por inactividad. Por favor, vuelve a iniciar sesión.'
            };
            
            // Redirigir al login después de un breve momento para que el usuario pueda leer la alerta
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        }

        return Promise.reject(error);
    }
);

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
