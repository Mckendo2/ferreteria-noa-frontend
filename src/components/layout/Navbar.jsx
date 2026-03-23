import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { Bell, Search, Menu, User, Sun, Moon, ChevronDown, LogOut } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const profileMenuRef = useRef(null);

    // Theme state
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [maintenanceAlert, setMaintenanceAlert] = useState(null);
    const notificationRef = useRef(null);

    useEffect(() => {
        // Check local storage or system preference on mount
        const storedTheme = localStorage.getItem('theme');
        
        // Default to LIGHT if no stored theme
        if (storedTheme === 'dark') {
            setIsDarkMode(true);
            document.body.classList.remove('light-mode');
        } else {
            setIsDarkMode(false);
            document.body.classList.add('light-mode');
            if (!storedTheme) localStorage.setItem('theme', 'light');
        }

        // Lógica de alerta de mantenimiento (se activa 1 día antes del día 1 del mes)
        const checkMaintenance = () => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            if (tomorrow.getDate() === 1) {
                setMaintenanceAlert({
                    title: 'Mantenimiento Programado',
                    message: 'Mañana a las 03:00 AM se realizará la limpieza mensual automática de la tabla de auditoría (registros > 30 días).'
                });
            } else {
                setMaintenanceAlert(null);
            }
        };

        checkMaintenance();
        // Revisar cada 12 horas por si el sistema queda abierto mucho tiempo
        const interval = setInterval(checkMaintenance, 1000 * 60 * 60 * 12);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen((currentState) => !currentState);
    };

    const handleLogout = () => {
        setIsProfileMenuOpen(false);
        logout();
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Menu onClick={onToggleSidebar} size={24} style={{ cursor: 'pointer', marginRight: '0.5rem' }} />
                <span>NOA</span>
            </div>

            <div className="search-input-wrapper" style={{ display: 'none' }}>
                <Search />
                <input type="text" placeholder="Buscar..." />
            </div>

            <div className="navbar-user">
                <div className="navbar-actions">
                    <button className="icon-btn" onClick={toggleTheme} title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <div className="notification-wrapper" ref={notificationRef} style={{ position: 'relative' }}>
                        <button className="icon-btn" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
                            <Bell size={18} />
                            {maintenanceAlert && <span className="notification-badge" style={{ backgroundColor: '#ef4444' }}></span>}
                        </button>

                        {isNotificationOpen && (
                            <div className="user-dropdown" style={{ right: 0, width: '280px', padding: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Notificaciones</h4>
                                {maintenanceAlert ? (
                                    <div className="notification-item" style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444' }}>
                                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.8rem', color: '#ef4444' }}>{maintenanceAlert.title}</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', lineHeight: '1.2' }}>{maintenanceAlert.message}</p>
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'gray', textAlign: 'center' }}>No hay notificaciones nuevas</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="user-menu" ref={profileMenuRef}>
                    <button
                        type="button"
                        className="user-profile"
                        onClick={toggleProfileMenu}
                        aria-haspopup="menu"
                        aria-expanded={isProfileMenuOpen}
                        title="Abrir menú de usuario"
                    >
                        <div className="user-avatar">
                            {user?.nombre?.charAt(0).toUpperCase() || <User size={16} />}
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            {user?.nombre}
                        </span>
                        <ChevronDown size={16} className={`user-menu-chevron ${isProfileMenuOpen ? 'open' : ''}`} />
                    </button>

                    {isProfileMenuOpen && (
                        <div className="user-dropdown" role="menu" aria-label="Menú de usuario">
                            <button
                                type="button"
                                className="user-dropdown-item logout"
                                onClick={handleLogout}
                                role="menuitem"
                            >
                                <LogOut size={16} />
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
