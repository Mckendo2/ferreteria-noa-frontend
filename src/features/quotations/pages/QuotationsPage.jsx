import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import {
    Search, Trash2, Plus, Minus, Package, Image as ImageIcon, X, CheckCircle,
    Filter, User, UserPlus, FileText, ClipboardList, DollarSign, Printer,
    Ban, ChevronDown, ChevronRight, Clock, CheckSquare, AlertCircle, Banknote,
    CreditCard, ArrowRightLeft, Percent, MessageCircle
} from 'lucide-react';

// ─── WhatsApp SVG Icon ────────────────────────────────────────────────────────
const WhatsAppIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.126 1.533 5.862L.057 23.859a.5.5 0 0 0 .611.64l6.29-1.648A11.935 11.935 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.872 9.872 0 0 1-5.031-1.377l-.361-.214-3.735.979.997-3.645-.235-.375A9.867 9.867 0 0 1 2.118 12C2.118 6.56 6.56 2.118 12 2.118c5.441 0 9.882 4.441 9.882 9.882 0 5.44-4.441 9.882-9.882 9.882z"/>
    </svg>
);
import { getAvailableProducts } from '../../../features/sales/services/saleService';
import { getClients, createClient } from '../../../features/clients/services/clientService';
import { getQuotations, createQuotation, cobrarQuotation, anularQuotation } from '../services/quotationService';
import { generateQuotationPDF } from '../utils/quotationPdfGenerator';
import Swal from 'sweetalert2';
import { BASE_URL } from '../../../services/api';

// ─── Status Badge Component ───────────────────────────────────────────────────
const StatusBadge = ({ estado }) => {
    const config = {
        pendiente: { label: 'Pendiente', cls: 'quote-badge-pending', icon: <Clock size={11} /> },
        cobrada:   { label: 'Cobrada',   cls: 'quote-badge-paid',    icon: <CheckSquare size={11} /> },
        anulada:   { label: 'Anulada',   cls: 'quote-badge-void',    icon: <Ban size={11} /> },
    };
    const cfg = config[estado] || config.pendiente;
    return (
        <span className={`quote-status-badge ${cfg.cls}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const QuotationsPage = () => {
    const [activeTab, setActiveTab] = useState('nueva'); // 'nueva' | 'historial'

    // ── Product catalog state ─────────────────────────────────────────────────
    const [allProducts, setAllProducts] = useState([]);
    const [searchTerm, setSearchTerm]   = useState('');
    const [loading, setLoading]         = useState(true);

    // ── Cart state ────────────────────────────────────────────────────────────
    const [cart, setCart]           = useState([]);
    const [descuento, setDescuento] = useState(0);
    const [adelanto, setAdelanto]   = useState(0);
    const [nota, setNota]           = useState('');

    // ── Client state ──────────────────────────────────────────────────────────
    const [clientes, setClientes]             = useState([]);
    const [selectedCliente, setSelectedCliente] = useState(null);

    // ── History state ─────────────────────────────────────────────────────────
    const [quotations, setQuotations]     = useState([]);
    const [histLoading, setHistLoading]   = useState(false);
    const [histSearch, setHistSearch]     = useState('');
    const [histFilter, setHistFilter]     = useState('todos'); // 'todos' | 'pendiente' | 'cobrada' | 'anulada'
    const [expandedId, setExpandedId]     = useState(null);
    const [expandedData, setExpandedData] = useState({});
    const [processing, setProcessing]     = useState(false);

    // ── Preview ───────────────────────────────────────────────────────────────
    const [previewImage, setPreviewImage] = useState(null);
    const saveBtnRef = useRef(null);

    // ── Computed values ───────────────────────────────────────────────────────
    const cartTotal    = cart.reduce((s, i) => s + i.cantidad * i.precio, 0);
    const finalTotal   = Math.max(0, cartTotal - (parseFloat(descuento) || 0));
    const finalAdelanto = Math.min(parseFloat(adelanto) || 0, finalTotal);
    const saldoPendiente = finalTotal - finalAdelanto;

    // Filter products
    const filteredProducts = allProducts.filter(p => {
        const term = searchTerm.toLowerCase();
        return p.nombre.toLowerCase().includes(term) ||
               (p.codigo_barras && p.codigo_barras.includes(term));
    });

    // Filter history
    const filteredQuotations = quotations.filter(q => {
        const matchSearch = histSearch === '' ||
            String(q.id).includes(histSearch) ||
            q.cliente_nombre.toLowerCase().includes(histSearch.toLowerCase());
        const matchFilter = histFilter === 'todos' || q.estado === histFilter;
        return matchSearch && matchFilter;
    });

    // ── Initial data load ─────────────────────────────────────────────────────
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [prods, clients] = await Promise.all([
                    getAvailableProducts(),
                    getClients()
                ]);
                setAllProducts(prods);
                setClientes(clients.filter(c => c.activo === 1));
            } catch (err) {
                console.error('Error cargando datos iniciales:', err);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === 'historial') {
            loadHistory();
        }
    }, [activeTab]);

    const loadHistory = async () => {
        setHistLoading(true);
        try {
            const data = await getQuotations();
            setQuotations(data);
        } catch (err) {
            console.error('Error cargando historial:', err);
        } finally {
            setHistLoading(false);
        }
    };

    // ── Cart operations ───────────────────────────────────────────────────────
    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(i => i.producto_id === product.id);
            if (existing) {
                return prev.map(i =>
                    i.producto_id === product.id
                        ? { ...i, cantidad: i.cantidad + 1 }
                        : i
                );
            }
            return [...prev, {
                producto_id: product.id,
                nombre: product.nombre,
                precio: parseFloat(product.precio_venta),
                cantidad: 1,
                stock: product.stock,
                imagen: product.imagen
            }];
        });
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(i => i.producto_id !== id));
    const clearCart = () => { setCart([]); setDescuento(0); setAdelanto(0); setNota(''); setSelectedCliente(null); };

    const updateQty = (id, qty) => {
        if (qty < 1) return removeFromCart(id);
        setCart(prev => prev.map(i => i.producto_id === id ? { ...i, cantidad: qty } : i));
    };

    const updatePrice = (id, price) => {
        setCart(prev => prev.map(i => i.producto_id === id ? { ...i, precio: price } : i));
    };

    // ── Add new client via Swal ───────────────────────────────────────────────
    const handleAddClient = async () => {
        const { value } = await Swal.fire({
            title: 'Nuevo Cliente',
            html:
                '<input id="swal-nombre" class="swal2-input" placeholder="Nombre completo *">' +
                '<input id="swal-telefono" class="swal2-input" placeholder="Teléfono u Ocupación">' +
                '<input id="swal-email" class="swal2-input" placeholder="Correo (Opcional)">' +
                '<input id="swal-dir" class="swal2-input" placeholder="Dirección (Opcional)">',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Registrar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm', cancelButton: 'my-swal-cancel' },
            preConfirm: () => {
                const nombre = document.getElementById('swal-nombre').value;
                if (!nombre) { Swal.showValidationMessage('El nombre es obligatorio'); return false; }
                return {
                    nombre,
                    telefono: document.getElementById('swal-telefono').value,
                    email: document.getElementById('swal-email').value,
                    direccion: document.getElementById('swal-dir').value,
                    activo: 1
                };
            }
        });

        if (value) {
            try {
                const newClient = await createClient(value);
                const opt = { value: newClient.id, label: `${newClient.nombre}${newClient.telefono ? ` - ${newClient.telefono}` : ''}` };
                setClientes(prev => [...prev, newClient]);
                setSelectedCliente(opt);
                Swal.fire({ title: '¡Cliente registrado!', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, customClass: { popup: 'my-swal-bg' } });
            } catch (err) {
                Swal.fire({ title: 'Error', text: err.response?.data?.error || 'No se pudo registrar el cliente', icon: 'error', customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' } });
            }
        }
    };

    // ── Save quotation ────────────────────────────────────────────────────────
    const handleSaveQuotation = async () => {
        if (cart.length === 0) {
            Swal.fire({ title: 'Sin productos', text: 'Agregá al menos un producto.', icon: 'warning', customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' } });
            return;
        }

        const result = await Swal.fire({
            title: '¿Guardar cotización?',
            html: `
                <div style="text-align:left;color:var(--text-secondary)">
                    <p><strong>${cart.length}</strong> producto(s)</p>
                    <p style="font-size:1.4rem;font-weight:700;color:var(--text-primary);margin-top:.5rem">
                        Total: Bs ${finalTotal.toFixed(2)}
                    </p>
                    ${finalAdelanto > 0 ? `<p style="margin-top:.25rem">Adelanto: Bs ${finalAdelanto.toFixed(2)}</p>` : ''}
                    ${saldoPendiente > 0 ? `<p style="margin-top:.25rem">Saldo pendiente: Bs ${saldoPendiente.toFixed(2)}</p>` : ''}
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm', cancelButton: 'my-swal-cancel' }
        });

        if (!result.isConfirmed) return;

        setProcessing(true);
        try {
            const payload = {
                cliente_id: selectedCliente ? selectedCliente.value : null,
                adelanto: finalAdelanto,
                descuento: parseFloat(descuento) || 0,
                nota,
                detalles: cart.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad, precio: i.precio }))
            };

            const res = await createQuotation(payload);

            // Build shared data for PDF / WhatsApp
            const shareData = {
                cotizacionId: res.cotizacion_id,
                fecha: new Date(),
                cliente: selectedCliente ? selectedCliente.label : 'Consumidor Final',
                items: cart,
                subtotal: cartTotal,
                descuento: parseFloat(descuento) || 0,
                total: finalTotal,
                adelanto: finalAdelanto,
                saldo: saldoPendiente,
                nota
            };

            // ── Post-save options ──────────────────────────────────────────────
            const actionResult = await Swal.fire({
                title: '¡Cotización guardada!',
                html: `<p style="color:var(--text-secondary)">Cotización <strong>N° ${res.cotizacion_id}</strong> registrada exitosamente.</p>
                       <p style="margin-top:.5rem;font-size:.85rem;color:var(--text-secondary)">¿Qué deseas hacer?</p>`,
                icon: 'success',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: '🖨️ Imprimir PDF',
                denyButtonText: '📲 Enviar WhatsApp',
                cancelButtonText: 'Cerrar',
                customClass: {
                    popup: 'my-swal-bg',
                    confirmButton: 'my-swal-confirm',
                    denyButton: 'my-swal-whatsapp',
                    cancelButton: 'my-swal-cancel'
                }
            });

            if (actionResult.isConfirmed) {
                generateQuotationPDF(shareData);
            } else if (actionResult.isDenied) {
                const text = buildWhatsAppText(shareData);
                const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank', 'noopener,noreferrer');
            }

            clearCart();
        } catch (err) {
            Swal.fire({ title: 'Error', text: err.response?.data?.error || 'No se pudo guardar la cotización.', icon: 'error', customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' } });
        } finally {
            setProcessing(false);
        }
    };

    // ── History actions ───────────────────────────────────────────────────────
    const handlePrintQuotation = async (quote) => {
        try {
            let det = expandedData[quote.id];
            if (!det) {
                const { getQuotationById } = await import('../services/quotationService');
                const full = await getQuotationById(quote.id);
                det = full.detalles;
                setExpandedData(prev => ({ ...prev, [quote.id]: det }));
            }
            generateQuotationPDF({
                cotizacionId: quote.id,
                fecha: new Date(quote.fecha),
                cliente: quote.cliente_nombre,
                items: det.map(d => ({ nombre: d.producto_nombre, cantidad: d.cantidad, precio: parseFloat(d.precio) })),
                subtotal: parseFloat(quote.total) + parseFloat(quote.descuento || 0),
                descuento: parseFloat(quote.descuento || 0),
                total: parseFloat(quote.total),
                adelanto: parseFloat(quote.adelanto || 0),
                saldo: parseFloat(quote.saldo_pendiente || 0)
            });
        } catch (err) {
            Swal.fire({ title: 'Error', text: 'No se pudo generar el PDF.', icon: 'error', customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' } });
        }
    };

    // ── Build WhatsApp text message ────────────────────────────────────────────
    const buildWhatsAppText = ({ cotizacionId, cliente, items, descuento, total, adelanto, saldo, nota }) => {
        const fecha = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
        let msg = `*FERRETERÍA NOA*\n`;
        msg += `_Cotización / Presupuesto_\n`;
        msg += `*N° ${cotizacionId}* | ${fecha}\n`;
        msg += `*Cliente:* ${cliente}\n`;
        msg += `\n*Productos:*\n`;
        items.forEach(item => {
            const sub = (item.cantidad * item.precio).toFixed(2);
            msg += `  • ${item.nombre} × ${item.cantidad} — Bs ${sub}\n`;
        });
        msg += `\n`;
        if (descuento > 0) msg += `Descuento: Bs ${parseFloat(descuento).toFixed(2)}\n`;
        msg += `*TOTAL: Bs ${parseFloat(total).toFixed(2)}*\n`;
        if (parseFloat(adelanto) > 0) {
            msg += `Adelanto: Bs ${parseFloat(adelanto).toFixed(2)}\n`;
            msg += `*Saldo pendiente: Bs ${parseFloat(saldo).toFixed(2)}*\n`;
        }
        if (nota) msg += `\n_${nota}_\n`;
        msg += `\n_Válida por 30 días. ¡Gracias por su preferencia!_`;
        return msg;
    };

    // ── Share quotation via WhatsApp (from history) ────────────────────────────
    const handleWhatsApp = async (quote) => {
        try {
            let det = expandedData[quote.id];
            if (!det) {
                const { getQuotationById } = await import('../services/quotationService');
                const full = await getQuotationById(quote.id);
                det = full.detalles;
                setExpandedData(prev => ({ ...prev, [quote.id]: det }));
            }
            const text = buildWhatsAppText({
                cotizacionId: quote.id,
                cliente: quote.cliente_nombre,
                items: det.map(d => ({ nombre: d.producto_nombre, cantidad: d.cantidad, precio: parseFloat(d.precio) })),
                descuento: parseFloat(quote.descuento || 0),
                total: parseFloat(quote.total),
                adelanto: parseFloat(quote.adelanto || 0),
                saldo: parseFloat(quote.saldo_pendiente || 0),
                nota: quote.nota
            });
            // If the client has a phone, open direct chat; otherwise open generic share
            const phone = quote.cliente_telefono ? quote.cliente_telefono.replace(/\D/g, '') : '';
            const url = phone
                ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
                : `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (err) {
            Swal.fire({ title: 'Error', text: 'No se pudo generar el mensaje.', icon: 'error', customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' } });
        }
    };

    const handleCobrar = async (quote) => {
        // Ask for payment method
        const { value: metodo, isConfirmed } = await Swal.fire({
            title: `Cobrar Cotización #${quote.id}`,
            html: `
                <div style="text-align:left;color:var(--text-secondary)">
                    <p style="margin-bottom:.75rem">Total: <strong style="color:var(--text-primary);font-size:1.2rem">Bs ${parseFloat(quote.total).toFixed(2)}</strong></p>
                    ${parseFloat(quote.adelanto) > 0 ? `<p style="margin-bottom:.5rem">Adelanto ya recibido: <strong>Bs ${parseFloat(quote.adelanto).toFixed(2)}</strong></p>
                    <p style="margin-bottom:.75rem">Saldo a cobrar: <strong style="color:#f59e0b">Bs ${parseFloat(quote.saldo_pendiente).toFixed(2)}</strong></p>` : ''}
                    <label style="display:block;margin-bottom:.5rem;font-weight:600;color:var(--text-primary)">Método de pago</label>
                    <select id="swal-metodo" class="swal2-input" style="margin:0;width:100%">
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transferencia</option>
                    </select>
                    <p style="margin-top:.75rem;font-size:.82rem;color:var(--text-secondary)">
                        ⚠️ Esto creará una venta real y descontará el stock.
                    </p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '💰 Cobrar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm', cancelButton: 'my-swal-cancel' },
            preConfirm: () => document.getElementById('swal-metodo').value
        });

        if (!isConfirmed) return;

        setProcessing(true);
        try {
            const res = await cobrarQuotation(quote.id, metodo);
            await loadHistory();
            Swal.fire({
                title: '¡Cobrada!',
                text: `Venta #${res.venta_id} registrada y stock descontado.`,
                icon: 'success',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } catch (err) {
            Swal.fire({ title: 'Error', text: err.response?.data?.error || 'No se pudo cobrar la cotización.', icon: 'error', customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' } });
        } finally {
            setProcessing(false);
        }
    };

    const handleAnular = async (quote) => {
        const result = await Swal.fire({
            title: `¿Anular Cotización #${quote.id}?`,
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, anular',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm', cancelButton: 'my-swal-cancel' }
        });

        if (!result.isConfirmed) return;

        setProcessing(true);
        try {
            await anularQuotation(quote.id);
            await loadHistory();
            Swal.fire({ title: 'Anulada', text: 'La cotización fue anulada.', icon: 'info', customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' } });
        } catch (err) {
            Swal.fire({ title: 'Error', text: err.response?.data?.error || 'No se pudo anular.', icon: 'error', customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' } });
        } finally {
            setProcessing(false);
        }
    };

    const toggleExpandRow = async (id) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        if (!expandedData[id]) {
            try {
                const { getQuotationById } = await import('../services/quotationService');
                const full = await getQuotationById(id);
                setExpandedData(prev => ({ ...prev, [id]: full.detalles }));
            } catch { /* ignore */ }
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // ── RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="quotations-page">
            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={26} color="var(--primary-blue)" />
                    <div>
                        <h2 style={{ margin: 0 }}>Cotizaciones</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Genera presupuestos para tus clientes
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────────── */}
            <div className="quote-tabs">
                <button
                    className={`quote-tab-btn ${activeTab === 'nueva' ? 'active' : ''}`}
                    onClick={() => setActiveTab('nueva')}
                    id="tab-nueva-cotizacion"
                >
                    <Plus size={16} />
                    Nueva Cotización
                </button>
                <button
                    className={`quote-tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
                    onClick={() => setActiveTab('historial')}
                    id="tab-historial-cotizaciones"
                >
                    <ClipboardList size={16} />
                    Historial
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ── TAB: Nueva Cotización ────────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'nueva' && (
                <div className="quote-new-layout">
                    {/* LEFT: Product catalog */}
                    <div className="quote-products-panel">
                        <div className="quote-products-header">
                            <h3>Productos</h3>
                            <div className="sales-search-wrapper">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar producto o código..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button className="sales-search-clear" onClick={() => setSearchTerm('')}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Filter size={13} />
                                {filteredProducts.length} productos disponibles
                            </div>
                        </div>

                        {loading ? (
                            <div className="sales-loading">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="sales-product-card-skeleton">
                                        <div className="skeleton" style={{ height: '120px', borderRadius: '8px 8px 0 0' }} />
                                        <div style={{ padding: '0.75rem' }}>
                                            <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                                            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="sales-empty-state">
                                <Package size={48} />
                                <h3>No hay productos</h3>
                                <p>{searchTerm ? 'Intenta con otro término.' : 'No hay productos disponibles.'}</p>
                            </div>
                        ) : (
                            <div className="sales-products-grid">
                                {filteredProducts.map(product => {
                                    const inCart = cart.find(c => c.producto_id === product.id);
                                    const outOfStock = product.stock <= 0;
                                    return (
                                        <div
                                            key={product.id}
                                            className={`sales-product-card ${inCart ? 'in-cart' : ''} ${outOfStock ? 'out-of-stock' : ''}`}
                                            onClick={() => !outOfStock && addToCart(product)}
                                            style={outOfStock ? { opacity: 0.65, cursor: 'not-allowed' } : {}}
                                        >
                                            <div className="sales-card-image">
                                                {product.imagen ? (
                                                    <img
                                                        src={product.imagen.startsWith('http') ? product.imagen : `${BASE_URL}${product.imagen}`}
                                                        alt={product.nombre}
                                                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
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
                                                <div className={`sales-card-stock-badge ${outOfStock ? 'empty' : ''}`} style={outOfStock ? { background: 'var(--danger-red)' } : {}} translate="no">
                                                    {outOfStock ? 'Agotado' : `${product.stock} unid.`}
                                                </div>
                                            </div>
                                            <div className="sales-card-info">
                                                <span className="sales-card-name" translate="no">{product.nombre}</span>
                                                {product.categoria_nombre && (
                                                    <span className="sales-card-category" translate="no">{product.categoria_nombre}</span>
                                                )}
                                                <span className="sales-card-price" translate="no">Bs {parseFloat(product.precio_venta).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Cart + Config */}
                    <div className="quote-cart-panel">
                        <div className="sales-cart-header">
                            <div className="sales-cart-title">
                                <FileText size={20} />
                                <h3>Cotización</h3>
                            </div>
                            {cart.length > 0 && (
                                <span className="sales-cart-count">{cart.length} items</span>
                            )}
                        </div>

                        {/* Cart items */}
                        {cart.length === 0 ? (
                            <div className="sales-cart-empty">
                                <FileText size={40} />
                                <p>Selecciona productos para agregar a la cotización</p>
                            </div>
                        ) : (
                            <div className="sales-cart-items">
                                {cart.map(item => (
                                    <div key={item.producto_id} className="sales-cart-item">
                                        <div
                                            className="sales-cart-item-image"
                                            onClick={() => item.imagen && setPreviewImage({ src: item.imagen.startsWith('http') ? item.imagen : `${BASE_URL}${item.imagen}`, nombre: item.nombre })}
                                            style={{ cursor: item.imagen ? 'pointer' : 'default' }}
                                        >
                                            {item.imagen ? (
                                                <img
                                                    src={item.imagen.startsWith('http') ? item.imagen : `${BASE_URL}${item.imagen}`}
                                                    alt={item.nombre}
                                                    onError={e => { e.target.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <div className="sales-cart-item-placeholder"><ImageIcon size={16} /></div>
                                            )}
                                        </div>
                                        <div className="sales-cart-item-details">
                                            <span className="sales-cart-item-name" translate="no">{item.nombre}</span>
                                            <span className="sales-cart-item-price">Bs {Number(item.precio).toFixed(2)}</span>
                                        </div>
                                        <div className="sales-cart-item-qty">
                                            <button onClick={() => updateQty(item.producto_id, item.cantidad - 1)}><Minus size={14} /></button>
                                            <input
                                                type="number"
                                                value={item.cantidad}
                                                onChange={e => {
                                                    const v = parseInt(e.target.value);
                                                    if (!isNaN(v) && v >= 1) updateQty(item.producto_id, v);
                                                }}
                                                className="sales-cart-qty-input"
                                                min="1"
                                            />
                                            <button onClick={() => updateQty(item.producto_id, item.cantidad + 1)}><Plus size={14} /></button>
                                        </div>
                                        <div className="sales-cart-item-subtotal">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Bs</span>
                                                <input
                                                    type="number"
                                                    value={item.precio}
                                                    onChange={e => {
                                                        const v = parseFloat(e.target.value);
                                                        if (!isNaN(v) && v >= 0) updatePrice(item.producto_id, v);
                                                    }}
                                                    style={{ width: '70px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem', textAlign: 'right' }}
                                                    step="0.5"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                        <button className="sales-cart-item-remove" onClick={() => removeFromCart(item.producto_id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer config */}
                        {cart.length > 0 && (
                            <div className="quote-cart-footer">
                                {/* Client selector */}
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        <User size={13} /> Cliente (Opcional)
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <Select
                                                classNamePrefix="react-select"
                                                placeholder="Buscar cliente..."
                                                isClearable
                                                options={clientes.map(c => ({ value: c.id, label: `${c.nombre}${c.telefono ? ` - ${c.telefono}` : ''}` }))}
                                                value={selectedCliente}
                                                onChange={setSelectedCliente}
                                                noOptionsMessage={() => 'No se encontraron clientes'}
                                            />
                                        </div>
                                        <button
                                            className="btn-primary"
                                            onClick={handleAddClient}
                                            style={{ padding: '0 0.75rem', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Nuevo cliente"
                                        >
                                            <UserPlus size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Discount */}
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        <Percent size={13} /> Descuento (Bs)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={descuento}
                                        onChange={e => setDescuento(e.target.value)}
                                        placeholder="0.00"
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                {/* Down payment / adelanto */}
                                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        <DollarSign size={13} /> Adelanto (Bs) <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 400 }}>(opcional)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={adelanto}
                                        onChange={e => setAdelanto(e.target.value)}
                                        placeholder="0.00"
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    />
                                </div>

                                {/* Note */}
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        <FileText size={13} /> Nota (opcional)
                                    </label>
                                    <textarea
                                        value={nota}
                                        onChange={e => setNota(e.target.value)}
                                        placeholder="Observaciones..."
                                        rows={2}
                                        style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.875rem' }}
                                    />
                                </div>

                                {/* Summary */}
                                <div className="quote-summary">
                                    <div className="quote-summary-row">
                                        <span>Subtotal</span>
                                        <span>Bs {cartTotal.toFixed(2)}</span>
                                    </div>
                                    {parseFloat(descuento) > 0 && (
                                        <div className="quote-summary-row" style={{ color: '#ef4444' }}>
                                            <span>Descuento</span>
                                            <span>- Bs {parseFloat(descuento).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="quote-summary-row quote-summary-total">
                                        <span>Total</span>
                                        <span>Bs {finalTotal.toFixed(2)}</span>
                                    </div>
                                    {finalAdelanto > 0 && (
                                        <>
                                            <div className="quote-summary-row" style={{ color: 'var(--accent-mint)' }}>
                                                <span>Adelanto</span>
                                                <span>Bs {finalAdelanto.toFixed(2)}</span>
                                            </div>
                                            <div className="quote-summary-row" style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                                                <span>Saldo Pendiente</span>
                                                <span>Bs {saldoPendiente.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                    <button className="btn-secondary" onClick={clearCart} style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Trash2 size={15} /> Limpiar
                                    </button>
                                    <button
                                        ref={saveBtnRef}
                                        className="btn-primary"
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                        onClick={handleSaveQuotation}
                                        disabled={processing}
                                    >
                                        {processing ? 'Guardando...' : (<><FileText size={16} /> Guardar Cotización</>)}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ── TAB: Historial ─────────────────────────────────────────── */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'historial' && (
                <div className="quote-history-panel">
                    {/* Filters bar */}
                    <div className="quote-history-toolbar">
                        <div className="sales-search-wrapper" style={{ maxWidth: '320px' }}>
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por N° o cliente..."
                                value={histSearch}
                                onChange={e => setHistSearch(e.target.value)}
                            />
                            {histSearch && (
                                <button className="sales-search-clear" onClick={() => setHistSearch('')}><X size={14} /></button>
                            )}
                        </div>

                        <div className="quote-filter-tabs">
                            {['todos', 'pendiente', 'cobrada', 'anulada'].map(f => (
                                <button
                                    key={f}
                                    className={`quote-filter-pill ${histFilter === f ? 'active' : ''}`}
                                    onClick={() => setHistFilter(f)}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>

                        <button className="btn-secondary" onClick={loadHistory} style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                            <Filter size={14} /> Actualizar
                        </button>
                    </div>

                    {/* Table */}
                    {histLoading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Cargando historial...
                        </div>
                    ) : filteredQuotations.length === 0 ? (
                        <div className="sales-empty-state" style={{ marginTop: '2rem' }}>
                            <ClipboardList size={48} />
                            <h3>Sin cotizaciones</h3>
                            <p>{histSearch || histFilter !== 'todos' ? 'No hay resultados para los filtros aplicados.' : 'Aún no hay cotizaciones registradas.'}</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="data-table quote-history-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}></th>
                                        <th>N°</th>
                                        <th>Fecha</th>
                                        <th>Cliente</th>
                                        <th>Total</th>
                                        <th className="quote-col-adelanto">Adelanto</th>
                                        <th>Saldo</th>
                                        <th>Estado</th>
                                        <th style={{ textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQuotations.map(quote => (
                                        <React.Fragment key={quote.id}>
                                            <tr className={`quote-row ${expandedId === quote.id ? 'expanded' : ''}`}>
                                                <td>
                                                    <button
                                                        className="quote-expand-btn"
                                                        onClick={() => toggleExpandRow(quote.id)}
                                                        title="Ver detalle"
                                                    >
                                                        {expandedId === quote.id
                                                            ? <ChevronDown size={16} />
                                                            : <ChevronRight size={16} />}
                                                    </button>
                                                </td>
                                                <td>
                                                    <span className="quote-id-badge">#{quote.id}</span>
                                                </td>
                                                <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                                                    {new Date(quote.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 500 }}>{quote.cliente_nombre}</span>
                                                    {quote.cliente_telefono && (
                                                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{quote.cliente_telefono}</span>
                                                    )}
                                                </td>
                                                <td style={{ fontWeight: 600 }}>Bs {parseFloat(quote.total).toFixed(2)}</td>
                                                <td className="quote-col-adelanto" style={{ color: 'var(--accent-mint)' }}>
                                                    {parseFloat(quote.adelanto) > 0
                                                        ? `Bs ${parseFloat(quote.adelanto).toFixed(2)}`
                                                        : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                                                </td>
                                                <td style={{ color: parseFloat(quote.saldo_pendiente) > 0 ? 'var(--accent-amber)' : 'var(--accent-mint)', fontWeight: 500 }}>
                                                    Bs {parseFloat(quote.saldo_pendiente).toFixed(2)}
                                                </td>
                                                <td>
                                                    <StatusBadge estado={quote.estado} />
                                                </td>
                                                <td>
                                                    <div className="quote-actions">
                                                        {/* Print */}
                                                        <button
                                                            className="quote-action-btn print"
                                                            onClick={() => handlePrintQuotation(quote)}
                                                            title="Imprimir PDF"
                                                        >
                                                            <Printer size={15} />
                                                        </button>
                                                        {/* WhatsApp */}
                                                        <button
                                                            className="quote-action-btn whatsapp"
                                                            onClick={() => handleWhatsApp(quote)}
                                                            title={quote.cliente_telefono ? `Enviar WhatsApp a ${quote.cliente_telefono}` : 'Compartir por WhatsApp'}
                                                        >
                                                            <WhatsAppIcon size={15} />
                                                        </button>
                                                        {/* Cobrar */}
                                                        {quote.estado === 'pendiente' && (
                                                            <button
                                                                className="quote-action-btn pay"
                                                                onClick={() => handleCobrar(quote)}
                                                                title="Cobrar cotización"
                                                                disabled={processing}
                                                            >
                                                                <DollarSign size={15} />
                                                            </button>
                                                        )}
                                                        {/* Anular */}
                                                        {quote.estado === 'pendiente' && (
                                                            <button
                                                                className="quote-action-btn void"
                                                                onClick={() => handleAnular(quote)}
                                                                title="Anular cotización"
                                                                disabled={processing}
                                                            >
                                                                <Ban size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded detail row */}
                                            {expandedId === quote.id && (
                                                <tr className="quote-detail-row">
                                                    <td colSpan={9}>
                                                        <div className="quote-detail-expanded">
                                                            {!expandedData[quote.id] ? (
                                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cargando detalle...</p>
                                                            ) : expandedData[quote.id].length === 0 ? (
                                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sin productos registrados.</p>
                                                            ) : (
                                                                <table className="quote-detail-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Producto</th>
                                                                            <th>Cant.</th>
                                                                            <th>P. Unit.</th>
                                                                            <th>Subtotal</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {expandedData[quote.id].map(d => (
                                                                            <tr key={d.id}>
                                                                                <td translate="no">{d.producto_nombre}</td>
                                                                                <td>{d.cantidad}</td>
                                                                                <td>Bs {parseFloat(d.precio).toFixed(2)}</td>
                                                                                <td style={{ fontWeight: 600 }}>Bs {parseFloat(d.subtotal).toFixed(2)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            )}
                                                            {quote.nota && (
                                                                <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
                                                                    📝 <em>{quote.nota}</em>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Image Preview Modal ───────────────────────────────────── */}
            {previewImage && (
                <div className="sales-image-preview-overlay" onClick={() => setPreviewImage(null)}>
                    <div className="sales-image-preview-modal" onClick={e => e.stopPropagation()}>
                        <button className="sales-image-preview-close" onClick={() => setPreviewImage(null)}><X size={20} /></button>
                        <img src={previewImage.src} alt={previewImage.nombre} />
                        <p>{previewImage.nombre}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotationsPage;
