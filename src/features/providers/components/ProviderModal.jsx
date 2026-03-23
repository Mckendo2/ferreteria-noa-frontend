import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Truck } from 'lucide-react';

const ProviderModal = ({ isOpen, onClose, onSave, provider }) => {
    const isEdit = !!provider;

    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        activo: 1
    });

    useEffect(() => {
        if (provider) {
            setFormData({
                nombre: provider.nombre || '',
                telefono: provider.telefono || '',
                email: provider.email || '',
                direccion: provider.direccion || '',
                activo: provider.activo !== undefined ? provider.activo : 1
            });
        } else {
            setFormData({
                nombre: '',
                telefono: '',
                email: '',
                direccion: '',
                activo: 1
            });
        }
    }, [provider, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Simple validation
        if (!formData.nombre.trim()) {
            return; // required
        }

        const success = await onSave(formData);
        if (success) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group required">
                        <label>
                            <Truck size={16} style={{ marginRight: '8px' }} />
                            Nombre de la Empresa o Representante
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej. Importadora XYZ"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <Phone size={16} style={{ marginRight: '8px' }} />
                            Teléfono
                        </label>
                        <input
                            type="text"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            placeholder="Ej. 70012345"
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <Mail size={16} style={{ marginRight: '8px' }} />
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Ej. ventas@empresa.com"
                        />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>
                            <MapPin size={16} style={{ marginRight: '8px' }} />
                            Dirección
                        </label>
                        <textarea
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                            placeholder="Dirección del proveedor"
                            rows="2"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'none' }}
                        />
                    </div>

                    <div className="form-group checkbox-group" style={{ gridColumn: '1 / -1' }}>
                        <label>
                            <input
                                type="checkbox"
                                name="activo"
                                checked={formData.activo === 1}
                                onChange={handleChange}
                            />
                            Proveedor Activo
                        </label>
                        <small style={{ display: 'block', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Los proveedores inactivos no aparecerán en las opciones de compras.
                        </small>
                    </div>

                    <div className="modal-footer" style={{ gridColumn: '1 / -1' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={!formData.nombre.trim()}>
                            {isEdit ? 'Guardar Cambios' : 'Registrar Proveedor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProviderModal;
