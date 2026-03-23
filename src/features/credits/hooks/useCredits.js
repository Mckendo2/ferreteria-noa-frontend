import { useState, useCallback } from 'react';
import { getCredits, getCreditPayments, addCreditPayment } from '../services/creditService';

const useCredits = () => {
    const [credits, setCredits] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCredits = useCallback(async (statusFilter = 'todo', startDate = null, endDate = null) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getCredits(statusFilter, { startDate, endDate });
            setCredits(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al obtener créditos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPayments = useCallback(async (creditoId) => {
        setPaymentsLoading(true);
        try {
            const data = await getCreditPayments(creditoId);
            setPayments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setPaymentsLoading(false);
        }
    }, []);

    const registerPayment = async (creditoId, paymentData) => {
        try {
            const result = await addCreditPayment(creditoId, paymentData);
            return result;
        } catch (err) {
            throw new Error(err.response?.data?.error || 'Error al registrar el abono');
        }
    };

    return {
        credits,
        payments,
        loading,
        paymentsLoading,
        error,
        fetchCredits,
        fetchPayments,
        registerPayment
    };
};

export default useCredits;
