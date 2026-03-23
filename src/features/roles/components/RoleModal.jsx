// src/features/roles/components/RoleModal.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Save } from 'lucide-react';
import roleService from '../services/roleService';
import Swal from 'sweetalert2';

const RoleModal = ({ isOpen, onClose, onSave, role = null }) => {
    const isEditing = !!role;

    const getInitialFormData = () => ({
        nombre: '',
        descripcion: ''
    });

    const [formData, setFormData] = useState(getInitialFormData());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (role) {
                setFormData({
                    nombre: role.nombre || '',
                    descripcion: role.descripcion || ''
                });
            } else {
                setFormData(getInitialFormData());
            }
        }
    }, [isOpen, role]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre) {
            Swal.fire({
                title: 'Campo requerido',
                text: 'El nombre del rol es obligatorio.',
                icon: 'warning',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditing) {
                await roleService.update(role.id, formData);
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'Rol actualizado correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-bg' }
                });
            } else {
                await roleService.create(formData);
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Rol creado correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-bg' }
                });
            }
            onSave();
            onClose();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || `Error al ${isEditing ? 'actualizar' : 'crear'} el rol.`;
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
                    <h3>{isEditing ? 'Editar Rol' : 'Nuevo Rol'}</h3>
                    <button type="button" className="icon-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '2rem' }}>
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label>Nombre del Rol *</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej. Administrador, Vendedor, Almacén..."
                            required
                            autoFocus
                            disabled={isEditing && role.id === 1}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label>Descripción</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            placeholder="Descripción del rol y sus responsabilidades..."
                            rows="4"
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
                            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Rol' : 'Crear Rol')}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default RoleModal;