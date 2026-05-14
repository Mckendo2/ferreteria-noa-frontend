import React, { useEffect } from 'react';
import useCredits from '../hooks/useCredits';
import { X, DollarSign, History, CalendarClock, Package, User, Hash, Info } from 'lucide-react';

const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(val).replace('BOB', '').trim();
};

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-BO');
};

const CreditDetailsModal = ({ isOpen, onClose, credit }) => {
    const { fetchPayments, payments, paymentsLoading } = useCredits();

    useEffect(() => {
        if (isOpen && credit) {
            fetchPayments(credit.id);
        }
    }, [isOpen, credit, fetchPayments]);

    if (!isOpen || !credit) return null;

    const isOverdue = new Date(credit.fecha_vencimiento) < new Date() && credit.estado !== 'pagado';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={20} /> Detalle del Crédito #{credit.venta_id}
                    </h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Información General */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                <User size={14} /> Cliente
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{credit.cliente_nombre}</div>
                            {credit.cliente_telefono && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Tel: {credit.cliente_telefono}</div>
                            )}
                        </div>

                        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                <Hash size={14} /> Estado del Crédito
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, 
                                backgroundColor: credit.estado === 'pagado' ? 'rgba(16, 185, 129, 0.1)' : isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: credit.estado === 'pagado' ? '#10b981' : isOverdue ? '#ef4444' : '#f59e0b'
                            }}>
                                {credit.estado.toUpperCase()} {isOverdue && '(VENCIDO)'}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        <div style={{ padding: '0.5rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Fecha de Inicio</p>
                            <p style={{ fontWeight: 500 }}>{formatDateTime(credit.fecha_inicio).split(',')[0]}</p>
                        </div>
                        <div style={{ padding: '0.5rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Fecha Vencimiento</p>
                            <p style={{ fontWeight: 500, color: isOverdue ? '#ef4444' : 'inherit' }}>{formatDateTime(credit.fecha_vencimiento).split(',')[0]}</p>
                        </div>
                        <div style={{ padding: '0.5rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Total Venta</p>
                            <p style={{ fontWeight: 600 }}>Bs {formatCurrency(credit.monto_total)}</p>
                        </div>
                        <div style={{ padding: '0.5rem', backgroundColor: 'rgba(0, 223, 216, 0.05)', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>Saldo Pendiente</p>
                            <p style={{ fontWeight: 700, color: 'var(--accent-mint)', fontSize: '1.1rem' }}>Bs {formatCurrency(credit.saldo_pendiente)}</p>
                        </div>
                    </div>

                    {/* Productos */}
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Package size={16} /> Productos en esta Venta
                        </h3>
                        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '10px', fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                            {credit.productos || 'Sin detalles de productos'}
                        </div>
                    </div>

                    {/* Historial de Pagos */}
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <History size={16} /> Historial de Abonos
                        </h3>
                        {paymentsLoading ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cargando pagos...</p>
                        ) : payments.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                                Aún no se han registrado abonos para este crédito.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {payments.map(pago => (
                                    <div key={pago.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Bs {formatCurrency(pago.monto)}</span>
                                                <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>{pago.metodo_pago}</span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Registrado por {pago.cajero}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{formatDateTime(pago.fecha)}</div>
                                            {pago.notas && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.1rem' }}>"{pago.notas}"</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default CreditDetailsModal;
