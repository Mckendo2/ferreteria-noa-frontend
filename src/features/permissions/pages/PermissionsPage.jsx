import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import permissionService from '../services/permissionService';
import Swal from 'sweetalert2';
import PageHeader from '../../../components/ui/PageHeader';

const PermissionsPage = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const data = await permissionService.getAll();
            setPermissions(data);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar los permisos',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);



    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('es-BO', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const filteredPermissions = permissions.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="module-container">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="module-container">
            <PageHeader
                title="Gestión de Permisos"
            />

            <div className="filters-bar" style={{ marginBottom: '2rem' }}>
                <div className="search-bar" style={{ flex: 1, position: 'relative', maxWidth: '400px' }}>
                    <input
                        type="text"
                        placeholder="Buscar permisos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>
            </div>

            <div className="table-responsive page-transition-enter-active">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>ID</th>
                            <th>Nombre</th>
                            <th>Slug</th>
                            <th>Descripción</th>
                            <th>Creado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPermissions.length > 0 ? (
                            filteredPermissions.map(perm => (
                                <tr key={perm.id}>
                                    <td>
                                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                                            {perm.id}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%',
                                                background: 'rgba(0, 200, 83, 0.15)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#00C853', flexShrink: 0,
                                                border: '1px solid rgba(0, 200, 83, 0.3)'
                                            }}>
                                                <Key size={14} />
                                            </div>
                                            {perm.nombre}
                                        </div>
                                    </td>
                                    <td>
                                        <code style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            color: 'var(--accent-mint)'
                                        }}>
                                            {perm.slug}
                                        </code>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>
                                        {perm.descripcion || <span style={{ opacity: 0.5 }}>Sin descripción</span>}
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        {formatDate(perm.created_at)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No se encontraron permisos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default PermissionsPage;
