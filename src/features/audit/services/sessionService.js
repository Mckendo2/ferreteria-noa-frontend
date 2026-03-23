import api from '../../../services/api';

export const getSessions = async (filters = {}) => {
    try {
        const response = await api.get('/sesiones', {
            params: {
                search: filters.search,
                startDate: filters.startDate,
                endDate: filters.endDate
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
