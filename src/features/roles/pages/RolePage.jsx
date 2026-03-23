// src/features/roles/pages/RolePage.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Shield, CheckCircle, XCircle } from 'lucide-react';
import roleService from '../services/roleService';
import Swal from 'sweetalert2';
import RoleModal from '../components/RoleModal';
import RolePermissionsModal from '../components/RolePermissionsModal';
import PageHeader from '../../../components/ui/PageHeader';

const RolePage = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [permissionsRole, setPermissionsRole] = useState(null);
    const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const data = await roleService.getAll();
            setRoles(data);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron cargar los roles',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleOpenCreate = () => {
        setEditingRole(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (role) => {
        setEditingRole(role);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
    };

    const handleManagePermissions = (role) => {
        setPermissionsRole(role);
        setIsPermissionsModalOpen(true);
    };

    const handleDesactivar = async (id, nombre) => {
        const result = await Swal.fire({
            title: '¿Desactivar rol?',
            text: `¿Estás seguro de desactivar el rol "${nombre}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'my-swal-bg' }
        });

        if (result.isConfirmed) {
            try {
                await roleService.desactivar(id);
                Swal.fire({
                    title: 'Desactivado',
                    text: 'Rol desactivado correctamente',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-bg' }
                });
                fetchRoles();
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'Error al desactivar',
                    icon: 'error',
                    confirmButtonColor: '#d33',
                    customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
                });
            }
        }
    };

    const handleActivar = async (id, nombre) => {
        const result = await Swal.fire({
            title: '¿Activar rol?',
            text: `¿Estás seguro de activar el rol "${nombre}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, activar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'my-swal-bg' }
        });

        if (result.isConfirmed) {
            try {
                await roleService.activar(id);
                Swal.fire({
                    title: 'Activado',
                    text: 'Rol activado correctamente',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-bg' }
                });
                fetchRoles();
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: error.message || 'Error al activar',
                    icon: 'error',
                    confirmButtonColor: '#d33',
                    customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
                });
            }
        }
    };

    const getRoleBadgeColor = (roleName) => {
        switch (roleName?.toLowerCase()) {
            case 'administrador': return { bg: 'rgba(0,112,243,0.15)', color: '#0070F3', border: 'rgba(0,112,243,0.3)' };
            case 'vendedor': return { bg: 'rgba(0,200,83,0.15)', color: '#00C853', border: 'rgba(0,200,83,0.3)' };
            case 'almacén': return { bg: 'rgba(255,170,0,0.15)', color: '#FFAA00', border: 'rgba(255,170,0,0.3)' };
            case 'cliente': return { bg: 'rgba(156,39,176,0.15)', color: '#9C27B0', border: 'rgba(156,39,176,0.3)' };
            default: return { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'var(--border-light)' };
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('es-BO', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

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
                title="Gestión de Roles"
                actionLabel="Nuevo Rol"
                actionIcon={Plus}
                onAction={handleOpenCreate}
            />

            <div className="filters-bar" style={{ marginBottom: '2rem' }}>
                {/* Puedes agregar SearchBar aquí si lo deseas */}
            </div>

            <div className="table-responsive page-transition-enter-active">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>ID</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Estado</th>
                            <th>Creado</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.length > 0 ? (
                            roles.map(role => {
                                const rolColors = getRoleBadgeColor(role.nombre);
                                return (
                                    <tr key={role.id}>
                                        <td>
                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                                                {role.id}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    background: rolColors.bg,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.8rem', fontWeight: 600, color: rolColors.color, flexShrink: 0,
                                                    border: `1px solid ${rolColors.border}`
                                                }}>
                                                    {role.nombre?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                {role.nombre}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>
                                            {role.descripcion || <span style={{ opacity: 0.5 }}>Sin descripción</span>}
                                        </td>
                                        <td>
                                            {role.activo ? (
                                                <span className="badge success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <CheckCircle size={12} /> Activo
                                                </span>
                                            ) : (
                                                <button 
                                                    className="badge danger" 
                                                    onClick={() => handleActivar(role.id, role.nombre)}
                                                    style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '4px', 
                                                        cursor: 'pointer', 
                                                        border: 'none',
                                                        outline: 'none',
                                                        transition: 'transform 0.1s ease'
                                                    }}
                                                    title="Haga clic para activar"
                                                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                                                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <XCircle size={12} /> Inactivo
                                                </button>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {formatDate(role.created_at)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                {/* Botón Gestionar Permisos */}
                                                <button
                                                    className="icon-btn"
                                                    title="Gestionar Permisos"
                                                    onClick={() => handleManagePermissions(role)}
                                                    style={{ color: '#0070F3' }}
                                                >
                                                    <Shield size={16} />
                                                </button>

                                                {/* Botón Editar */}
                                                <button
                                                    className="icon-btn"
                                                    title="Editar"
                                                    onClick={() => handleOpenEdit(role)}
                                                >
                                                    <Edit size={16} />
                                                </button>

                                                {/* Botón Desactivar/Activar */}
                                                {role.activo ? (
                                                    role.id === 1 ? (
                                                        <button
                                                            className="icon-btn"
                                                            title="Rol Principal Protegido"
                                                            style={{ color: 'var(--text-secondary)', opacity: 0.5, cursor: 'not-allowed' }}
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="icon-btn"
                                                            title="Desactivar"
                                                            onClick={() => handleDesactivar(role.id, role.nombre)}
                                                            style={{ color: '#f39c12' }}
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    )
                                                ) : (
                                                    <button
                                                        className="icon-btn"
                                                        title="Activar"
                                                        onClick={() => handleActivar(role.id, role.nombre)}
                                                        style={{ color: '#27ae60' }}
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No se encontraron roles.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <RoleModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={fetchRoles}
                role={editingRole}
            />

            <RolePermissionsModal
                isOpen={isPermissionsModalOpen}
                onClose={() => setIsPermissionsModalOpen(false)}
                role={permissionsRole}
            />
        </div>
    );
};

export default RolePage;