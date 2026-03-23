import React, { useState, useEffect } from 'react';
import useCredits from '../hooks/useCredits';
import { X, DollarSign, History, CalendarClock } from 'lucide-react';
import Swal from 'sweetalert2';

const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(val).replace('BOB', '').trim();
};

const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-BO');
};

const PaymentModal = ({ isOpen, onClose, credit, onSuccess }) => {
    const { registerPayment, fetchPayments, payments, paymentsLoading } = useCredits();
    const [monto, setMonto] = useState('');
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [notas, setNotas] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && credit) {
            fetchPayments(credit.id);
            setMonto('');
            setNotas('');
            // Optional: suggest taking the full pending amount
            // setMonto(credit.saldo_pendiente); 
        }
    }, [isOpen, credit, fetchPayments]);

    if (!isOpen || !credit) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const abono = parseFloat(monto);
        
        if (!abono || abono <= 0) {
            Swal.fire({ icon: 'warning', title: 'Monto inválido', text: 'Ingrese un monto mayor a 0', customClass: { popup: 'my-swal-bg' } });
            return;
        }

        if (abono > parseFloat(credit.saldo_pendiente)) {
            Swal.fire({ 
                icon: 'warning', 
                title: 'Monto excesivo', 
                text: `El abono no puede superar el saldo pendiente de Bs ${formatCurrency(credit.saldo_pendiente)}`,
                customClass: { popup: 'my-swal-bg' } 
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await registerPayment(credit.id, {
                monto: abono,
                metodo_pago: metodoPago,
                notas
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Abono registrado',
                text: res.estado === 'pagado' ? 'El crédito ha sido cancelado en su totalidad.' : `Saldo restante: Bs ${formatCurrency(res.saldo_restante)}`,
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' },
                timer: 2500,
                showConfirmButton: false
            });
            onSuccess();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                customClass: { popup: 'my-swal-bg', confirmButton: 'my-swal-confirm' }
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                <div className="modal-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={20} /> Abonar a Crédito #{credit.venta_id}
                    </h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Resumen del crédito */}
                    <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', border: '1px solid var(--border-light)' }}>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Cliente</p>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{credit.cliente_nombre}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Deuda Total</p>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(credit.monto_total)}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Vencimiento</p>
                            <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, color: new Date(credit.fecha_vencimiento) < new Date() ? '#ef4444' : 'var(--text-primary)' }}>
                                <CalendarClock size={14} />
                                {formatDateTime(credit.fecha_vencimiento).split(',')[0]}
                            </p>
                        </div>
                        <div style={{ background: 'rgba(0, 223, 216, 0.1)', padding: '0.5rem', borderRadius: '6px' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Saldo Pendiente</p>
                            <p style={{ fontWeight: 700, color: 'var(--accent-mint)', fontSize: '1.2rem' }}>{formatCurrency(credit.saldo_pendiente)}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Monto a Abonar (Bs)</label>
                                <input 
                                    type="number" 
                                    step="0.5"
                                    min="1"
                                    max={credit.saldo_pendiente}
                                    value={monto} 
                                    onChange={(e) => setMonto(e.target.value)}
                                    placeholder="0.00"
                                    required
                                    style={{ fontSize: '1.1rem', fontWeight: 500 }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Método de Pago</label>
                                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="tarjeta">Tarjeta</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Notas (Opcional)</label>
                            <input 
                                type="text" 
                                value={notas} 
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Referencia de transferencia, recibo, etc."
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: '0.5rem', padding: '0.8rem', justifyContent: 'center' }}>
                            {isSubmitting ? 'Procesando...' : 'Registrar Abono'}
                        </button>
                    </form>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '0' }} />

                    {/* Historial de Pagos */}
                    <div>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {payments.map(pago => (
                                    <div key={pago.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                        <div>
                                            <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{formatCurrency(pago.monto)}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pago.metodo_pago.charAt(0).toUpperCase() + pago.metodo_pago.slice(1)} • {pago.cajero}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{formatDateTime(pago.fecha).split(',')[0]}</p>
                                            {pago.notas && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{pago.notas}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
