import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Save, Shield, Check } from 'lucide-react';
import roleService from '../services/roleService';
import permissionService from '../../permissions/services/permissionService';
import Swal from 'sweetalert2';

const RolePermissionsModal = ({ isOpen, onClose, role }) => {
    const [allPermissions, setAllPermissions] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && role) {
            loadData();
        }
    }, [isOpen, role]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [perms, rolePerms] = await Promise.all([
                permissionService.getAll(),
                roleService.getRolePermissions(role.id)
            ]);
            setAllPermissions(perms);
            setSelectedIds(new Set(rolePerms.map(p => p.id)));
        } catch (error) {
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

    const togglePermission = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedIds.size === allPermissions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allPermissions.map(p => p.id)));
        }
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            await roleService.updateRolePermissions(role.id, Array.from(selectedIds));
            Swal.fire({
                title: '¡Guardado!',
                text: 'Permisos actualizados correctamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'my-swal-bg' }
            });
            onClose();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.message || 'Error al guardar permisos',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !role) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content page-transition-enter-active" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Shield size={18} /> Permisos de "{role.nombre}"
                    </h3>
                    <button type="button" className="icon-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <div className="spinner"></div>
                        </div>
                    ) : allPermissions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No hay permisos creados aún. Ve a la sección de Permisos para crear algunos.
                        </div>
                    ) : (
                        <>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)',
                                borderRadius: '8px', border: '1px solid var(--border-light)'
                            }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {selectedIds.size} de {allPermissions.length} seleccionados
                                </span>
                                <button
                                    type="button"
                                    onClick={toggleAll}
                                    style={{
                                        background: 'none', border: 'none', color: 'var(--accent-mint)',
                                        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                                    }}
                                >
                                    {selectedIds.size === allPermissions.length ? 'Desmarcar todos' : 'Seleccionar todos'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {allPermissions.map(perm => {
                                    const isChecked = selectedIds.has(perm.id);
                                    return (
                                        <div
                                            key={perm.id}
                                            onClick={() => togglePermission(perm.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '1rem',
                                                padding: '0.85rem 1rem', borderRadius: '8px', cursor: 'pointer',
                                                border: `1px solid ${isChecked ? 'var(--accent-mint)' : 'var(--border-light)'}`,
                                                background: isChecked ? 'rgba(0, 223, 216, 0.08)' : 'var(--bg-secondary)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{
                                                width: '22px', height: '22px', borderRadius: '4px',
                                                border: `2px solid ${isChecked ? 'var(--accent-mint)' : 'var(--border-light)'}`,
                                                background: isChecked ? 'var(--accent-mint)' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, transition: 'all 0.2s ease'
                                            }}>
                                                {isChecked && <Check size={14} color="white" />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                                                    {perm.nombre}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    <code style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        padding: '0.1rem 0.3rem',
                                                        borderRadius: '3px'
                                                    }}>{perm.slug}</code>
                                                    {perm.descripcion && ` — ${perm.descripcion}`}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={isSubmitting || loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Save size={16} />
                        {isSubmitting ? 'Guardando...' : 'Guardar Permisos'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default RolePermissionsModal;
