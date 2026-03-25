import React from 'react';
import ReactDOM from 'react-dom';
import { X, Package, Tag, BarChart3, Calendar, Image as ImageIcon } from 'lucide-react';
import { BASE_URL } from '../../../services/api';

const ProductDetailModal = ({ isOpen, onClose, product, categoryName }) => {
    if (!isOpen || !product) return null;

    const isLowStock = product.stock <= product.stock_minimo;
    const isOutOfStock = product.stock === 0;
    const stockStatusClass = isOutOfStock ? 'stock-out' : (isLowStock ? 'stock-low' : 'stock-good');
    const stockLabel = isOutOfStock ? 'Agotado' : (isLowStock ? 'Stock Bajo' : 'En Stock');

    const margen = product.precio_venta && product.precio_compra
        ? ((product.precio_venta - product.precio_compra) / product.precio_compra * 100).toFixed(1)
        : 0;

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('es-BO', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content large page-transition-enter-active">
                <div className="modal-header">
                    <h3>Detalle del Producto</h3>
                    <button type="button" className="icon-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ padding: '2rem' }}>
                    {/* Top section: Image + Basic Info */}
                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        {/* Image */}
                        <div style={{
                            width: '220px', height: '220px', borderRadius: '12px', overflow: 'hidden',
                            background: 'var(--bg-dark)', border: '1px solid var(--border-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            {product.imagen ? (
                                <img
                                    src={product.imagen.startsWith('http') ? product.imagen : `${BASE_URL}${product.imagen}`}
                                    alt={product.nombre}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.parentNode.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:0.5rem;color:var(--text-secondary)"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg><span>Sin imagen</span></div>';
                                    }}
                                />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                    <ImageIcon size={48} style={{ opacity: 0.4 }} />
                                    <span>Sin imagen</span>
                                </div>
                            )}
                        </div>

                        {/* Basic Info */}
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0 }}>{product.nombre}</h2>
                                {product.activo ? (
                                    <span className="badge success">Activo</span>
                                ) : (
                                    <span className="badge danger">Inactivo</span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                                    <Tag size={12} style={{ marginRight: '4px' }} /> {categoryName || 'Sin categoría'}
                                </span>
                                {product.codigo_barras && (
                                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                                        <BarChart3 size={12} style={{ marginRight: '4px' }} /> {product.codigo_barras}
                                    </span>
                                )}
                            </div>

                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                {product.descripcion || 'Sin descripción disponible.'}
                            </p>

                            {/* Stock indicator */}
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 1rem', borderRadius: '8px',
                                background: isOutOfStock ? 'rgba(238,0,0,0.1)' : (isLowStock ? 'rgba(255,170,0,0.1)' : 'rgba(0,200,83,0.1)'),
                                border: `1px solid ${isOutOfStock ? 'rgba(238,0,0,0.3)' : (isLowStock ? 'rgba(255,170,0,0.3)' : 'rgba(0,200,83,0.3)')}`
                            }}>
                                <div className={`stock-indicator ${stockStatusClass}`}></div>
                                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{stockLabel} — {product.stock} unidades</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="stat-card" style={{ padding: '1.25rem' }}>
                            <div className="stat-card-header" style={{ marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem' }}>Precio Compra</span>
                            </div>
                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>Bs {product.precio_compra || '0.00'}</div>
                        </div>

                        <div className="stat-card" style={{ padding: '1.25rem' }}>
                            <div className="stat-card-header" style={{ marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem' }}>Precio Venta</span>
                            </div>
                            <div className="stat-value" style={{ fontSize: '1.5rem', color: '#00DFD8' }}>Bs {product.precio_venta || '0.00'}</div>
                        </div>

                        <div className="stat-card" style={{ padding: '1.25rem' }}>
                            <div className="stat-card-header" style={{ marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem' }}>Margen de Ganancia</span>
                            </div>
                            <div className="stat-value" style={{ fontSize: '1.5rem', color: margen > 0 ? '#00C853' : '#E00' }}>{margen}%</div>
                        </div>

                        <div className="stat-card" style={{ padding: '1.25rem' }}>
                            <div className="stat-card-header" style={{ marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem' }}>Stock Mínimo</span>
                            </div>
                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{product.stock_minimo || 5}</div>
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div style={{
                        display: 'flex', gap: '2rem', flexWrap: 'wrap',
                        padding: '1rem 1.25rem', borderRadius: '8px',
                        background: 'var(--bg-dark)', border: '1px solid var(--border-light)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            <Calendar size={14} />
                            <span>Creado: {formatDate(product.created_at)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            <Calendar size={14} />
                            <span>Actualizado: {formatDate(product.updated_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{ padding: '1.25rem 2rem' }}>
                    <div></div>
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProductDetailModal;
