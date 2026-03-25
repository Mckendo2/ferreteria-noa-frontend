import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Search, ShoppingCart, Trash2, Plus, Minus, Package, Image as ImageIcon, CheckCircle, ArrowLeft, X, Filter, Truck } from 'lucide-react';
import usePurchases from '../hooks/usePurchases';
import { getProviders } from '../../providers/services/providerService';
import { generatePurchasePDF } from '../services/purchasePdfService';
import Swal from 'sweetalert2';
import { BASE_URL } from '../../../services/api';


const PurchaseForm = ({ onCancel, onSuccess }) => {
    const {
        products,
        cart,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        categories,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        updatePrice,
        clearCart,
        cartTotal,
        cartItemCount,
        submitPurchase,
    } = usePurchases();

    const [processing, setProcessing] = useState(false);
    const [providers, setProviders] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState(null);

    useEffect(() => {
        const fetchProvidersList = async () => {
            try {
                const data = await getProviders();
                setProviders(data.filter(p => p.activo === 1));
            } catch (error) {
                console.error("Error loading providers", error);
            }
        };
        fetchProvidersList();
    }, []);

    const handleCompletePurchase = async () => {
        if (cart.length === 0) {
            Swal.fire({
                title: 'Carrito vacío',
                text: 'Agrega productos al carrito para registrar una compra.',
                icon: 'warning',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return;
        }

        if (!selectedProvider) {
            Swal.fire({
                title: 'Proveedor requerido',
                text: 'Debes seleccionar el proveedor del cual se está comprando la mercadería.',
                icon: 'warning',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return;
        }

        const result = await Swal.fire({
            title: '¿Confirmar Compra?',
            html: `
                <div style="text-align: left; color: var(--text-secondary);">
                    <p><strong>Proveedor:</strong> ${selectedProvider.label}</p>
                    <p><strong>${cartItemCount}</strong> producto(s) en total</p>
                    <p style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-top: 0.5rem;">
                        Valor Total: Bs ${cartTotal.toFixed(2)}
                    </p>
                    <p style="margin-top: 0.5rem; font-size: 0.9em;">Se registrará el ingreso de estos productos al inventario.</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Confirmar Compra',
            cancelButtonText: 'Revisar',
            customClass: {
                popup: 'my-swal-bg',
                confirmButton: 'my-swal-confirm',
                cancelButton: 'my-swal-cancel'
            }
        });

        if (!result.isConfirmed) return;

        setProcessing(true);
        try {
            const purchaseResult = await submitPurchase(selectedProvider.value);

            const pdfData = {
                compraId: purchaseResult?.compra_id || '',
                fecha: new Date(),
                proveedor: selectedProvider.label,
                items: [...cart],
                total: cartTotal
            };

            const successResult = await Swal.fire({
                title: '¡Compra registrada!',
                text: 'El inventario ha sido actualizado.',
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: '📥 Descargar Comprobante',
                cancelButtonText: 'Cerrar',
                customClass: { 
                    popup: 'my-swal-bg',
                    confirmButton: 'my-swal-confirm',
                    cancelButton: 'my-swal-cancel'
                }
            });

            if (successResult.isConfirmed) {
                generatePurchasePDF(pdfData);
            }

            if (onSuccess) onSuccess();

        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.error || 'Hubo un problema al registrar la compra.',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="sales-page" style={{ height: 'calc(100vh - 120px)' }}>
            {/* LEFT PANEL: Products Selection */}
            <div className="sales-products-panel">
                <div className="sales-products-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <button className="btn-secondary" onClick={onCancel} style={{ padding: '0.5rem' }}>
                            <ArrowLeft size={16} />
                        </button>
                        <h2 style={{ margin: 0 }}>Agregar al Carrito de Compra</h2>
                    </div>

                    <div className="sales-search-wrapper">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Buscar producto a ingresar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="sales-search-clear" onClick={() => setSearchTerm('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="filters-bar" style={{ marginTop: '1rem', marginBottom: '0' }}>
                        <div className="filter-group" style={{ zIndex: 10, flex: 1 }}>
                            <Select
                                classNamePrefix="react-select"
                                placeholder="Filtrar por categoría..."
                                isClearable
                                options={[{ value: '', label: 'Todas las categorías' }, ...categories.map(c => ({ value: c, label: c }))]}
                                value={selectedCategory ? { value: selectedCategory, label: selectedCategory } : null}
                                onChange={(sel) => setSelectedCategory(sel ? sel.value : '')}
                                noOptionsMessage={() => "No hay categorías"}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="sales-loading">
                        <p style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Cargando catálogo...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="sales-empty-state">
                        <Package size={48} />
                        <h3>No se encontraron productos</h3>
                        <p>Intenta con otra búsqueda.</p>
                    </div>
                ) : (
                    <div className="sales-products-grid">
                        {products.map(product => {
                            const inCart = cart.find(c => c.producto_id === product.id);
                            return (
                                <div
                                    key={product.id}
                                    className={`sales-product-card ${inCart ? 'in-cart' : ''}`}
                                    onClick={() => addToCart(product)}
                                >
                                    <div className="sales-card-image">
                                        {product.imagen ? (
                                            <img
                                                src={product.imagen.startsWith('http') ? product.imagen : `${BASE_URL}${product.imagen}`}
                                                alt={product.nombre}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : <div className="sales-card-placeholder"><ImageIcon size={28} /></div>}
                                        {inCart && (
                                            <div className="sales-card-cart-badge">
                                                <CheckCircle size={14} />
                                                <span>{inCart.cantidad}</span>
                                            </div>
                                        )}
                                        {/* Show current stock as reference */}
                                        <div className="sales-card-stock-badge" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                            Stock actual: {product.stock}
                                        </div>
                                    </div>
                                    <div className="sales-card-info">
                                        <span className="sales-card-name">{product.nombre}</span>
                                        <span className="sales-card-price" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            Costo aprox: Bs {parseFloat(product.precio_compra).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* RIGHT PANEL: Purchase Cart & Supplier Info */}
            <div className="sales-cart-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="sales-cart-header">
                    <div className="sales-cart-title">
                        <ShoppingCart size={20} />
                        <h3>Detalle de la Compra</h3>
                    </div>
                    {cart.length > 0 && <span className="sales-cart-count">{cartItemCount} items</span>}
                </div>

                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        <Truck size={16}/> Proveedor *
                    </label>
                    <Select
                        classNamePrefix="react-select"
                        placeholder="Seleccionar proveedor..."
                        isClearable
                        options={providers.map(p => ({ value: p.id, label: p.nombre }))}
                        value={selectedProvider}
                        onChange={setSelectedProvider}
                        noOptionsMessage={() => "No se encontraron proveedores activos"}
                    />
                </div>

                {cart.length === 0 ? (
                    <div className="sales-cart-empty" style={{ flex: 1 }}>
                        <ShoppingCart size={40} />
                        <p>Selecciona los productos que ingresarán al inventario</p>
                    </div>
                ) : (
                    <>
                        <div className="sales-cart-items" style={{ flex: 1, overflowY: 'auto' }}>
                            {cart.map(item => (
                                <div key={item.producto_id} className="sales-cart-item">
                                    <div className="sales-cart-item-image">
                                        {item.imagen ? (
                                            <img
                                                src={item.imagen.startsWith('http') ? item.imagen : `${API_BASE}${item.imagen}`}
                                                alt={item.nombre}
                                            />
                                        ) : <div className="sales-cart-item-placeholder"><ImageIcon size={16} /></div>}
                                    </div>
                                    <div className="sales-cart-item-details">
                                        <span className="sales-cart-item-name">{item.nombre}</span>
                                        <span className="sales-cart-item-price">Sub: Bs {(item.precio * item.cantidad).toFixed(2)}</span>
                                    </div>
                                    <div className="sales-cart-item-qty">
                                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.producto_id, item.cantidad - 1); }}><Minus size={14} /></button>
                                        <input 
                                            type="number" 
                                            value={item.cantidad} 
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val)) updateQuantity(item.producto_id, Math.max(1, val));
                                            }}
                                            className="sales-cart-qty-input"
                                            onClick={(e) => e.stopPropagation()}
                                            min="1"
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.producto_id, item.cantidad + 1); }}><Plus size={14} /></button>
                                    </div>
                                    <div className="sales-cart-item-subtotal">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>C.U.</span>
                                            <input
                                                type="number"
                                                value={item.precio}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                                    if (val === '' || (!isNaN(val) && val >= 0)) updatePrice(item.producto_id, val === '' ? 0 : val);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ width: '65px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: '#fff', color: '#000', fontSize: '0.9rem', textAlign: 'right' }}
                                                step="0.5"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <button className="sales-cart-item-remove" onClick={(e) => { e.stopPropagation(); removeFromCart(item.producto_id); }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="sales-cart-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem' }}>
                            <div className="sales-final-total" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Total Costo:</span>
                                <span style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Bs {cartTotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={clearCart}>
                                    <Trash2 size={16} /> Vaciar
                                </button>
                                <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleCompletePurchase} disabled={processing}>
                                    <CheckCircle size={16} /> {processing ? 'Comprando...' : 'Registrar Compra'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PurchaseForm;
