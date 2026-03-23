import api from '../../../services/api';

export const getStats = async (startDate, endDate) => {
    let url = '/dashboard/stats';
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await api.get(url);
    return response.data;
};
