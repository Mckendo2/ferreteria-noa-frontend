import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Save } from 'lucide-react';
import permissionService from '../services/permissionService';
import Swal from 'sweetalert2';

const PermissionModal = ({ isOpen, onClose, onSave, permission = null }) => {
    const isEditing = !!permission;

    const getInitialFormData = () => ({
        nombre: '',
        slug: '',
        descripcion: ''
    });

    const [formData, setFormData] = useState(getInitialFormData());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (permission) {
                setFormData({
                    nombre: permission.nombre || '',
                    slug: permission.slug || '',
                    descripcion: permission.descripcion || ''
                });
            } else {
                setFormData(getInitialFormData());
            }
        }
    }, [isOpen, permission]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // Auto-generate slug from nombre when creating
            if (name === 'nombre' && !isEditing) {
                updated.slug = value
                    .toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '_')
                    .replace(/^_|_$/g, '');
            }
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre || !formData.slug) {
            Swal.fire({
                title: 'Campos requeridos',
                text: 'El nombre y el slug son obligatorios.',
                icon: 'warning',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditing) {
                await permissionService.update(permission.id, formData);
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'Permiso actualizado correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-bg' }
                });
            } else {
                await permissionService.create(formData);
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Permiso creado correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-bg' }
                });
            }
            onSave();
            onClose();
        } catch (error) {
            const errorMsg = error.message || `Error al ${isEditing ? 'actualizar' : 'crear'} el permiso.`;
            Swal.fire({
                title: 'Error',
                text: errorMsg,
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content page-transition-enter-active" style={{ maxWidth: '550px' }}>
                <div className="modal-header">
                    <h3>{isEditing ? 'Editar Permiso' : 'Nuevo Permiso'}</h3>
                    <button type="button" className="icon-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '2rem' }}>
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label>Nombre del Permiso *</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej. Crear Ventas, Ver Reportes..."
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label>Slug (identificador) *</label>
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            placeholder="Ej. crear_ventas, ver_reportes"
                            required
                            style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                        />
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                            Se genera automáticamente desde el nombre
                        </small>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label>Descripción</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder="Descripción de lo que permite este permiso..."
                            rows="3"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'var(--bg-dark)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                fontSize: '0.875rem',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div className="modal-footer" style={{ marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Save size={16} />
                            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Permiso')}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default PermissionModal;
