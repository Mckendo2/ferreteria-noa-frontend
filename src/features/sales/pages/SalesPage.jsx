import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, ArrowRightLeft, Package, Image as ImageIcon, X, CheckCircle, ArrowLeft, Calendar, Percent, FileText, ChevronRight, Filter, User, ChevronDown, UserPlus } from 'lucide-react';
import useSales from '../hooks/useSales';
import { createSale, getSaleById, updateSale } from '../services/saleService';
import { getClients, createClient } from '../../clients/services/clientService';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import { generateSalePDF } from '../utils/salePdfGenerator';
import { BASE_URL } from '../../../services/api';


const SalesPage = () => {
    const {
        products,
        cart,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        sortBy,
        setSortBy,
        categories,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        updatePrice,
        clearCart,
        cartTotal,
        cartItemCount,
        fetchProducts,
        setCart,
    } = useSales();

    const location = useLocation();
    const navigate = useNavigate();
    const [editingSaleId, setEditingSaleId] = useState(null);

    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [processing, setProcessing] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    // New states for multi-step checkout
    const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'payment'
    const [tipoVenta, setTipoVenta] = useState('pagada'); // 'pagada' | 'credito'
    const [fechaVenta, setFechaVenta] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });
    const [descuento, setDescuento] = useState(0);
    const [nota, setNota] = useState('');
    const [plazoCredito, setPlazoCredito] = useState(30);

    const [clientes, setClientes] = useState([]);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [mostrarGanancia, setMostrarGanancia] = useState(false);

    // Refs for autofocus
    const continuarBtnRef = useRef(null);
    const crearVentaBtnRef = useRef(null);

    // Autofocus Continue button when cart changes
    useEffect(() => {
        if (checkoutStep === 'cart' && cart.length > 0 && continuarBtnRef.current) {
            continuarBtnRef.current.focus();
        }
    }, [cart.length, checkoutStep]);

    // Autofocus Create Sale button when moving to payment step
    useEffect(() => {
        if (checkoutStep === 'payment' && crearVentaBtnRef.current) {
            crearVentaBtnRef.current.focus();
        }
    }, [checkoutStep]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 1. Fetch clients
                const clientsData = await getClients();
                const activeClients = clientsData.filter(c => c.activo === 1);
                setClientes(activeClients);

                // 2. Check if editing
                const saleId = location.state?.saleId;
                if (saleId) {
                    setEditingSaleId(saleId);
                    
                    if (location.state?.currentCart) {
                        setCart(location.state.currentCart.map(i => ({ 
                            ...i,
                            precio: parseFloat(i.precio) || 0,
                            costo: parseFloat(i.costo) || 0
                        })));
                    }

                    const sale = await getSaleById(saleId);
                    
                    if (!location.state?.currentCart) {
                        const initialCart = sale.detalles.map(det => ({
                            producto_id: det.producto_id,
                            nombre: det.producto_nombre,
                            precio: parseFloat(det.precio),
                            costo: parseFloat(det.costo_unitario) || 0,
                            cantidad: det.cantidad,
                            stock: 9999, 
                            imagen: det.imagen
                        }));
                        setCart(initialCart);
                    }

                    setMetodoPago(sale.metodo_pago);
                    setTipoVenta(sale.tipo_venta);
                    setFechaVenta(sale.fecha.split('T')[0]);
                    setDescuento(sale.descuento);
                    setNota(sale.nota || '');
                    
                    if (sale.cliente_id) {
                        const client = activeClients.find(c => c.id === sale.cliente_id);
                        if (client) {
                            setSelectedCliente({ value: client.id, label: `${client.nombre} ${client.telefono ? `- ${client.telefono}` : ''}` });
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading initial data", error);
            }
        };
        fetchInitialData();
    }, [location.state, setCart]);

    const finalTotal = Math.max(0, cartTotal - (parseFloat(descuento) || 0));
    const cartCosto = cart.reduce((sum, item) => sum + ((item.costo || 0) * item.cantidad), 0);
    const ganancia = Math.max(0, finalTotal - cartCosto);

    const handleAddClient = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Nuevo Cliente',
            html:
                '<input id="swal-input-nombre" class="swal2-input" placeholder="Nombre completo *" required>' +
                '<input id="swal-input-telefono" class="swal2-input" placeholder="Teléfono u Ocupación">' +
                '<input id="swal-input-email" class="swal2-input" placeholder="Correo electrónico (Opcional)">' +
                '<input id="swal-input-direccion" class="swal2-input" placeholder="Dirección (Opcional)">',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Registrar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'my-swal-bg',
                confirmButton: 'my-swal-confirm',
                cancelButton: 'my-swal-cancel',
                input: 'my-swal-input'
            },
            preConfirm: () => {
                const nombre = document.getElementById('swal-input-nombre').value;
                if (!nombre) {
                    Swal.showValidationMessage('El nombre es obligatorio');
                    return false;
                }
                return {
                    nombre: nombre,
                    telefono: document.getElementById('swal-input-telefono').value,
                    email: document.getElementById('swal-input-email').value,
                    direccion: document.getElementById('swal-input-direccion').value,
                    activo: 1
                };
            }
        });

        if (formValues) {
            try {
                const newClient = await createClient(formValues);
                const clientOption = { value: newClient.id, label: `${newClient.nombre} ${newClient.telefono ? `- ${newClient.telefono}` : ''}` };
                
                setClientes(prev => [...prev, newClient]);
                setSelectedCliente(clientOption);

                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Cliente registrado correctamente',
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    customClass: { popup: 'my-swal-bg' }
                });
            } catch (error) {
                Swal.fire({
                    title: 'Error',
                    text: error.response?.data?.error || 'Hubo un problema al registrar el cliente',
                    icon: 'error',
                    customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
                });
            }
        }
    };

    const handleCompleteSale = async () => {

        if (cart.length === 0) {
            Swal.fire({
                title: 'Carrito vacío',
                text: 'Agrega productos al carrito para realizar una venta.',
                icon: 'warning',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return;
        }

        if (tipoVenta === 'credito' && !selectedCliente) {
            Swal.fire({
                title: 'Cliente requerido',
                text: 'Para registrar una venta a crédito, debes seleccionar un cliente.',
                icon: 'warning',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return;
        }

        if (tipoVenta === 'pagada') {
            const result = await Swal.fire({
                title: 'Calcula el cambio de tu venta',
                html: `
                    <div style="text-align: left; color: var(--text-secondary);">
                        <p style="font-size: 1.2rem; font-weight: 600; color: var(--text-primary); margin-bottom: 1rem;">
                            Valor de la venta: <strong>Bs ${finalTotal.toFixed(2)}</strong>
                        </p>
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">¿Con cuánto paga el cliente?</label>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 1.2rem; font-weight: 600; color: var(--text-primary);">Bs</span>
                                <input type="number" id="montoPagado" class="swal2-input" placeholder="0.00" min="${finalTotal}" step="0.5" style="margin: 0; width: 100%; border-radius: 6px;" />
                            </div>
                        </div>
                        <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                            <p style="margin: 0; font-size: 0.9rem;">Valor a devolver:</p>
                            <p id="valorDevolver" style="font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin: 0.5rem 0 0 0;">
                                Bs 0.00
                            </p>
                        </div>
                    </div>
                `,
                didOpen: () => {
                    const input = Swal.getPopup().querySelector('#montoPagado');
                    const devolver = Swal.getPopup().querySelector('#valorDevolver');
                    input.addEventListener('input', () => {
                        const val = parseFloat(input.value) || 0;
                        const cambio = val - finalTotal;
                        devolver.innerText = `Bs ${Math.max(0, cambio).toFixed(2)}`;
                        if (val < finalTotal) {
                            devolver.style.color = '#ef4444'; // red
                        } else {
                            devolver.style.color = '#22c55e'; // green
                        }
                    });
                    // Focus the confirm button directly
                    Swal.getConfirmButton().focus();
                },
                preConfirm: () => {
                    const input = Swal.getPopup().querySelector('#montoPagado');
                    const value = input.value;
                    if (value === '') return finalTotal;
                    const val = parseFloat(value);
                    if (isNaN(val) || val < finalTotal) {
                        Swal.showValidationMessage('El monto pagado debe ser mayor o igual al total');
                        return false;
                    }
                    return val;
                },
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Confirmar',
                cancelButtonText: 'Cancelar',
                customClass: {
                    popup: 'my-swal-bg',
                    confirmButton: 'my-swal-confirm',
                    cancelButton: 'my-swal-cancel'
                }
            });

            if (!result.isConfirmed) return;
        } else {
            const result = await Swal.fire({
                title: '¿Confirmar venta a crédito?',
                html: `
                    <div style="text-align: left; color: var(--text-secondary);">
                        <p><strong>${cartItemCount}</strong> producto(s)</p>
                        <p style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-top: 0.5rem;">
                            Total: Bs ${finalTotal.toFixed(2)}
                        </p>
                        <p style="margin-top: 0.5rem;">Venta registrada como crédito.</p>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Confirmar Venta',
                cancelButtonText: 'Cancelar',
                customClass: {
                    popup: 'my-swal-bg',
                    confirmButton: 'my-swal-confirm',
                    cancelButton: 'my-swal-cancel'
                }
            });
            if (!result.isConfirmed) return;
        }

        setProcessing(true);
        try {
            const saleData = {
                cliente_id: selectedCliente ? selectedCliente.value : null,
                tipo_venta: tipoVenta,
                plazo: tipoVenta === 'credito' ? plazoCredito : null,
                fecha: fechaVenta,
                descuento: parseFloat(descuento) || 0,
                nota: nota,
                metodo_pago: tipoVenta === 'pagada' ? metodoPago : null,
                total: finalTotal,
                detalles: cart.map(item => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio: item.precio,
                }))
            };

            let saleResult;
            if (editingSaleId) {
                saleResult = await updateSale(editingSaleId, saleData);
            } else {
                saleResult = await createSale(saleData);
            }

            // Save sale info for PDF before clearing cart
            const pdfData = {
                ventaId: saleResult?.venta_id || '',
                fecha: new Date(),
                cliente: selectedCliente ? selectedCliente.label : 'Consumidor Final',
                items: [...cart],
                subtotal: cartTotal,
                descuento: parseFloat(descuento) || 0,
                total: finalTotal,
                metodoPago: tipoVenta === 'pagada' ? metodoPago : 'Crédito',
                tipoVenta,
                plazo: tipoVenta === 'credito' ? plazoCredito : null
            };

            if (editingSaleId) {
                clearCart();
                setEditingSaleId(null);
                navigate('/movimientos', { state: { saleUpdateSuccess: true } });
                return;
            }

            const result = await Swal.fire({
                title: '¡Venta registrada!',
                text: 'La venta se ha completado exitosamente.',
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

            if (result.isConfirmed) {
                generateSalePDF(pdfData);
            }

            clearCart();
            setCheckoutStep('cart');
            setDescuento(0);
            setNota('');
            setEditingSaleId(null);
            fetchProducts();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.error || 'Hubo un problema al registrar la venta.',
                icon: 'error',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } finally {
            setProcessing(false);
        }
    };

    const paymentMethods = [
        { value: 'efectivo', label: 'Efectivo', icon: <Banknote size={16} /> },
        { value: 'tarjeta', label: 'Tarjeta', icon: <CreditCard size={16} /> },
        { value: 'transferencia', label: 'Transferencia', icon: <ArrowRightLeft size={16} /> },
    ];

    return (
        <div className="sales-page">
            {/* LEFT PANEL: Products */}
            <div className="sales-products-panel">
                <div className="sales-products-header">
                    <h2>Productos Disponibles</h2>
                    <div className="sales-search-wrapper">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Buscar producto o código..."
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
                        <div className="filter-group" style={{ zIndex: 10 }}>
                            <Select
                                classNamePrefix="react-select"
                                placeholder="Todas las categorías..."
                                isClearable
                                options={[{ value: '', label: 'Todas las categorías' }, ...categories.map(c => ({ value: c, label: c }))]}
                                value={selectedCategory ? { value: selectedCategory, label: selectedCategory } : null}
                                onChange={(sel) => setSelectedCategory(sel ? sel.value : '')}
                                noOptionsMessage={() => "No hay categorías"}
                            />
                        </div>

                        <div className="filter-group" style={{ zIndex: 9 }}>
                            <Select
                                classNamePrefix="react-select"
                                placeholder="Ordenar por..."
                                isClearable={false}
                                options={[
                                    { value: 'name-asc', label: 'Nombre (A-Z)' },
                                    { value: 'name-desc', label: 'Nombre (Z-A)' },
                                    { value: 'price-asc', label: 'Menor Precio' },
                                    { value: 'price-desc', label: 'Mayor Precio' }
                                ]}
                                value={[
                                    { value: 'name-asc', label: 'Nombre (A-Z)' },
                                    { value: 'name-desc', label: 'Nombre (Z-A)' },
                                    { value: 'price-asc', label: 'Menor Precio' },
                                    { value: 'price-desc', label: 'Mayor Precio' }
                                ].find(o => o.value === sortBy) || { value: 'name-asc', label: 'Nombre (A-Z)' }}
                                onChange={(sel) => setSortBy(sel ? sel.value : 'name-asc')}
                            />
                        </div>
                    </div>

                    {/* BADGES E INDICADORES DE FILTRO ACTIVO */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <div className="active-filters">
                            <Filter size={16} color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} />
                            <span className="results-count">Mostrando {products.length} productos</span>

                            {(searchTerm || selectedCategory) && (
                                <button className="clear-filters-btn" onClick={() => { setSearchTerm(''); setSelectedCategory(''); }} style={{ marginLeft: '1rem' }}>
                                    Limpiar todos
                                </button>
                            )}

                            {searchTerm && (
                                <div className="filter-badge">
                                    Búsqueda: {searchTerm}
                                    <button onClick={() => setSearchTerm('')}><X size={12} /></button>
                                </div>
                            )}
                            {selectedCategory && (
                                <div className="filter-badge">
                                    Categoría: {selectedCategory}
                                    <button onClick={() => setSelectedCategory('')}><X size={12} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="sales-loading">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="sales-product-card-skeleton">
                                <div className="skeleton" style={{ height: '140px', borderRadius: '8px 8px 0 0' }}></div>
                                <div style={{ padding: '1rem' }}>
                                    <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
                                    <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="sales-empty-state">
                        <Package size={48} />
                        <h3>No hay productos disponibles</h3>
                        <p>{searchTerm ? 'Intenta con otro término de búsqueda.' : 'No hay productos con stock disponible.'}</p>
                    </div>
                ) : (
                    <div className="sales-products-grid">
                        {products.map(product => {
                            const inCart = cart.find(c => c.producto_id === product.id);
                            const isOutOfStock = product.stock <= 0;
                            return (
                                <div
                                    key={product.id}
                                    className={`sales-product-card ${inCart ? 'in-cart' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                                    onClick={() => !isOutOfStock && addToCart(product)}
                                    style={isOutOfStock ? { opacity: 0.65, cursor: 'not-allowed' } : {}}
                                >
                                    <div className="sales-card-image">
                                        {product.imagen ? (
                                            <img
                                                src={product.imagen.startsWith('http') ? product.imagen : `${BASE_URL}${product.imagen}`}
                                                alt={product.nombre}
                                                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                            />
                                        ) : null}
                                        <div className="sales-card-placeholder" style={product.imagen ? { display: 'none' } : {}}>
                                            <ImageIcon size={28} />
                                        </div>
                                        {inCart && (
                                            <div className="sales-card-cart-badge">
                                                <CheckCircle size={14} />
                                                <span>{inCart.cantidad}</span>
                                            </div>
                                        )}
                                        <div className={`sales-card-stock-badge ${isOutOfStock ? 'empty' : ''}`} style={isOutOfStock ? { background: 'var(--danger-red)' } : {}}>
                                            {isOutOfStock ? 'Agotado' : `${product.stock} uds`}
                                        </div>
                                    </div>
                                    <div className="sales-card-info">
                                        <span className="sales-card-name">{product.nombre}</span>
                                        {product.categoria_nombre && (
                                            <span className="sales-card-category">{product.categoria_nombre}</span>
                                        )}
                                        <span className="sales-card-price">Bs {parseFloat(product.precio_venta).toFixed(2)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* RIGHT PANEL: Cart & Payment */}
            <div className="sales-cart-panel">
                <div className="sales-cart-header">
                    <div className="sales-cart-title">
                        <ShoppingCart size={20} />
                        <h3>{checkoutStep === 'cart' ? 'Carrito de Venta' : 'Pago'}</h3>
                    </div>
                    {cart.length > 0 && checkoutStep === 'cart' && (
                        <span className="sales-cart-count">{cartItemCount} items</span>
                    )}
                </div>

                {cart.length === 0 ? (
                    <div className="sales-cart-empty">
                        <ShoppingCart size={40} />
                        <p>Selecciona productos para agregar al carrito</p>
                    </div>
                ) : checkoutStep === 'cart' ? (
                    <>
                        <div className="sales-cart-items">
                            {cart.map(item => (
                                <div 
                                    key={item.producto_id} 
                                    className={`sales-cart-item ${location.state?.targetProductId === item.producto_id ? 'highlight-edit' : ''}`}
                                >
                                    <div className="sales-cart-item-image" onClick={() => item.imagen && setPreviewImage({ src: item.imagen.startsWith('http') ? item.imagen : `${BASE_URL}${item.imagen}`, nombre: item.nombre })} style={{ cursor: item.imagen ? 'pointer' : 'default' }}>
                                        {item.imagen ? (
                                            <img
                                                src={item.imagen.startsWith('http') ? item.imagen : `${BASE_URL}${item.imagen}`}
                                                alt={item.nombre}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="sales-cart-item-placeholder">
                                                <ImageIcon size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="sales-cart-item-details">
                                        <span className="sales-cart-item-name">{item.nombre}</span>
                                        <span className="sales-cart-item-price">Bs {Number(item.precio).toFixed(2)}</span>
                                    </div>
                                    <div className="sales-cart-item-qty">
                                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.producto_id, item.cantidad - 1); }}>
                                            <Minus size={14} />
                                        </button>
                                        <input
                                            type="number"
                                            value={item.cantidad}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                                if (val === '' || (!isNaN(val) && val >= 1)) {
                                                    updateQuantity(item.producto_id, val === '' ? 1 : val);
                                                }
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="sales-cart-qty-input"
                                            min="1"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    continuarBtnRef.current?.focus();
                                                }
                                            }}
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.producto_id, item.cantidad + 1); }}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <div className="sales-cart-item-subtotal">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Bs</span>
                                            <input
                                                type="number"
                                                value={item.precio}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                                    if (val === '' || (!isNaN(val) && val >= 0)) {
                                                        updatePrice(item.producto_id, val === '' ? 0 : val);
                                                    }
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    width: '70px',
                                                    padding: '4px',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--border-color)',
                                                    backgroundColor: 'var(--bg-secondary)',
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.9rem',
                                                    textAlign: 'right'
                                                }}
                                                step="0.5"
                                                min="0"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        continuarBtnRef.current?.focus();
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        className="sales-cart-item-remove"
                                        onClick={(e) => { e.stopPropagation(); removeFromCart(item.producto_id); }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Total and Actions for Cart */}
                        <div className="sales-cart-footer">
                            <div className="sales-cart-total">
                                <span>Total</span>
                                <span className="sales-total-amount">Bs {cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="sales-cart-actions">
                                <button className="btn-secondary sales-clear-btn" onClick={clearCart}>
                                    <Trash2 size={16} />
                                    Vaciar
                                </button>
                                {location.state?.fromEdit ? (
                                    <button
                                        className="btn-primary sales-confirm-btn edit-continue-btn"
                                        style={{ flex: 1.5 }}
                                        onClick={() => navigate('/movimientos', { 
                                            state: { 
                                                openSaleId: editingSaleId, 
                                                updatedCart: cart 
                                            } 
                                        })}
                                    >
                                        Continuar edición
                                        <ChevronRight size={18} />
                                    </button>
                                ) : (
                                    <button
                                        ref={continuarBtnRef}
                                        className="btn-primary sales-confirm-btn"
                                        style={{ flex: 1.5 }}
                                        onClick={() => setCheckoutStep('payment')}
                                    >
                                        Continuar
                                        <ChevronRight size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="sales-payment-step" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button className="btn-secondary" onClick={() => setCheckoutStep('cart')} style={{ padding: '0.5rem' }}>
                                <ArrowLeft size={16} />
                            </button>
                            <span style={{ fontWeight: 600 }}>Volver al carrito</span>
                        </div>

                        <div className="sales-payment-body" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', minHeight: 0 }}>
                            <div className="sales-type-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <button
                                    className={`btn-${tipoVenta === 'pagada' ? 'primary' : 'secondary'}`}
                                    style={{ flex: 1 }}
                                    onClick={() => setTipoVenta('pagada')}
                                >
                                    Pagada
                                </button>
                                <button
                                    className={`btn-${tipoVenta === 'credito' ? 'primary' : 'secondary'}`}
                                    style={{ flex: 1 }}
                                    onClick={() => setTipoVenta('credito')}
                                >
                                    A Crédito
                                </button>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <User size={14} /> Seleccionar Cliente {tipoVenta === 'credito' ? '*' : '(Opcional)'}
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <Select
                                            classNamePrefix="react-select"
                                            placeholder="Buscar cliente..."
                                            isClearable
                                            options={clientes.map(c => ({ value: c.id, label: `${c.nombre} ${c.telefono ? `- ${c.telefono}` : ''}` }))}
                                            value={selectedCliente}
                                            onChange={setSelectedCliente}
                                            noOptionsMessage={() => "No se encontraron clientes"}
                                        />
                                    </div>
                                    <button 
                                        className="btn-primary" 
                                        onClick={handleAddClient}
                                        style={{ padding: '0 1rem', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Agregar nuevo cliente"
                                    >
                                        <UserPlus size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <Calendar size={14} /> Fecha de la venta
                                </label>
                                <input
                                    type="date"
                                    value={fechaVenta}
                                    onChange={(e) => setFechaVenta(e.target.value)}
                                    readOnly={!editingSaleId}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.75rem', 
                                        borderRadius: '6px', 
                                        border: '1px solid var(--border-color)', 
                                        backgroundColor: 'var(--bg-secondary)', 
                                        color: 'var(--text-primary)',
                                        cursor: editingSaleId ? 'text' : 'not-allowed',
                                        opacity: editingSaleId ? 1 : 0.7 
                                    }}
                                />
                                {!editingSaleId && <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>Se asigna automáticamente</small>}
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <Percent size={14} /> Agregar descuento (Bs)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={descuento}
                                    onChange={(e) => setDescuento(e.target.value)}
                                    placeholder="0.00"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            crearVentaBtnRef.current?.focus();
                                        }
                                    }}
                                />
                            </div>

                            {tipoVenta === 'pagada' && (
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        Método de pago
                                    </label>
                                    <div className="sales-payment-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                        {paymentMethods.map(method => (
                                            <button
                                                key={method.value}
                                                className={`sales-payment-btn ${metodoPago === method.value ? 'active' : ''}`}
                                                onClick={() => setMetodoPago(method.value)}
                                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '1rem 0.5rem', borderRadius: '8px', border: `1px solid ${metodoPago === method.value ? 'var(--brand-primary)' : 'var(--border-color)'}`, backgroundColor: metodoPago === method.value ? 'rgba(var(--brand-primary-rgb), 0.1)' : 'var(--bg-secondary)', color: metodoPago === method.value ? 'var(--brand-primary)' : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                            >
                                                {method.icon}
                                                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{method.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tipoVenta === 'credito' && (
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        Plazo del Crédito
                                    </label>
                                    <select
                                        value={plazoCredito}
                                        onChange={(e) => setPlazoCredito(parseInt(e.target.value))}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    >
                                        <option value={7}>7 días</option>
                                        <option value={15}>15 días</option>
                                        <option value={30}>30 días</option>
                                        <option value={60}>60 días</option>
                                        <option value={90}>90 días</option>
                                    </select>
                                </div>
                            )}

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <FileText size={14} /> Nota del comprobante
                                </label>
                                <textarea
                                    value={nota}
                                    onChange={(e) => setNota(e.target.value)}
                                    placeholder="Añadir observaciones..."
                                    rows="2"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'none' }}
                                />
                            </div>
                        </div>

                        <div className="sales-cart-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '1.5rem', backgroundColor: 'var(--bg-primary)' }}>
                            <div className="sales-final-total" style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                    <span>Subtotal</span>
                                    <span>Bs {cartTotal.toFixed(2)}</span>
                                </div>
                                {parseFloat(descuento) > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                        <span>Descuento</span>
                                        <span style={{ color: '#ef4444' }}>- Bs {parseFloat(descuento).toFixed(2)}</span>
                                    </div>
                                )}
                                <div 
                                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--brand-primary)', cursor: 'pointer', userSelect: 'none', alignItems: 'center' }}
                                    onClick={() => setMostrarGanancia(!mostrarGanancia)}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        Ganancia Estimada
                                        <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: mostrarGanancia ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                    </span>
                                    <span style={{ fontWeight: 600 }}>
                                        {mostrarGanancia ? `Bs ${ganancia.toFixed(2)}` : '***'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)', marginTop: '0.5rem' }}>
                                    <span style={{ fontWeight: 600 }}>Total a Cobrar</span>
                                    <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Bs {finalTotal.toFixed(2)}</span>
                                </div>
                            </div>
                            <button
                                ref={crearVentaBtnRef}
                                className="btn-primary sales-confirm-btn"
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={handleCompleteSale}
                                disabled={processing}
                            >
                                <CheckCircle size={16} />
                                {processing ? 'Procesando...' : (editingSaleId ? 'Guardar Cambios' : 'Crear la Venta')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Preview Lightbox */}
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', animation: 'fadeIn 0.2s ease'
                    }}
                >
                    <button
                        onClick={() => setPreviewImage(null)}
                        style={{
                            position: 'absolute', top: '1.5rem', right: '1.5rem',
                            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                            width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'white', transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.15)'}
                    >
                        <X size={20} />
                    </button>
                    <img
                        src={previewImage.src}
                        alt={previewImage.nombre}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '80vw', maxHeight: '75vh', borderRadius: '12px',
                            objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            cursor: 'default'
                        }}
                    />
                    <p style={{ color: 'white', marginTop: '1rem', fontSize: '1rem', fontWeight: 500, textAlign: 'center' }}>
                        {previewImage.nombre}
                    </p>
                </div>
            )}
            {/* Style for product highlighting during edit flow */}
            <style>{`
                @keyframes pulse-highlight {
                    0% { background-color: transparent; }
                    50% { background-color: rgba(34, 197, 94, 0.2); }
                    100% { background-color: transparent; }
                }
                .highlight-edit {
                    animation: pulse-highlight 2s ease-in-out infinite;
                    border: 2px solid var(--success-green) !important;
                    position: relative;
                }
                .highlight-edit::after {
                    content: 'Editando';
                    position: absolute;
                    top: -8px;
                    right: 8px;
                    background: var(--success-green);
                    color: white;
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .edit-continue-btn {
                    background: #22C55E !important; /* Green-500 */
                    color: white !important;
                    border: none !important;
                    box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
                    font-size: 1rem !important;
                    font-weight: 700 !important;
                    animation: pulse-edit-btn 2s infinite;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                .edit-continue-btn:hover {
                    background: #16A34A !important; /* Green-600 */
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(34, 197, 94, 0.6);
                }
                body.light-mode .edit-continue-btn {
                    background: #22C55E !important; /* Green-500 */
                    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
                }
                body.light-mode .edit-continue-btn:hover {
                    background: #16A34A !important; /* Green-600 */
                    box-shadow: 0 6px 20px rgba(22, 163, 74, 0.5);
                    transform: translateY(-2px) scale(1.02);
                }
                @keyframes pulse-edit-btn {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                    70% { transform: scale(1.02); box-shadow: 0 0 0 12px rgba(34, 197, 94, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
            `}</style>
        </div>
    );
};

export default SalesPage;
