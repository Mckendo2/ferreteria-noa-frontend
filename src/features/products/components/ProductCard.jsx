import React from 'react';
import { Eye, Edit, Trash2, Image as ImageIcon } from 'lucide-react';

const ProductCard = ({ product, categoryName, onDelete, onEdit, onView }) => {
    const isLowStock = product.stock <= product.stock_minimo;
    const isOutOfStock = product.stock === 0;
    const stockStatusClass = isOutOfStock ? 'stock-out' : (isLowStock ? 'stock-low' : 'stock-good');
    const stockLabel = isOutOfStock ? 'Agotado' : (isLowStock ? `Bajo (${product.stock})` : `${product.stock} en stock`);

    return (
        <div className="product-card">
            <div className="product-card-image">
                <div className="product-card-badges">
                    <span className="badge" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {product.codigo_barras || 'Sin código'}
                    </span>
                    {!product.activo && (
                        <span className="badge danger" style={{ background: 'rgba(238,0,0,0.8)', color: 'white' }}>INACTIVO</span>
                    )}
                </div>
                
                {product.imagen ? (
                    <img 
                        src={product.imagen.startsWith('http') ? product.imagen : `http://localhost:5000${product.imagen}`} 
                        alt={product.nombre}
                        loading="lazy"
                        onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.style.display = 'none'; 
                            const placeholder = e.target.parentNode.querySelector('.img-error-fallback');
                            if (placeholder) placeholder.style.display = 'flex';
                        }}
                    />
                ) : null}

                {(!product.imagen || product.imagen) && (
                    <div className="product-card-placeholder img-error-fallback" style={{ display: product.imagen ? 'none' : 'flex' }}>
                        <ImageIcon size={32} />
                        <span>Sin imagen</span>
                    </div>
                )}
            </div>
            <div className="product-card-content">
                <div className="product-card-category">{categoryName}</div>
                <h3 className="product-card-title" title={product.nombre}>{product.nombre}</h3>
                
                <div className="product-card-price-row">
                    <div>
                        <span className="product-price-label">Precio Compra</span>
                        <span className="product-price-cost">${product.precio_compra || '0.00'}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span className="product-price-label">Precio Venta</span>
                        <span className="product-price-value">${product.precio_venta}</span>
                    </div>
                </div>
            </div>
            <div className="product-card-footer">
                <div className="product-stock-info" title="Nivel de stock actual">
                    <div className={`stock-indicator ${stockStatusClass}`}></div>
                    <span>{stockLabel}</span>
                </div>
                <div className="product-actions">
                    <button className="icon-btn" title="Ver detalles" onClick={() => onView(product)}><Eye size={16} /></button>
                    <button className="icon-btn" title="Editar" onClick={() => onEdit(product)}><Edit size={16} /></button>
                    <button className="icon-btn" title="Eliminar" onClick={() => onDelete(product.id)} style={{ color: 'var(--danger-red)', borderColor: 'rgba(238,0,0,0.3)' }}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
