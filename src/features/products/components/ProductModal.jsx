import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import Select from 'react-select';
import { useDropzone } from 'react-dropzone';
import { X, Save, Box, Tag, Image as ImageIcon, Info, Camera, Trash2, RefreshCw, Plus } from 'lucide-react';
import { createProduct, updateProduct } from '../services/productService';
import { createCategory } from '../../categories/services/categoryService';
import { BASE_URL } from '../../../services/api';
import Swal from 'sweetalert2';

const ProductModal = ({ isOpen, onClose, onSave, categories, onRefreshCategories, product = null }) => {
    const isEditing = !!product;

    const getInitialFormData = () => ({
        nombre: '',
        codigo_barras: '',
        categoria_id: null,
        descripcion: '',
        precio_compra: '',
        precio_venta: '',
        stock: '',
        stock_minimo: '',
        activo: true,
        imagen: null
    });

    const [formData, setFormData] = useState(getInitialFormData());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (product) {
                // Edit mode: populate form with product data
                const matchedCategory = categories.find(c => c.value === product.categoria_id);
                setFormData({
                    nombre: product.nombre || '',
                    codigo_barras: product.codigo_barras || '',
                    categoria_id: matchedCategory || null,
                    descripcion: product.descripcion || '',
                    precio_compra: product.precio_compra || '',
                    precio_venta: product.precio_venta || '',
                    stock: product.stock?.toString() || '',
                    stock_minimo: product.stock_minimo?.toString() || '',
                    activo: product.activo === 1 || product.activo === true,
                    imagen: null // new image file, null means keep existing
                });
                // Show existing image as preview
                if (product.imagen) {
                    const imgUrl = product.imagen.startsWith('http')
                        ? product.imagen
                        : `${BASE_URL}${product.imagen}`;
                    setImagePreview(imgUrl);
                } else {
                    setImagePreview(null);
                }
            } else {
                // Create mode: reset form
                setFormData(getInitialFormData());
                setImagePreview(null);
            }
        }
    }, [isOpen, product, categories]);

    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Maximum dimensions
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Canvas to Blob failed'));
                        }
                    }, 'image/jpeg', 0.7);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            let file = acceptedFiles[0];

            // If file is larger than 1MB, compress it
            if (file.size > 1024 * 1024) {
                setIsCompressing(true);
                try {
                    const compressedFile = await compressImage(file);
                    file = compressedFile;
                } catch (error) {
                    console.error("Compression error:", error);
                    // Fallback to original file if compression fails
                } finally {
                    setIsCompressing(false);
                }
            }

            setFormData(prev => ({ ...prev, imagen: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    }, [compressImage]);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
            'image/heic': ['.heic'],
            'image/heif': ['.heif']
        },
        maxSize: 10485760, // 10MB to allow selection before compression
        multiple: false,
        noClick: true
    });

    // Handle file rejections
    useEffect(() => {
        if (fileRejections && fileRejections.length > 0) {
            const rejection = fileRejections[0];
            let errorMessage = 'Archivo rechazado.';
            
            if (rejection.errors[0]?.code === 'file-too-large') {
                errorMessage = 'La imagen es muy pesada (máximo 10MB).';
            } else if (rejection.errors[0]?.code === 'file-invalid-type') {
                errorMessage = 'Formato de imagen no permitido.';
            }

            Swal.fire({
                title: 'Error de Imagen',
                text: errorMessage,
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        }
    }, [fileRejections]);

    const removeImage = (e) => {
        e.stopPropagation();
        setFormData(prev => ({ ...prev, imagen: null }));
        setImagePreview(null);
    };

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCategoryChange = (selectedOption) => {
        setFormData(prev => ({ ...prev, categoria_id: selectedOption }));
    };

    const generateBarcode = () => {
        const randomCode = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
        setFormData(prev => ({ ...prev, codigo_barras: randomCode }));
    };

    const handleCreateCategory = async (inputValue) => {
        if (!inputValue || !inputValue.trim()) return;
        
        setIsSubmitting(true);
        try {
            const newCategory = await createCategory({ nombre: inputValue.trim() });
            
            // Refresh categories in parent
            if (onRefreshCategories) {
                await onRefreshCategories();
            }

            // Set the new category in formData
            setFormData(prev => ({
                ...prev,
                categoria_id: { value: newCategory.id, label: newCategory.nombre }
            }));

            Swal.fire({
                title: 'Categoría Creada',
                text: `La categoría "${newCategory.nombre}" ha sido creada con éxito.`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'my-swal-bg' }
            });
        } catch (error) {
            console.error('Error creating category:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo crear la categoría.',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCategoryClick = () => {
        Swal.fire({
            title: 'Nueva Categoría',
            input: 'text',
            inputLabel: 'Nombre de la categoría',
            inputPlaceholder: 'Escribe el nombre...',
            showCancelButton: true,
            confirmButtonText: 'Crear',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'my-swal-bg',
                confirmButton: 'my-swal-confirm',
                cancelButton: 'my-swal-cancel'
            },
            inputValidator: (value) => {
                if (!value) {
                    return '¡El nombre es obligatorio!';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                handleCreateCategory(result.value);
            }
        });
    };

    const adjustStock = (amount) => {
        setFormData(prev => {
            const currentStock = parseInt(prev.stock || 0);
            const newStock = Math.max(0, currentStock + amount);
            return { ...prev, stock: newStock.toString() };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre || !formData.categoria_id || formData.precio_compra === '' || formData.precio_venta === '' || formData.stock === '') {
            Swal.fire({
                title: 'Campos Incompletos',
                text: 'Por favor, llena todos los campos obligatorios indicados con (*).',
                icon: 'warning',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return;
        }

        setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('nombre', formData.nombre);
        if (formData.descripcion) formDataToSend.append('descripcion', formData.descripcion);
        if (formData.codigo_barras) formDataToSend.append('codigo_barras', formData.codigo_barras);
        formDataToSend.append('categoria_id', formData.categoria_id.value);
        formDataToSend.append('precio_compra', formData.precio_compra);
        formDataToSend.append('precio_venta', formData.precio_venta);
        formDataToSend.append('stock', formData.stock);
        formDataToSend.append('stock_minimo', formData.stock_minimo ? formData.stock_minimo : 5);
        formDataToSend.append('activo', formData.activo ? 1 : 0);

        // Only append image if a new file was selected
        if (formData.imagen && formData.imagen instanceof File) {
            formDataToSend.append('imagen', formData.imagen);
        }

        try {
            if (isEditing) {
                await updateProduct(product.id, formDataToSend);
                Swal.fire({
                    title: '¡Actualizado!',
                    text: 'Producto actualizado correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-bg' }
                });
            } else {
                await createProduct(formDataToSend);
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Producto creado correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'my-swal-bg' }
                });
            }
            onSave();
            onClose();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Hubo un error al guardar el producto.';
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
            <div className="modal-content large page-transition-enter-active">
                <div className="modal-header">
                    <h3>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                    <button type="button" className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">

                    {/* SECTION 1: Basic Information */}
                    <div className="modal-section">
                        <h4 className="modal-section-title"><Box size={16} /> Información Básica</h4>
                        <div className="grid-2-col">
                            <div className="form-group col-span-2">
                                <label>Nombre del Producto *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej. Taladro Percutor Dewalt 20V"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label>Código de Barras</label>
                                <div className="input-with-action">
                                    <input
                                        type="text"
                                        name="codigo_barras"
                                        value={formData.codigo_barras}
                                        onChange={handleChange}
                                        placeholder="Ej. 7501066000000"
                                    />
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={generateBarcode}
                                        title="Generar código aleatorio"
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.75rem' }}
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="form-group" style={{ zIndex: 10 }}>
                                <label>Categoría *</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <Select
                                            classNamePrefix="react-select"
                                            placeholder="Seleccionar categoría..."
                                            isClearable
                                            isSearchable
                                            options={categories}
                                            value={formData.categoria_id}
                                            onChange={handleCategoryChange}
                                            isDisabled={isSubmitting}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={handleAddCategoryClick}
                                        title="Agregar nueva categoría"
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0.75rem', height: '38px' }}
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="form-group col-span-2">
                                <label>Descripción del Producto</label>
                                <textarea
                                    name="descripcion"
                                    className="form-textarea"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    placeholder="Detalles adicionales, uso, características..."
                                    rows="3"
                                    maxLength={500}
                                />
                                <div className="char-counter">
                                    {formData.descripcion.length}/500
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Pricing and Stock */}
                    <div className="modal-section" style={{ zIndex: 9 }}>
                        <h4 className="modal-section-title"><Tag size={16} /> Precios y Stock</h4>
                        <div className="grid-3-col">
                            <div className="form-group">
                                <label>Precio Compra *</label>
                                <div className="input-with-addon">
                                    <span className="input-addon">Bs</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="precio_compra"
                                        value={formData.precio_compra}
                                        onChange={handleChange}
                                        required
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Precio Venta *</label>
                                <div className="input-with-addon">
                                    <span className="input-addon">Bs</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="precio_venta"
                                        value={formData.precio_venta}
                                        onChange={handleChange}
                                        required
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Estado del Producto</label>
                                <label className="switch-container" title="Si está inactivo, no aparecerá para ventas.">
                                    <input
                                        type="checkbox"
                                        name="activo"
                                        checked={formData.activo}
                                        onChange={handleChange}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="switch"></div>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                        {formData.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label>{isEditing ? 'Stock Actual *' : 'Stock Inicial *'}</label>
                                <div className="input-with-action">
                                    <input
                                        type="number"
                                        name="stock"
                                        min="0"
                                        value={formData.stock}
                                        onChange={handleChange}
                                        required
                                        placeholder="0"
                                        style={{ textAlign: 'center' }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <button type="button" onClick={() => adjustStock(1)} className="btn-secondary" style={{ padding: '2px 6px', fontSize: '10px' }}>+</button>
                                        <button type="button" onClick={() => adjustStock(-1)} className="btn-secondary" style={{ padding: '2px 6px', fontSize: '10px' }}>-</button>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label title="Nivel de alerta en inventario">
                                    Stock Mínimo
                                    <Info size={12} className="tooltip-icon" />
                                </label>
                                <input
                                    type="number"
                                    name="stock_minimo"
                                    min="0"
                                    value={formData.stock_minimo}
                                    onChange={handleChange}
                                    placeholder="5 (por defecto)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Image */}
                    <div className="modal-section" style={{ paddingBottom: '2rem' }}>
                        <h4 className="modal-section-title"><ImageIcon size={16} /> Fotografía del Producto</h4>

                        <div {...getRootProps()} className={`dropzone-container ${isDragActive ? 'active' : ''}`} style={{ cursor: 'default' }}>
                            <input {...getInputProps()} ref={fileInputRef} />
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                ref={cameraInputRef}
                                onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        await onDrop(Array.from(e.target.files));
                                    }
                                }}
                            />

                            {imagePreview ? (
                                <div className="dropzone-preview">
                                    <img src={imagePreview} alt="Preview" />
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {formData.imagen?.name || (isEditing ? 'Imagen actual' : 'Imagen cargada')}
                                        </span>
                                        <button type="button" onClick={removeImage} className="btn-danger-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Trash2 size={14} /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Camera size={40} color="var(--text-secondary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                                        Arrastra y suelta tu imagen aquí
                                    </p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                        Formatos soportados: PNG, JPG, WEBP (Se auto-ajustan fotos grandes)
                                    </p>
                                    {isCompressing && (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', marginBottom: '1rem', fontWeight: 600 }}>
                                            Procesando imagen...
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <ImageIcon size={18} /> Galería
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => cameraInputRef.current?.click()}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--primary-blue)', color: 'var(--primary-blue)' }}
                                        >
                                            <Camera size={18} /> Cámara
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer" style={{ padding: '0', paddingTop: '1.5rem', borderTop: 'none', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: 'var(--danger-red)', marginRight: '4px' }}>*</span> Campos obligatorios
                        </span>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Save size={16} /> {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Guardar Producto')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ProductModal;
