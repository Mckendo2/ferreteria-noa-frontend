import api from '../../../services/api';

export const getCategories = async () => {
    const response = await api.get('/categorias');
    return Array.isArray(response.data) ? response.data : [];
};

export const createCategory = async (data) => {
    const response = await api.post('/categorias', data);
    return response.data;
};

export const updateCategory = async (id, data) => {
    const response = await api.put(`/categorias/${id}`, data);
    return response.data;
};

export const deleteCategory = async (id) => {
    const response = await api.delete(`/categorias/${id}`);
    return response.data;
};

export const toggleCategoryStatus = async (id) => {
    console.log('toggleCategoryStatus called with id:', id);
    const response = await api.put(`/categorias/${id}/toggle`);
    return response.data;
};
