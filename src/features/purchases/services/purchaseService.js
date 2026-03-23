import api from '../../../services/api';

export const getPurchases = async () => {
    const response = await api.get('/compras');
    return Array.isArray(response.data) ? response.data : [];
};

export const createPurchase = async (purchaseData) => {
    const response = await api.post('/compras', purchaseData);
    return response.data;
};
