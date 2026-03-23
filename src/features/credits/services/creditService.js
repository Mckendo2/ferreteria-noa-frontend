import api from '../../../services/api';

export const getCredits = async (status = 'todo', filters = {}) => {
    const params = new URLSearchParams({ status });
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/creditos?${params.toString()}`);
    return response.data;
};

export const getCreditPayments = async (creditoId) => {
    const response = await api.get(`/creditos/${creditoId}/pagos`);
    return response.data;
};

export const addCreditPayment = async (creditoId, paymentData) => {
    const response = await api.post(`/creditos/${creditoId}/pagos`, paymentData);
    return response.data;
};
