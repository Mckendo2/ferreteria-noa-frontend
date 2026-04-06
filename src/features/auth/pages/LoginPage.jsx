import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, logout, user, getHomeRoute } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate(getHomeRoute(user));
        }
    }, [user, navigate, getHomeRoute]);



    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userData = await login(email, password);
            navigate(getHomeRoute(userData || user));
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Credenciales inválidas',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        }
    };

    return (
        <div className="login-container">
            <div className="login-form-wrapper">
                <form className="login-form" onSubmit={handleSubmit}>
                    <h2>Ferretería NOA</h2>
                    
                    <div className="form-group">
                        <label htmlFor="email">Email Corporativo</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@ejemplo.com"
                            required
                            autoComplete="username"
                            spellCheck="false"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    
                    <button type="submit">Acceder al Panel</button>
                    
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            &copy; {new Date().getFullYear()} Sistema de Gestión Interna
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
