import api from '../../../services/api';

export const getProducts = async () => {
    const response = await api.get('/productos');
    return Array.isArray(response.data) ? response.data : [];
};

export const getProductById = async (id) => {
    const response = await api.get(`/productos/${id}`);
    return response.data;
};

export const createProduct = async (formData) => {
    const response = await api.post('/productos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateProduct = async (id, formData) => {
    const response = await api.put(`/productos/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
};

export const importInventory = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/import/inventory', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};
