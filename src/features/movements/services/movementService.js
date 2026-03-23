import api from '../../../services/api';

export const getMovements = async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.date) params.append('date', filters.date);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.year) params.append('year', filters.year);
    if (filters.month) params.append('month', filters.month);

    const response = await api.get(`/movimientos?${params.toString()}`);
    return response.data;
};
