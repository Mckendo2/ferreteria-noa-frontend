import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import { loginUser } from '../services/authService';

export const AuthContext = createContext();

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutos de inactividad

const parseJwtPayload = (token) => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const inactivityTimerRef = useRef(null);
    const tokenExpiryTimerRef = useRef(null);

    const clearSessionTimers = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
        }
        if (tokenExpiryTimerRef.current) {
            clearTimeout(tokenExpiryTimerRef.current);
            tokenExpiryTimerRef.current = null;
        }
    }, []);

    const handleSessionExpiration = useCallback((message) => {
        logout();
        Swal.fire({
            title: 'Sesión finalizada',
            text: message,
            icon: 'warning',
            confirmButtonText: 'Ir al login',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
        }).then(() => {
            window.location.href = '/login';
        });
    }, [logout]);

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        inactivityTimerRef.current = setTimeout(() => {
            handleSessionExpiration('No ha habido actividad en el sistema durante un tiempo. Por seguridad, vuelve a iniciar sesión.');
        }, INACTIVITY_LIMIT_MS);
    }, [handleSessionExpiration]);

    const scheduleTokenExpiry = useCallback((token) => {
        if (!token) return;
        const payload = parseJwtPayload(token);
        if (!payload?.exp) return;

        const expiresAt = payload.exp * 1000;
        const delay = expiresAt - Date.now();
        if (delay <= 0) {
            handleSessionExpiration('Tu token de acceso ya expiró. Por seguridad, vuelve a iniciar sesión.');
            return;
        }

        tokenExpiryTimerRef.current = setTimeout(() => {
            handleSessionExpiration('Tu sesión expiró. Por seguridad, vuelve a iniciar sesión.');
        }, delay);
    }, [handleSessionExpiration]);

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

    useEffect(() => {
        if (!user) {
            clearSessionTimers();
            return;
        }

        resetInactivityTimer();
        const token = sessionStorage.getItem('token');
        scheduleTokenExpiry(token);

        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
        const activityHandler = () => resetInactivityTimer();

        activityEvents.forEach((event) => window.addEventListener(event, activityHandler));

        return () => {
            activityEvents.forEach((event) => window.removeEventListener(event, activityHandler));
            clearSessionTimers();
        };
    }, [user, resetInactivityTimer, scheduleTokenExpiry, clearSessionTimers]);

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
        clearSessionTimers();
    }, [clearSessionTimers]);

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
