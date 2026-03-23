import { useState, useEffect } from 'react';
import { getStats } from '../services/dashboardService';

const useDashboard = (startDate, endDate) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await getStats(startDate, endDate);
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [startDate, endDate]);

    return { stats, loading, refetch: fetchStats };
};

export default useDashboard;
