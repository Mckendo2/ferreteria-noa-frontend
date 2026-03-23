import api from '../../../services/api';

export const getAvailableProducts = async () => {
    const response = await api.get('/ventas/productos-disponibles');
    return Array.isArray(response.data) ? response.data : [];
};

export const createSale = async (saleData) => {
    const response = await api.post('/ventas', saleData);
    return response.data;
};

export const getSales = async () => {
    const response = await api.get('/ventas');
    return Array.isArray(response.data) ? response.data : [];
};

export const getSaleById = async (id) => {
    const response = await api.get(`/ventas/${id}`);
    return response.data;
};

export const updateSale = async (id, saleData) => {
    const response = await api.put(`/ventas/${id}`, saleData);
    return response.data;
};
