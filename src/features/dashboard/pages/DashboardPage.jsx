import React from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { LayoutDashboard, Users, ShoppingCart, Package } from 'lucide-react';

const DashboardPage = () => {
    const { user } = useAuth();

    return (
        <div className="dashboard-welcome" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '3rem',
                background: 'var(--bg-card)',
                borderRadius: '24px',
                border: '1px solid var(--border-light)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, var(--primary-blue), var(--accent-mint))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem',
                    boxShadow: '0 8px 16px rgba(0, 112, 243, 0.3)'
                }}>
                    <LayoutDashboard size={40} color="white" />
                </div>
                
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    ¡Bienvenido, {user?.nombre || 'Usuario'}!
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: 1.6 }}>
                    Has ingresado correctamente a <strong>Ferretería Noé</strong>. 
                    Utiliza el menú lateral para acceder a los diferentes módulos de administración según tus permisos.
                </p>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1.5rem',
                    marginTop: '2rem'
                }}>
                    <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                        <ShoppingCart size={24} color="var(--primary-blue)" style={{ marginBottom: '0.75rem' }} />
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>Ventas</h3>
                    </div>
                    <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                        <Package size={24} color="var(--accent-mint)" style={{ marginBottom: '0.75rem' }} />
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>Inventario</h3>
                    </div>
                    <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                        <Users size={24} color="var(--accent-amber)" style={{ marginBottom: '0.75rem' }} />
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>Clientes</h3>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
