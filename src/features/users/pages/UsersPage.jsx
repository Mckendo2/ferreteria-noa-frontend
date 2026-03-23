import React, { useState } from 'react';
import Select from 'react-select';
import { Plus, Edit, Trash2, Shield, UserCheck, UserX, RefreshCw } from 'lucide-react';
import useUsers from '../hooks/useUsers';
import UserModal from '../components/UserModal';
import PageHeader from '../../../components/ui/PageHeader';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';

const UsersPage = () => {
    const {
        users,
        allUsers,
        roles,
        searchTerm,
        setSearchTerm,
        selectedRole,
        setSelectedRole,
        currentPage,
        setCurrentPage,
        totalPages,
        handleDelete,
        handleUpdate,
        fetchUsers,
    } = useUsers();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const handleOpenCreate = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const getRoleBadgeColor = (rolNombre) => {
        switch (rolNombre?.toLowerCase()) {
            case 'administrador': return { bg: 'rgba(0,112,243,0.15)', color: '#0070F3', border: 'rgba(0,112,243,0.3)' };
            case 'vendedor': return { bg: 'rgba(0,200,83,0.15)', color: '#00C853', border: 'rgba(0,200,83,0.3)' };
            case 'almacén': return { bg: 'rgba(255,170,0,0.15)', color: '#FFAA00', border: 'rgba(255,170,0,0.3)' };
            default: return { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: 'var(--border-light)' };
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('es-BO', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className="module-container">
            <PageHeader
                title="Gestión de Usuarios"
                actionLabel="Nuevo Usuario"
                actionIcon={Plus}
                onAction={handleOpenCreate}
            />

            <div className="filters-bar" style={{ marginBottom: '2rem' }}>
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar por nombre o email..."
                />

                <div className="filter-group" style={{ zIndex: 10 }}>
                    <Select
                        classNamePrefix="react-select"
                        placeholder="Todos los roles..."
                        isClearable
                        options={[{ value: 'all', label: 'Todos los roles' }, ...roles]}
                        value={selectedRole}
                        onChange={setSelectedRole}
                        noOptionsMessage={() => "No hay roles"}
                    />
                </div>
            </div>

            <div className="table-responsive page-transition-enter-active">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>ID</th>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>CI</th>
                            <th>Teléfono</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Creado</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map(user => {
                                const rolColors = getRoleBadgeColor(user.rol_nombre);
                                return (
                                    <tr key={user.id}>
                                        <td>
                                            <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                                                {user.id}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #0070F3, #00DFD8)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.8rem', fontWeight: 600, color: 'white', flexShrink: 0
                                                }}>
                                                    {user.nombre?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                {user.nombre}
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{user.ci || '—'}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{user.telefono || '—'}</td>
                                        <td>
                                            <span className="badge" style={{
                                                background: rolColors.bg,
                                                color: rolColors.color,
                                                border: `1px solid ${rolColors.border}`,
                                                display: 'inline-flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                <Shield size={12} /> {user.rol_nombre || 'Sin rol'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.activo ? (
                                                <span className="badge success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <UserCheck size={12} /> Activo
                                                </span>
                                            ) : (
                                                <button 
                                                    className="badge danger" 
                                                    onClick={() => handleUpdate(user.id, { activo: 1 })}
                                                    style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '4px', 
                                                        cursor: 'pointer', 
                                                        border: 'none',
                                                        outline: 'none',
                                                        transition: 'transform 0.1s ease'
                                                    }}
                                                    title="Haga clic para restaurar"
                                                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                                                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <UserX size={12} /> Inactivo
                                                </button>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button className="icon-btn" title="Editar" onClick={() => handleOpenEdit(user)}>
                                                    <Edit size={16} />
                                                </button>
                                                {user.activo ? (
                                                    (user.id === 1 || user.rol_nombre?.toLowerCase() === 'administrador') ? (
                                                        <button className="icon-btn" title="Administrador Protegido" style={{ color: 'var(--text-secondary)', opacity: 0.5, cursor: 'not-allowed' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    ) : (
                                                        <button className="icon-btn" title="Desactivar" onClick={() => handleDelete(user.id)} style={{ color: 'var(--danger-red)' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )
                                                ) : (
                                                    <button 
                                                        className="icon-btn" 
                                                        title="Restaurar" 
                                                        onClick={() => handleUpdate(user.id, { activo: 1 })} 
                                                        style={{ color: '#00C853' }}
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No se encontraron usuarios.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            <UserModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={fetchUsers}
                roles={roles}
                user={editingUser}
            />
        </div>
    );
};

export default UsersPage;
