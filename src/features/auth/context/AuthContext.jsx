import { createContext, useState, useEffect, useCallback } from 'react';
import { loginUser } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email, password) => {
        const { token, user: userData } = await loginUser(email, password);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    // Check if user has a specific permission by slug
    const hasPermission = (slug) => {
        if (!user) return false;
        // Administrador always has all permissions
        if (user.rol === 'Administrador') return true;
        return user.permisos?.includes(slug) || false;
    };

    const getHomeRoute = (currentUser = user) => {
        if (!currentUser) return '/';
        return '/dashboard';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, hasPermission, getHomeRoute }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
