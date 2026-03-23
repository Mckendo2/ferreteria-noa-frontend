import React, { useState, useEffect, useMemo } from 'react';
import useCredits from '../hooks/useCredits';
import { Search, Info, DollarSign, CalendarClock, Clock, CheckCircle, AlertTriangle, Calendar as CalendarIcon, X } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import Swal from 'sweetalert2';
import DatePicker, { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";

registerLocale('es', es);

const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(val).replace('BOB', '').trim();
};

const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-BO');
};

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
    `}</style>
);

const CreditsPage = () => {
    const { credits, loading, fetchCredits } = useCredits();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todo');
    const [selectedCredit, setSelectedCredit] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    
    // Date filter state
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(endOfMonth(new Date()));

    useEffect(() => {
        const sDate = startDate ? format(startDate, 'yyyy-MM-dd') : null;
        const eDate = endDate ? format(endDate, 'yyyy-MM-dd') : null;
        fetchCredits(statusFilter, sDate, eDate);
    }, [statusFilter, startDate, endDate, fetchCredits]);

    const handleOpenPayment = (credit) => {
        if (credit.estado === 'pagado') {
            Swal.fire({
                title: 'Crédito Pagado',
                text: 'Este crédito ya fue cancelado en su totalidad.',
                icon: 'info',
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
            return;
        }
        setSelectedCredit(credit);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false);
        fetchCredits(statusFilter); // Refresh list
    };

    const filteredCredits = credits.filter(c => 
        c.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.venta_id.toString().includes(searchTerm)
    );

    const getStatusInfo = (status, fechaVencimiento) => {
        const isOverdue = new Date(fechaVencimiento) < new Date() && status !== 'pagado';
        
        if (status === 'pagado') return { text: 'Pagado', class: 'status-active', icon: <CheckCircle size={14}/> };
        if (isOverdue) return { text: 'Vencido', class: 'status-inactive', icon: <AlertTriangle size={14}/> };
        return { text: 'Pendiente', class: 'status-warning', icon: <Clock size={14}/> };
    };

    return (
        <div className="page-container" style={{ padding: '2rem' }}>
            <DatePickerStyles />
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        Créditos y Cuentas por Cobrar
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={16} /> Administra los pagos pendientes de tus clientes
                    </p>
                </div>
            </div>

            <div className="dashboard-cards" style={{ marginBottom: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                 <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '16px', padding: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
                     <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '1rem', borderRadius: '12px', display: 'flex' }}>
                         <DollarSign size={28} color="white" />
                     </div>
                     <div>
                         <h3 style={{ fontSize: '1rem', fontWeight: 500, margin: 0, opacity: 0.9 }}>Por Cobrar</h3>
                         <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.2rem' }}>
                             Bs {formatCurrency(credits.filter(c => c.estado !== 'pagado').reduce((sum, c) => sum + parseFloat(c.saldo_pendiente), 0))}
                         </div>
                     </div>
                 </div>

                 <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderRadius: '16px', padding: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)' }}>
                     <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '1rem', borderRadius: '12px', display: 'flex' }}>
                         <AlertTriangle size={28} color="white" />
                     </div>
                     <div>
                         <h3 style={{ fontSize: '1rem', fontWeight: 500, margin: 0, opacity: 0.9 }}>Créditos Vencidos</h3>
                         <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.2rem' }}>
                             {credits.filter(c => new Date(c.fecha_vencimiento) < new Date() && c.estado !== 'pagado').length}
                         </div>
                     </div>
                 </div>
            </div>

            <div className="filters-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="search-bar" style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar por cliente o N° Venta..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    />
                </div>
                <div className="filter-group">
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                        <option value="todo">Todos los Estados</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="pagado">Pagados</option>
                    </select>
                </div>

                <div className="filter-group" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    backgroundColor: 'var(--bg-card)', 
                    padding: '0 1rem', 
                    borderRadius: '10px', 
                    border: '1px solid var(--border-light)',
                    height: '44px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <CalendarIcon size={16} color="var(--primary-blue)" />
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            placeholderText="Inicio"
                            className="date-picker-input"
                            locale="es"
                            dateFormat="dd/MM/yyyy"
                            isClearable
                        />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>al</span>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            placeholderText="Fin"
                            className="date-picker-input"
                            locale="es"
                            dateFormat="dd/MM/yyyy"
                            isClearable
                            minDate={startDate}
                        />
                    </div>
                </div>
            </div>

            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>N° Venta</th>
                            <th>Cliente</th>
                            <th>Abonos</th>
                            <th>Deuda Original</th>
                            <th>Saldo Pendiente</th>
                            <th>Vencimiento</th>
                            <th>Estado</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Cargando créditos...</td></tr>
                        ) : filteredCredits.length === 0 ? (
                             <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No se encontraron créditos de clientes.</td></tr>
                        ) : (
                            filteredCredits.map(credit => {
                                const statusInfo = getStatusInfo(credit.estado, credit.fecha_vencimiento);
                                return (
                                    <tr key={credit.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}># {credit.venta_id}</div>
                                            {credit.productos && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={credit.productos}>
                                                    {credit.productos}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{credit.cliente_nombre}</td>
                                        <td>{credit.numero_pagos} pagos</td>
                                        <td>{formatCurrency(credit.monto_total)}</td>
                                        <td style={{ fontWeight: 700, color: credit.estado === 'pagado' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                                            {formatCurrency(credit.saldo_pendiente)}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: statusInfo.text === 'Vencido' ? '#ef4444' : 'var(--text-secondary)' }}>
                                                <CalendarClock size={14} />
                                                {formatDateTime(credit.fecha_vencimiento).split(',')[0]}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${statusInfo.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                                {statusInfo.icon} {statusInfo.text}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn-primary" 
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                onClick={() => handleOpenPayment(credit)}
                                                disabled={credit.estado === 'pagado'}
                                            >
                                                Abonar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {selectedCredit && (
                <PaymentModal 
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    credit={selectedCredit}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </div>
    );
};

export default CreditsPage;
