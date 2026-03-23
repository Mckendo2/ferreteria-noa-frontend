import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Save } from 'lucide-react';
import { createCategory, updateCategory } from '../services/categoryService';
import Swal from 'sweetalert2';

const CategoryModal = ({ isOpen, onClose, onSave, categoryToEdit = null }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditMode = !!categoryToEdit;

    useEffect(() => {
        if (isOpen) {
            if (categoryToEdit) {
                setFormData({
                    nombre: categoryToEdit.nombre || '',
                    descripcion: categoryToEdit.descripcion || ''
                });
            } else {
                setFormData({ nombre: '', descripcion: '' });
            }
        }
    }, [isOpen, categoryToEdit]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nombre) {
            Swal.fire({
                title: 'Campo Obligatorio',
                text: 'El nombre de la categoría es obligatorio.',
                icon: 'warning',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditMode) {
                await updateCategory(categoryToEdit.id, formData);
            } else {
                await createCategory(formData);
            }
            
            Swal.fire({
                title: '¡Éxito!',
                text: `Categoría ${isEditMode ? 'actualizada' : 'creada'} correctamente.`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'my-swal-bg' }
            });
            onSave();
            onClose();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Hubo un error al guardar la categoría.';
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
            <div className="modal-content page-transition-enter-active" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3>{isEditMode ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                    <button className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label>Nombre de Categoría *</label>
                        <input 
                            type="text" 
                            name="nombre" 
                            value={formData.nombre} 
                            onChange={handleChange} 
                            placeholder="Ej. Herramientas Eléctricas"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea 
                            name="descripcion" 
                            value={formData.descripcion} 
                            onChange={handleChange} 
                            placeholder="Detalles de la categoría..."
                            rows="4"
                            style={{
                                background: 'var(--bg-dark)',
                                border: '1px solid var(--border-light)',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '6px',
                                color: 'var(--text-primary)',
                                fontSize: '0.875rem',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div className="modal-footer" style={{ marginTop: '2rem', paddingTop: '1.5rem' }}>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={16} /> {isSubmitting ? 'Guardando...' : 'Guardar Categoría'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default CategoryModal;
