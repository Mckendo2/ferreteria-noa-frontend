import api from '../../../services/api';

// ==========================================
// EXPENSE CATEGORIES
// ==========================================

export const getExpenseCategories = async () => {
    const response = await api.get('/gastos/categorias');
    return Array.isArray(response.data) ? response.data : [];
};

export const createExpenseCategory = async (data) => {
    const response = await api.post('/gastos/categorias', data);
    return response.data;
};

// ==========================================
// EXPENSES
// ==========================================

export const getExpenses = async () => {
    const response = await api.get('/gastos');
    return Array.isArray(response.data) ? response.data : [];
};

export const createExpense = async (data) => {
    const response = await api.post('/gastos', data);
    return response.data;
};

export const deleteExpense = async (id) => {
    const response = await api.delete(`/gastos/${id}`);
    return response.data;
};
