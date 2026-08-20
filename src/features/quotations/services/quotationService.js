import api from '../../../services/api';

export const getQuotations = async () => {
    const response = await api.get('/cotizaciones');
    return Array.isArray(response.data) ? response.data : [];
};

export const getQuotationById = async (id) => {
    const response = await api.get(`/cotizaciones/${id}`);
    return response.data;
};

export const createQuotation = async (data) => {
    const response = await api.post('/cotizaciones', data);
    return response.data;
};

export const cobrarQuotation = async (id, metodo_pago = 'efectivo') => {
    const response = await api.post(`/cotizaciones/${id}/cobrar`, { metodo_pago });
    return response.data;
};

export const anularQuotation = async (id) => {
    const response = await api.delete(`/cotizaciones/${id}`);
    return response.data;
};
