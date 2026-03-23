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
        logout();
    }, []); // Run only once on mount



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
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Iniciar Sesión</h2>
                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="tu@email.com"
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Contraseña</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="********"
                        required 
                    />
                </div>
                <button type="submit">Entrar</button>
            </form>
        </div>
    );
};

export default LoginPage;
