import api from '../../../services/api';

const permissionService = {
    getAll: async () => {
        try {
            const response = await api.get('/permisos');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    create: async (data) => {
        try {
            const response = await api.post('/permisos', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    update: async (id, data) => {
        try {
            const response = await api.put(`/permisos/${id}`, data);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    delete: async (id) => {
        try {
            const response = await api.delete(`/permisos/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default permissionService;
