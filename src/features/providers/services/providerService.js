import api from '../../../services/api';

export const getProviders = async () => {
    const response = await api.get('/proveedores');
    return response.data;
};

export const getProviderById = async (id) => {
    const response = await api.get(`/proveedores/${id}`);
    return response.data;
};

export const createProvider = async (providerData) => {
    const response = await api.post('/proveedores', providerData);
    return response.data;
};

export const updateProvider = async (id, providerData) => {
    const response = await api.put(`/proveedores/${id}`, providerData);
    return response.data;
};

export const deleteProvider = async (id) => {
    const response = await api.delete(`/proveedores/${id}`);
    return response.data;
};

export const toggleProviderStatus = async (id) => {
    console.log('toggleProviderStatus called with id:', id);
    const response = await api.put(`/proveedores/${id}/toggle`);
    return response.data;
};
