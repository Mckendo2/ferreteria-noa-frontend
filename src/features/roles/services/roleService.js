// frontend/src/pages/roles/services/roleService.js
import api from '../../../services/api'; // tu instancia de axios configurada

const roleService = {
    // Obtener todos los roles activos
    getAll: async () => {
        try {
            const response = await api.get('/roles');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Obtener roles para selects (solo id y nombre)
    getActivos: async () => {
        try {
            const response = await api.get('/roles/activos');
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Obtener un rol por ID
    getById: async (id) => {
        try {
            const response = await api.get(`/roles/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Crear nuevo rol
    create: async (rolData) => {
        try {
            const response = await api.post('/roles', rolData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Actualizar rol
    update: async (id, rolData) => {
        try {
            const response = await api.put(`/roles/${id}`, rolData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Eliminar rol (soft delete)
    delete: async (id) => {
        try {
            const response = await api.delete(`/roles/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Desactivar rol
    desactivar: async (id) => {
        try {
            const response = await api.patch(`/roles/${id}/desactivar`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Activar rol
    activar: async (id) => {
        try {
            const response = await api.patch(`/roles/${id}/activar`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Obtener permisos de un rol
    getRolePermissions: async (roleId) => {
        try {
            const response = await api.get(`/roles/${roleId}/permisos`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Actualizar permisos de un rol
    updateRolePermissions: async (roleId, permisoIds) => {
        try {
            const response = await api.put(`/roles/${roleId}/permisos`, { permisoIds });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default roleService;