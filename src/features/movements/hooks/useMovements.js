import { useState, useEffect, useCallback } from 'react';
import { getMovements } from '../services/movementService';

const useMovements = () => {
    const [movements, setMovements] = useState([]);
    const [balance, setBalance] = useState(0);
    const [totalVentas, setTotalVentas] = useState(0);
    const [totalGastos, setTotalGastos] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activePeriod, setActivePeriod] = useState('');
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });
    const [endDate, setEndDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });

    const fetchMovements = useCallback(async () => {
        setLoading(true);
        try {
            const filters = {};

            if (startDate && endDate) {
                filters.startDate = startDate;
                filters.endDate = endDate;
            } else if (activePeriod) {
                filters.period = activePeriod;
            }

            const data = await getMovements(filters);
            setBalance(data.balance || 0);
            setTotalVentas(data.totalVentas || 0);
            setTotalGastos(data.totalGastos || 0);
            setMovements(data.movements || []);
        } catch (error) {
            console.error('Error fetching movements:', error);
        } finally {
            setLoading(false);
        }
    }, [activePeriod, startDate, endDate]);

    useEffect(() => {
        fetchMovements();
    }, [fetchMovements]);

    const setPeriod = useCallback((period) => {
        setStartDate('');
        setEndDate('');
        setActivePeriod(period);
    }, []);

    const setRange = useCallback((start, end) => {
        setActivePeriod('');
        setStartDate(start);
        setEndDate(end);
    }, []);

    return {
        movements,
        balance,
        totalVentas,
        totalGastos,
        loading,
        activePeriod,
        startDate,
        endDate,
        setPeriod,
        setRange,
        refetch: fetchMovements,
    };
};

export default useMovements;
