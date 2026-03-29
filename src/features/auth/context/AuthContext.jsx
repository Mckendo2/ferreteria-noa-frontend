import { createContext, useState, useEffect, useCallback } from 'react';
import { loginUser } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        const token = sessionStorage.getItem('token');
        if (storedUser && token && storedUser !== 'undefined') {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing stored user:', error);
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email, password) => {
        const { token, user: userData } = await loginUser(email, password);
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
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
