import api from '../../../services/api';

export const getUsers = async () => {
    const response = await api.get('/usuarios');
    return Array.isArray(response.data) ? response.data : [];
};

export const getUserById = async (id) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
};

export const createUser = async (data) => {
    const response = await api.post('/usuarios', data);
    return response.data;
};

export const updateUser = async (id, data) => {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
};

export const deleteUser = async (id) => {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
};

export const getRoles = async () => {
    const response = await api.get('/usuarios/roles/all');
    return Array.isArray(response.data) ? response.data : [];
};
