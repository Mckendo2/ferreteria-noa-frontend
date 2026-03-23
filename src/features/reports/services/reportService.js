import axios from 'axios';

const API_URL = 'http://localhost:5000/api/reportes';

const reportService = {
    getSales: async (startDate, endDate) => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/sales`, {
            params: { startDate, endDate },
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getLowStock: async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/low-stock`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getInventoryValue: async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/inventory-value`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getCredits: async () => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/credits`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getExpensesPurchases: async (startDate, endDate) => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/expenses-purchases`, {
            params: { startDate, endDate },
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getTopProducts: async (startDate, endDate, limit = 10) => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/top-products`, {
            params: { startDate, endDate, limit },
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getTopCustomers: async (startDate, endDate, limit = 10) => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/top-customers`, {
            params: { startDate, endDate, limit },
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default reportService;
