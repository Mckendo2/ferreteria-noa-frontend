import { useState, useEffect, useCallback } from 'react';
import {
    getExpenses,
    createExpense,
    deleteExpense,
    getExpenseCategories,
    createExpenseCategory
} from '../services/expenseService';

const useExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getExpenses();
            setExpenses(data);
        } catch (err) {
            console.error('Error fetching expenses:', err);
            setError('Error al cargar los gastos');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const data = await getExpenseCategories();
            setCategories(data);
        } catch (err) {
            console.error('Error fetching expense categories:', err);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
        fetchCategories();
    }, [fetchExpenses, fetchCategories]);

    const addExpense = useCallback(async (expenseData) => {
        setSaving(true);
        setError(null);
        try {
            await createExpense(expenseData);
            await fetchExpenses();
            return true;
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al registrar el gasto';
            setError(msg);
            return false;
        } finally {
            setSaving(false);
        }
    }, [fetchExpenses]);

    const removeExpense = useCallback(async (id) => {
        try {
            await deleteExpense(id);
            await fetchExpenses();
        } catch (err) {
            console.error('Error deleting expense:', err);
            setError('Error al eliminar el gasto');
        }
    }, [fetchExpenses]);

    const addCategory = useCallback(async (categoryData) => {
        setSaving(true);
        setError(null);
        try {
            const result = await createExpenseCategory(categoryData);
            await fetchCategories();
            return result;
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al crear la categoría';
            setError(msg);
            return null;
        } finally {
            setSaving(false);
        }
    }, [fetchCategories]);

    // Calculate total expenses
    const totalGastos = expenses.reduce((sum, e) => sum + parseFloat(e.monto || 0), 0);

    return {
        expenses,
        categories,
        loading,
        saving,
        error,
        totalGastos,
        addExpense,
        removeExpense,
        addCategory,
        refetch: fetchExpenses,
        clearError: () => setError(null),
    };
};

export default useExpenses;
