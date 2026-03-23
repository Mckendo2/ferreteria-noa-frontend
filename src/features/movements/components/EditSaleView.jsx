import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Package, CreditCard, User, Save, ArrowLeft, Plus, Minus, Trash2, Banknote, Smartphone, HandCoins, ArrowLeftRight } from 'lucide-react';
import Select from 'react-select';
import { updateSale } from '../../sales/services/saleService';
import { getClients } from '../../clients/services/clientService';
import Swal from 'sweetalert2';

const EditSaleView = ({ sale, onSave, onCancel, externalDetalles }) => {
    const navigate = useNavigate();
    const [fecha, setFecha] = useState(sale.fecha.split('T')[0]);
    
    // Use external details (from SalesPage) if available, otherwise use sale details
    const [detalles, setDetalles] = useState(() => {
        if (externalDetalles) {
            return externalDetalles.map(d => ({
                ...d,
                producto_nombre: d.nombre || d.producto_nombre,
                producto_id: d.producto_id || d.id
            }));
        }
        return sale.detalles.map(d => ({ ...d }));
    });
    const [nota, setNota] = useState(sale.nota || '');
    const [metodoPago, setMetodoPago] = useState(sale.metodo_pago || 'efectivo');
    const [clienteId, setClienteId] = useState(sale.cliente_id);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const data = await getClients();
                setClientes(data.filter(c => c.activo === 1));
            } catch (error) {
                console.error("Error fetching clients", error);
            }
        };
        fetchClients();
    }, []);

    const totalCalculado = detalles.reduce((sum, d) => sum + (d.cantidad * d.precio), 0) - (sale.descuento || 0);

    const handleSave = async () => {
        setLoading(true);
        try {
            const saleData = {
                cliente_id: clienteId,
                tipo_venta: sale.tipo_venta,
                plazo: sale.plazo,
                fecha: fecha,
                descuento: sale.descuento,
                nota: nota,
                metodo_pago: metodoPago,
                total: totalCalculado,
                detalles: detalles.map(d => ({
                    producto_id: d.producto_id,
                    cantidad: d.cantidad,
                    precio: d.precio
                }))
            };

            await updateSale(sale.id, saleData);
            onSave();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.error || 'No se pudo actualizar la venta.',
                icon: 'error',
                confirmButtonColor: 'var(--primary-blue)'
            });
        } finally {
            setLoading(false);
        }
    };

    const paymentMethods = [
        { id: 'efectivo', label: 'Efectivo', icon: <Banknote size={20} /> },
        { id: 'tarjeta', label: 'Tarjeta', icon: <CreditCard size={20} /> },
        { id: 'transferencia', label: 'Transferencia bancaria', icon: <Smartphone size={20} /> },
        { id: 'yape', label: 'Yape', icon: <Smartphone size={20} color="#833ab4" /> },
        { id: 'otro', label: 'Otro', icon: <HandCoins size={20} /> },
    ];

    const clientOptions = clientes.map(c => ({ value: c.id, label: c.nombre }));
    const selectedClient = clientOptions.find(o => o.value === clienteId);

    return (
        <div className="edit-sale-panel-view">
            <div className="edit-content-compact">
                <p className="mandatory-notice">Los campos marcados con asterisco (*) son obligatorios</p>

                <div className="edit-form-section">
                    <label className="field-label">Fecha de la venta *</label>
                    <div className="input-with-icon">
                        <Calendar size={18} />
                        <input 
                            type="date" 
                            value={fecha} 
                            onChange={(e) => setFecha(e.target.value)}
                            className="luxury-input"
                        />
                    </div>
                </div>

                <div className="edit-form-section">
                    <label className="field-label">Productos vendidos</label>
                    <button 
                        className="products-pos-summary-btn"
                        onClick={() => navigate('/ventas', { 
                            state: { 
                                saleId: sale.id, 
                                fromEdit: true,
                                currentCart: detalles.map(d => ({
                                    producto_id: d.producto_id,
                                    nombre: d.producto_nombre,
                                    precio: parseFloat(d.precio) || 0,
                                    cantidad: parseInt(d.cantidad) || 0,
                                    imagen: d.imagen,
                                    stock: 9999 // High stock for editing flow
                                }))
                            } 
                        })}
                    >
                        <div className="summary-main">
                            <Package size={20} />
                            <div className="summary-text">
                                <span className="summary-count">{detalles.length} {detalles.length === 1 ? 'producto seleccionado' : 'productos seleccionados'}</span>
                                <span className="summary-hint">Toca para editar en el POS</span>
                            </div>
                            <ArrowLeftRight size={18} className="pos-icon-indicator" />
                        </div>
                        <div className="summary-value-chip">
                            <span className="label">Valor de los productos</span>
                            <span className="value">Bs {detalles.reduce((sum, d) => sum + (d.cantidad * d.precio), 0).toFixed(2)}</span>
                        </div>
                    </button>
                    {detalles.length > 0 && (
                        <div className="products-preview-names">
                            {detalles.slice(0, 2).map(d => d.producto_nombre).join(', ')}
                            {detalles.length > 2 ? ` y ${detalles.length - 2} más...` : ''}
                        </div>
                    )}
                </div>
                <div className="edit-form-section">
                    <label className="field-label">¿Quieres darle un nombre a esta venta?</label>
                    <textarea 
                        placeholder="Ej: 5 Angular esquinero 3\" 
                        value={nota}
                        onChange={(e) => setNota(e.target.value)}
                        className="luxury-textarea"
                        rows="2"
                    />
                </div>

                <div className="edit-form-section">
                    <label className="field-label">Método de pago *</label>
                    <div className="payment-grid-edit">
                        {paymentMethods.map(method => (
                            <button 
                                key={method.id}
                                className={`payment-option-btn-compact ${metodoPago === method.id ? 'active' : ''}`}
                                onClick={() => setMetodoPago(method.id)}
                            >
                                {method.icon}
                                <span>{method.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="edit-form-section">
                    <label className="field-label">Cliente</label>
                    <Select 
                        options={clientOptions}
                        value={selectedClient}
                        onChange={(opt) => setClienteId(opt ? opt.value : null)}
                        placeholder="Selecciona un cliente"
                        isClearable
                        classNamePrefix="react-select"
                        className="luxury-select"
                    />
                </div>

                <div className="edit-footer-actions">
                    <button onClick={onCancel} className="btn-cancel-edit">Cancelar</button>
                    <button 
                        onClick={handleSave} 
                        className="btn-save-edit" 
                        disabled={loading}
                    >
                        {loading ? '...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>

            <style>{`
                .edit-sale-panel-view {
                    width: 100%;
                    animation: fadeIn 0.3s ease;
                }
                .edit-content-compact {
                    padding: 0;
                }
                .mandatory-notice {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    margin-bottom: 1.5rem;
                    opacity: 0.8;
                }
                .edit-form-section {
                    margin-bottom: 1.5rem;
                }
                .field-label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: var(--text-primary);
                    font-size: 0.85rem;
                }
                .input-with-icon {
                    display: flex;
                    align-items: center;
                    background: var(--bg-input);
                    border: 1px solid var(--border-light);
                    border-radius: 8px;
                    padding: 0 0.75rem;
                }
                .input-with-icon svg { color: var(--text-secondary); }
                .luxury-input {
                    background: transparent;
                    border: none;
                    padding: 0.6rem 0.5rem;
                    color: var(--text-primary);
                    width: 100%;
                    outline: none;
                    font-size: 0.9rem;
                }
                .products-pos-summary-btn {
                    width: 100%;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-light);
                    border-radius: 12px;
                    padding: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }
                .products-pos-summary-btn:hover {
                    border-color: var(--primary-blue);
                    background: rgba(59, 130, 246, 0.05);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .summary-main {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    color: var(--text-primary);
                }
                .summary-text {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }
                .summary-count {
                    font-weight: 700;
                    font-size: 1rem;
                }
                .summary-hint {
                    font-size: 0.75rem;
                    color: var(--primary-blue);
                    font-weight: 500;
                }
                .pos-icon-indicator {
                    color: var(--primary-blue);
                    opacity: 0.7;
                }
                .summary-value-chip {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255,255,255,0.05);
                    padding: 0.5rem 0.75rem;
                    border-radius: 8px;
                }
                .summary-value-chip .label {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                }
                .summary-value-chip .value {
                    font-weight: 700;
                    color: var(--success-green);
                }
                .products-preview-names {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    padding: 0 0.5rem;
                    font-style: italic;
                    margin-bottom: 1rem;
                }

                .luxury-textarea {
                    width: 100%;
                    background: var(--bg-input);
                    border: 1px solid var(--border-light);
                    border-radius: 8px;
                    padding: 0.6rem 0.75rem;
                    color: var(--text-primary);
                    outline: none;
                    resize: none;
                    font-size: 0.85rem;
                }
                .payment-grid-edit {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem;
                }
                .payment-option-btn-compact {
                    background: var(--bg-input);
                    border: 1px solid var(--border-light);
                    border-radius: 8px;
                    padding: 0.75rem 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.8rem;
                }
                .payment-option-btn-compact.active {
                    background: rgba(59, 130, 246, 0.1);
                    border-color: var(--primary-blue);
                    color: var(--primary-blue);
                }
                .edit-footer-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 2rem;
                }
                .btn-cancel-edit {
                    padding: 0.6rem 1rem;
                    background: none;
                    border: 1px solid var(--border-light);
                    color: var(--text-secondary);
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.85rem;
                }
                .btn-save-edit {
                    padding: 0.6rem 1.5rem;
                    background: var(--primary-blue);
                    border: none;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.85rem;
                }
            `}</style>
        </div>
    );
};

export default EditSaleView;
