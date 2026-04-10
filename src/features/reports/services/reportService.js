import api from '../../../services/api';

const reportService = {
    getSales: async (startDate, endDate) => {
        const response = await api.get('/reportes/sales', {
            params: { startDate, endDate }
        });
        return response.data;
    },

    getLowStock: async () => {
        const response = await api.get('/reportes/low-stock');
        return response.data;
    },

    getInventoryValue: async () => {
        const response = await api.get('/reportes/inventory-value');
        return response.data;
    },

    getCredits: async () => {
        const response = await api.get('/reportes/credits');
        return response.data;
    },

    getExpensesPurchases: async (startDate, endDate) => {
        const response = await api.get('/reportes/expenses-purchases', {
            params: { startDate, endDate }
        });
        return response.data;
    },

    getTopProducts: async (startDate, endDate, limit = 10) => {
        const response = await api.get('/reportes/top-products', {
            params: { startDate, endDate, limit }
        });
        return response.data;
    },

    getTopCustomers: async (startDate, endDate, limit = 10) => {
        const response = await api.get('/reportes/top-customers', {
            params: { startDate, endDate, limit }
        });
        return response.data;
    }
};

export default reportService;
