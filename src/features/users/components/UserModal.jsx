import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Select from 'react-select';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import { createUser, updateUser } from '../services/userService';
import Swal from 'sweetalert2';

const UserModal = ({ isOpen, onClose, onSave, roles, user = null }) => {
    const isEditing = !!user;

    const getInitialFormData = () => ({
        nombre: '',
        email: '',
        telefono: '',
        ci: '',
        password: '',
        rol_id: null
    });

    const [formData, setFormData] = useState(getInitialFormData());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (user) {
                const matchedRole = roles.find(r => r.value === user.rol_id);
                setFormData({
                    nombre: user.nombre || '',
                    email: user.email || '',
                    telefono: user.telefono || '',
                    ci: user.ci || '',
                    password: '', // don't pre-fill password
                    rol_id: matchedRole || null
                });
            } else {
                setFormData(getInitialFormData());
            }
            setShowPassword(false);
        }
    }, [isOpen, user, roles]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Validation for telefono: only digits and max 8 characters
        if (name === 'telefono') {
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length <= 8) {
                setFormData(prev => ({ ...prev, [name]: digitsOnly }));
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (selectedOption) => {
        setFormData(prev => ({ ...prev, rol_id: selectedOption }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre || !formData.email || !formData.rol_id) {
            Swal.fire({
                title: 'Campos Incompletos',
                text: 'Nombre, email y rol son obligatorios.',
                icon: 'warning',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return;
        }

        if (!isEditing && !formData.password) {
            Swal.fire({
                title: 'Contraseña requerida',
                text: 'La contraseña es obligatoria para nuevos usuarios.',
                icon: 'warning',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return;
        }

        setIsSubmitting(true);

        const payload = {
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono,
            ci: formData.ci,
            rol_id: formData.rol_id.value,
            activo: 1 // Reactivate on save if it was inactive
        };

        // Only include password if provided
        if (formData.password.trim() !== '') {
            payload.password = formData.password;
        }

        try {
            if (isEditing) {
                await updateUser(user.id, payload);
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'Usuario actualizado correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-bg' }
                });
            } else {
                await createUser(payload);
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Usuario creado correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-bg' }
                });
            }
            onSave();
            onClose();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Error al guardar el usuario.';
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
                    <h3>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                    <button type="button" className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '2rem' }}>
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label>Nombre Completo *</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej. Juan Pérez"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label>Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Ej. juan@ferreteria.com"
                            required
                            disabled={isEditing && (user.id === 1 || user.rol_nombre?.toLowerCase() === 'administrador')}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div className="form-group">
                            <label>CI</label>
                            <input
                                type="text"
                                name="ci"
                                value={formData.ci}
                                onChange={handleChange}
                                placeholder="Ej. 1234567"
                            />
                        </div>
                        <div className="form-group">
                            <label>Teléfono</label>
                            <input
                                type="text"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="Ej. 70012345"
                                maxLength={8}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label>{isEditing ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}</label>
                        <div className="input-with-action">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
                                required={!isEditing}
                            />
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.75rem' }}
                                title={showPassword ? 'Ocultar' : 'Mostrar'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div className="form-group" style={{ zIndex: 10 }}>
                            <label>Rol *</label>
                            <Select
                                classNamePrefix="react-select"
                                placeholder="Seleccionar rol..."
                                isClearable
                                options={roles}
                                value={formData.rol_id}
                                onChange={handleRoleChange}
                                noOptionsMessage={() => "No hay roles"}
                                isDisabled={isEditing && (user.id === 1 || user.rol_nombre?.toLowerCase() === 'administrador')}
                            />
                        </div>
                    </div>

                    <div className="modal-footer" style={{ marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={16} /> {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default UserModal;
