import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import Select from 'react-select';
import useMovements from '../hooks/useMovements';
import CountUp from 'react-countup';
import { ShoppingBag, ShoppingCart, ArrowLeftRight, TrendingDown, Banknote, Calendar, X, Package, Clock, User, CreditCard, CheckCircle, FileText, Edit } from 'lucide-react';
import { getSaleById } from '../../sales/services/saleService';
import { generateSalePDF } from '../../sales/utils/salePdfGenerator';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import es from 'date-fns/locale/es';
import EditSaleView from '../components/EditSaleView';
import Swal from 'sweetalert2';

registerLocale('es', es);

const PERIOD_OPTIONS = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'yearly', label: 'Anual' },
];

const DatePickerStyles = () => (
    <style>{`
        .date-picker-input {
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-size: 0.9rem;
            width: 95px;
            cursor: pointer;
            outline: none;
            font-weight: 600;
            text-align: center;
        }
        .react-datepicker-wrapper {
            width: auto;
        }
        .movement-row {
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .movement-row:hover {
            background-color: rgba(255, 255, 255, 0.03) !important;
        }
        .side-panel-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(2px);
            z-index: 9998;
            animation: fadeIn 0.2s ease;
        }
        .sale-detail-panel {
            position: fixed;
            top: 0;
            right: 0;
            width: 480px;
            height: 100%;
            background: var(--bg-card);
            border-left: 1px solid var(--border-light);
            box-shadow: -15px 0 45px rgba(0, 0, 0, 0.4);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            overflow-y: auto;
            scrollbar-width: thin;
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        @media (max-width: 600px) {
            .sale-detail-panel {
                width: 100% !important;
            }
            .panel-body {
                padding: 1rem;
            }
        }
        .panel-header-luxury {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-light);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255, 255, 255, 0.01);
        }
        .panel-body {
            padding: 1.5rem;
            flex: 1;
        }
        .detail-section {
            margin-bottom: 2rem;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.8rem;
            font-size: 0.95rem;
        }
        .detail-label {
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .detail-value {
            font-weight: 600;
            color: var(--text-primary);
        }
        .product-item-mini {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 8px;
            margin-bottom: 0.5rem;
            border: 1px solid var(--border-light);
        }
        .ganancia-highlight {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.2);
            padding: 1rem;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1rem;
        }
        .panel-footer-luxury {
            padding: 1.25rem 1.5rem;
            background: var(--bg-card);
            border-top: 1px solid var(--border-light);
            display: flex;
            gap: 1rem;
            position: sticky;
            bottom: 0;
            z-index: 10;
        }

        .btn-comprobante-luxury {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.6rem;
            background: linear-gradient(135deg, #475569 0%, #334155 100%);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 0.8rem;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .btn-comprobante-luxury:hover {
            background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
        }

        .btn-edit-luxury {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.6rem;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 0.8rem;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);
        }

        .btn-edit-luxury:hover {
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.2);
        }

        /* Light Mode Specific Adjustments for Luxury Buttons */
        body.light-mode .btn-comprobante-luxury {
            background: linear-gradient(135deg, #64748b 0%, #475569 100%);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);
        }
        body.light-mode .btn-comprobante-luxury:hover {
            background: linear-gradient(135deg, #475569 0%, #334155 100%);
            box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.25);
        }
        body.light-mode .btn-edit-luxury {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.25);
        }
        body.light-mode .btn-edit-luxury:hover {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.35);
        }
    `}</style>
);

const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('es-BO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const getStatusBadge = (estado) => {
    const normalized = (estado || 'pagada').toLowerCase();
    if (normalized === 'pagada') return <span className="badge success">Pagada</span>;
    if (normalized === 'credito') return <span className="badge warning">Crédito</span>;
    return <span className="badge">{estado}</span>;
};

const getPaymentLabel = (metodo) => {
    const labels = {
        'efectivo': 'Efectivo',
        'tarjeta': 'Tarjeta',
        'transferencia': 'Transferencia',
        'credito': 'Crédito',
    };
    return labels[metodo] || metodo;
};
const MovementsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        movements,
        balance,
        totalVentas,
        totalGastos,
        loading,
        activePeriod,
        startDate,
        endDate,
        setPeriod,
        setRange,
        refetch,
    } = useMovements();

    const [selectedSale, setSelectedSale] = React.useState(null);
    const [isPanelOpen, setIsPanelOpen] = React.useState(false);
    const [loadingDetail, setLoadingDetail] = React.useState(false);
    const [isEditingInPanel, setIsEditingInPanel] = React.useState(false);
    const [saleToEdit, setSaleToEdit] = React.useState(null);

    const handleMovementClick = async (mov) => {
        // Only trigger for sales (which have a valid structure in backend)
        // Usually movements are sales, but they could be other things.
        // The id in movements refers to the venta_id.
        setLoadingDetail(true);
        setIsPanelOpen(true);
        try {
            const saleData = await getSaleById(mov.id);
            setSelectedSale(saleData);
        } catch (error) {
            console.error("Error fetching sale details:", error);
            setIsPanelOpen(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closePanel = () => {
        setIsPanelOpen(false);
        setIsEditingInPanel(false);
        setTimeout(() => setSelectedSale(null), 400); // Wait for animation
    };

    // Handle returning from SalesPage
    React.useEffect(() => {
        if (location.state?.saleUpdateSuccess) {
            setIsPanelOpen(false); // Ensure panel closes
            Swal.fire({
                title: '¡Venta actualizada!',
                text: 'Los cambios se han guardado exitosamente.',
                icon: 'success',
                customClass: {
                    popup: 'my-swal-bg',
                    confirmButton: 'my-swal-confirm'
                }
            });
            // Clear navigation state
            window.history.replaceState({}, document.title);
            return;
        }

        if (location.state?.openSaleId) {
            const saleId = location.state.openSaleId;
            // Re-open the panel for this sale
            handleMovementClick({ id: saleId });
            // Set to edit mode
            setIsEditingInPanel(true);
            
            // Clear navigation state to prevent re-opening on manual refresh/back
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    return (
        <div className="movements-page" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <DatePickerStyles />
            <header className="page-header">
                <h2>Movimientos</h2>
            </header>

            {/* Metric Cards */}
            <div className="stats-grid">
                <div className="stat-card movements-balance-card">
                    <div className="stat-card-header">
                        <span>Balance</span>
                        <div className="stat-icon-wrapper balance-icon">
                            <ShoppingBag size={18} />
                        </div>
                    </div>
                    {loading ? (
                        <div className="skeleton skeleton-title" style={{ marginTop: '0.5rem', height: '2.5rem' }}></div>
                    ) : (
                        <div className="stat-value">
                            Bs <CountUp end={balance} separator="," decimals={2} duration={1.5} />
                        </div>
                    )}
                    <p className="stat-description">Ganancia total de ventas registradas</p>
                </div>

                <div className="stat-card movements-sales-card">
                    <div className="stat-card-header">
                        <span>Ventas Totales</span>
                        <div className="stat-icon-wrapper sales-icon">
                            <ShoppingCart size={18} />
                        </div>
                    </div>
                    {loading ? (
                        <div className="skeleton skeleton-title" style={{ marginTop: '0.5rem', height: '2.5rem' }}></div>
                    ) : (
                        <div className="stat-value">
                            <CountUp end={totalVentas} duration={1.5} />
                        </div>
                    )}
                    <p className="stat-description">Transacciones en el período</p>
                </div>

                <div className="stat-card" style={{ borderTop: '2px solid var(--danger-red)' }}>
                    <div className="stat-card-header">
                        <span>Gastos Totales</span>
                        <div className="stat-icon-wrapper expense-icon">
                            <TrendingDown size={18} />
                        </div>
                    </div>
                    {loading ? (
                        <div className="skeleton skeleton-title" style={{ marginTop: '0.5rem', height: '2.5rem' }}></div>
                    ) : (
                        <div className="stat-value" style={{ color: 'var(--danger-red)' }}>
                            Bs <CountUp end={totalGastos} separator="," decimals={2} duration={1.5} />
                        </div>
                    )}
                    <p className="stat-description">Monto total de gastos en el período</p>
                </div>
            </div>

            {/* Filters */}
            <div className="movements-filters-bar" style={{ 
                display: 'flex', 
                gap: '1.25rem', 
                alignItems: 'center', 
                marginBottom: '2rem',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-light)'
            }}>
                <div style={{ flex: '0 0 240px' }}>
                    <Select
                        classNamePrefix="react-select"
                        placeholder="Filtrar por periodo..."
                        options={PERIOD_OPTIONS}
                        value={PERIOD_OPTIONS.find(o => o.value === activePeriod)}
                        onChange={(sel) => setPeriod(sel ? sel.value : '')}
                        isClearable={true}
                        styles={{
                            control: (base) => ({
                                ...base,
                                height: '44px',
                                minHeight: '44px',
                                borderRadius: '10px'
                            })
                        }}
                    />
                </div>

                <div className="date-selector-premium" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    background: 'var(--bg-card)', 
                    padding: '0 1rem', 
                    borderRadius: '10px', 
                    border: '1px solid var(--border-light)',
                    height: '44px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative'
                }}>
                    <Calendar size={16} color="var(--primary-blue)" />
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <DatePicker
                            selected={startDate ? new Date(startDate + "T00:00:00") : null}
                            onChange={(date) => setRange(date ? date.toISOString().split('T')[0] : '', endDate)}
                            placeholderText="Inicio"
                            className="date-picker-input"
                            locale="es"
                            dateFormat="dd/MM/yyyy"
                            isClearable
                        />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>al</span>
                        <DatePicker
                            selected={endDate ? new Date(endDate + "T00:00:00") : null}
                            onChange={(date) => setRange(startDate, date ? date.toISOString().split('T')[0] : '')}
                            placeholderText="Fin"
                            className="date-picker-input"
                            locale="es"
                            dateFormat="dd/MM/yyyy"
                            isClearable
                            minDate={startDate ? new Date(startDate + "T00:00:00") : null}
                        />
                    </div>
                </div>
            </div>

            {/* Movements Table */}
            <div className="panel-wrapper">
                <div className="panel-header">
                    <span><ArrowLeftRight size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Historial de Movimientos</span>
                    <span className="results-count">{movements.length} registros</span>
                </div>

                <div className="table-responsive">
                    <table className="data-table" id="movements-table">
                        <thead>
                            <tr>
                                <th>Concepto (Productos)</th>
                                <th>Cantidad</th>
                                <th>Cliente</th>
                                <th>Valor</th>
                                <th>Medio de Pago</th>
                                <th>Fecha y Hora</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><div className="skeleton skeleton-text" style={{ width: '70%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '30%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '50%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '50%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '60%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '40%' }}></div></td>
                                    </tr>
                                ))
                            ) : movements.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="empty-state">
                                        <div className="empty-state-content">
                                            <ArrowLeftRight size={40} strokeWidth={1} />
                                            <p>No hay movimientos en este período</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                movements.map((mov) => (
                                    <tr 
                                        key={mov.id} 
                                        className="movement-row"
                                        onClick={() => handleMovementClick(mov)}
                                    >
                                        <td className="concepto-cell" style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '0.8rem' }} title={mov.concepto}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                background: 'rgba(0, 223, 216, 0.1)',
                                                border: '1px solid rgba(0, 223, 216, 0.2)',
                                                flexShrink: 0
                                            }}>
                                                <Banknote size={18} color="var(--accent-mint)" />
                                            </div>
                                            <span>{mov.concepto}</span>
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                            {mov.cantidad || 0}
                                        </td>
                                        <td>
                                            {mov.cliente}
                                        </td>
                                        <td className="valor-cell">
                                            Bs {formatCurrency(mov.valor)}
                                        </td>
                                        <td>{getPaymentLabel(mov.metodo_pago)}</td>
                                        <td>{formatDateTime(mov.fecha)}</td>
                                        <td>{getStatusBadge(mov.estado)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Side Panel Implementation with Portal to fix transform positioning issues */}
            {isPanelOpen && createPortal(
                <>
                    <div className="side-panel-overlay" onClick={closePanel}></div>
                    <div className="sale-detail-panel">
                        <div className="panel-header-luxury">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                                    {isEditingInPanel ? 'Editar Venta' : 'Detalle de Venta'}
                                </h3>
                            </div>
                            <button onClick={closePanel} className="btn-icon" style={{ padding: '0.5rem' }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="panel-body">
                            {loadingDetail ? (
                                <div className="detail-loading-state" style={{ textAlign: 'center', padding: '3rem 0' }}>
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Cargando detalles...</p>
                                </div>
                            ) : selectedSale ? (
                                isEditingInPanel ? (
                                    <EditSaleView 
                                        sale={selectedSale}
                                        externalDetalles={location.state?.updatedCart}
                                        onSave={() => {
                                            closePanel();
                                            refetch();
                                            Swal.fire({
                                                title: '¡Venta actualizada!',
                                                text: 'Los cambios se han guardado exitosamente.',
                                                icon: 'success',
                                                customClass: {
                                                    popup: 'my-swal-bg',
                                                    confirmButton: 'my-swal-confirm'
                                                }
                                            });
                                        }}
                                        onCancel={() => setIsEditingInPanel(false)}
                                    />
                                ) : (
                                    <>
                                        <div className="detail-section">
                                            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-mint)' }}>
                                                    {selectedSale.detalles[0]?.producto_nombre} {selectedSale.detalles.length > 1 ? `y ${selectedSale.detalles.length - 1} más` : ''}
                                                </h4>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Transacción #{selectedSale.id}</span>
                                            </div>

                                            <div className="detail-row">
                                                <span className="detail-label"><ShoppingCart size={16} /> Valor total</span>
                                                <span className="detail-value" style={{ fontSize: '1.2rem', color: 'var(--primary-blue)' }}>
                                                    Bs {formatCurrency(selectedSale.total)}
                                                </span>
                                            </div>

                                            <div className="detail-row">
                                                <span className="detail-label"><CheckCircle size={16} /> Estado</span>
                                                <span className="detail-value">{getStatusBadge(selectedSale.tipo_venta || 'pagada')}</span>
                                            </div>

                                            <div className="detail-row">
                                                <span className="detail-label"><Clock size={16} /> Fecha y hora</span>
                                                <span className="detail-value" style={{ fontSize: '0.9rem' }}>
                                                    {formatDateTime(selectedSale.fecha)}
                                                </span>
                                            </div>

                                            <div className="detail-row">
                                                <span className="detail-label"><CreditCard size={16} /> Método de pago</span>
                                                <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                                                    {getPaymentLabel(selectedSale.metodo_pago)}
                                                </span>
                                            </div>

                                            <div className="detail-row">
                                                <span className="detail-label"><User size={16} /> Cliente</span>
                                                <span className="detail-value">{selectedSale.cliente_nombre}</span>
                                            </div>

                                            <div className="ganancia-highlight">
                                                <span className="detail-label" style={{ color: 'var(--success-green)' }}>
                                                    <TrendingDown size={18} style={{ transform: 'rotate(180deg)' }} /> Ganancia
                                                </span>
                                                <span className="detail-value" style={{ color: 'var(--success-green)', fontSize: '1.1rem' }}>
                                                    Bs {formatCurrency(selectedSale.ganancia)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="detail-section">
                                            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Package size={18} /> Productos vendidos
                                            </h4>
                                            <div className="products-mini-list">
                                                {selectedSale.detalles.map(det => (
                                                    <div key={det.id} className="product-item-mini">
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                                                                {det.producto_nombre}
                                                            </div>
                                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                                                                <span style={{ 
                                                                    background: 'rgba(255, 255, 255, 0.05)', 
                                                                    border: '1px solid var(--border-light)',
                                                                    borderRadius: '4px', 
                                                                    padding: '0 6px', 
                                                                    marginRight: '6px',
                                                                    fontWeight: 600,
                                                                    fontSize: '0.75rem'
                                                                }}>
                                                                    {det.cantidad} unidades
                                                                </span>
                                                                <span>x Bs {formatCurrency(det.precio)}</span>
                                                            </div>
                                                        </div>
                                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                            Bs {formatCurrency(det.subtotal)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedSale.nota && (
                                            <div className="detail-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-light)' }}>
                                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nota:</h4>
                                                <p style={{ margin: 0, fontSize: '0.9rem', fontStyle: 'italic' }}>"{selectedSale.nota}"</p>
                                            </div>
                                        )}
                                    </>
                                )
                            ) : null}
                        </div>

                        {selectedSale && !isEditingInPanel && !loadingDetail && (
                            <div className="panel-footer-luxury">
                                <button 
                                    onClick={() => generateSalePDF({
                                        ventaId: selectedSale.id,
                                        fecha: new Date(selectedSale.fecha),
                                        cliente: selectedSale.cliente_nombre || 'Cliente General',
                                        metodoPago: selectedSale.metodo_pago,
                                        tipoVenta: selectedSale.tipo_venta || 'pagada',
                                        plazo: selectedSale.plazo_credito,
                                        items: selectedSale.detalles.map(d => ({
                                            nombre: d.producto_nombre,
                                            cantidad: d.cantidad,
                                            precio: d.precio
                                        })),
                                        subtotal: selectedSale.subtotal || selectedSale.total,
                                        descuento: selectedSale.descuento || 0,
                                        total: selectedSale.total
                                    })}
                                    className="btn-comprobante-luxury"
                                >
                                    <FileText size={18} /> Comprobante
                                </button>
                                <button 
                                    onClick={() => setIsEditingInPanel(true)}
                                    className="btn-edit-luxury"
                                >
                                    <Edit size={18} /> Editar Venta
                                </button>
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

export default MovementsPage;
