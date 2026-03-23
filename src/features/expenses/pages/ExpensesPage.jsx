import React, { useState } from 'react';
import useExpenses from '../hooks/useExpenses';
import { DollarSign, Plus, Trash2, X, Tag, AlertCircle } from 'lucide-react';
import CountUp from 'react-countup';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import es from 'date-fns/locale/es';

registerLocale('es', es);

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-BO', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }) + ' ' + d.toLocaleTimeString('es-BO', {
        hour: '2-digit', minute: '2-digit'
    });
};

const formatCurrency = (val) =>
    parseFloat(val || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ExpensesPage = () => {
    const {
        expenses, categories, loading, saving, error,
        totalGastos, addExpense, removeExpense, addCategory, clearError
    } = useExpenses();

    // Form state
    const [concepto, setConcepto] = useState('');
    const [monto, setMonto] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [fecha, setFecha] = useState(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const mi = String(now.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${d}T${h}:${mi}`;
    });

    // Category modal
    const [showCatModal, setShowCatModal] = useState(false);
    const [catNombre, setCatNombre] = useState('');
    const [catDescripcion, setCatDescripcion] = useState('');

    // Delete confirm
    const [deleteId, setDeleteId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const ok = await addExpense({
            concepto,
            monto: parseFloat(monto),
            categoria_gasto_id: categoriaId || null,
            fecha: fecha || undefined
        });
        if (ok) {
            setConcepto('');
            setMonto('');
            setCategoriaId('');
            const now = new Date();
            const y = now.getFullYear();
            const mo = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const h = String(now.getHours()).padStart(2, '0');
            const mi = String(now.getMinutes()).padStart(2, '0');
            setFecha(`${y}-${mo}-${d}T${h}:${mi}`);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        const result = await addCategory({ nombre: catNombre, descripcion: catDescripcion });
        if (result) {
            setCatNombre('');
            setCatDescripcion('');
            setShowCatModal(false);
            setCategoriaId(result.id.toString());
        }
    };

    const confirmDelete = async () => {
        if (deleteId) {
            await removeExpense(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="expenses-page">
            <header className="page-header">
                <h2>Gastos</h2>
            </header>

            {/* Metric Card */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card expenses-total-card">
                    <div className="stat-card-header">
                        <span>Total de Gastos</span>
                        <div className="stat-icon-wrapper expense-icon">
                            <DollarSign size={18} />
                        </div>
                    </div>
                    {loading ? (
                        <div className="skeleton skeleton-title" style={{ marginTop: '0.5rem', height: '2.5rem' }}></div>
                    ) : (
                        <div className="stat-value">
                            Bs <CountUp end={totalGastos} separator="," decimals={2} duration={1.5} />
                        </div>
                    )}
                    <p className="stat-description">Monto acumulado de gastos registrados</p>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="expense-alert">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                    <button onClick={clearError} className="alert-close"><X size={14} /></button>
                </div>
            )}

            {/* Create Expense Form */}
            <div className="panel-wrapper expense-form-panel">
                <div className="panel-header">
                    <span><Plus size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Registrar Gasto</span>
                </div>
                <form onSubmit={handleSubmit} className="expense-form">
                    <div className="expense-form-grid">
                        <div className="form-group">
                            <label>Concepto</label>
                            <input
                                type="text"
                                value={concepto}
                                onChange={(e) => setConcepto(e.target.value)}
                                placeholder="Ej: Pago de luz"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Monto (Bs)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Categoría</label>
                            <div className="category-select-wrapper">
                                <select
                                    value={categoriaId}
                                    onChange={(e) => setCategoriaId(e.target.value)}
                                    className="expense-select"
                                >
                                    <option value="">Sin categoría</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="btn-new-category"
                                    onClick={() => setShowCatModal(true)}
                                    title="Crear categoría"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Fecha</label>
                            <DatePicker
                                selected={fecha ? new Date(fecha) : null}
                                onChange={(date) => {
                                    if (date) {
                                        const y = date.getFullYear();
                                        const mo = String(date.getMonth() + 1).padStart(2, '0');
                                        const d = String(date.getDate()).padStart(2, '0');
                                        
                                        const existingTime = fecha && fecha.includes('T') ? fecha.split('T')[1] : '00:00';
                                        setFecha(`${y}-${mo}-${d}T${existingTime}`);
                                    } else {
                                        setFecha('');
                                    }
                                }}
                                dateFormat="dd/MM/yyyy"
                                withPortal
                                locale="es"
                                placeholderText="Seleccionar fecha"
                                customInput={<input style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }} />}
                            />
                        </div>
                    </div>
                    <div className="expense-form-actions">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Guardando...' : 'Registrar Gasto'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Expenses Table */}
            <div className="panel-wrapper" style={{ marginTop: '1.5rem' }}>
                <div className="panel-header">
                    <span><Tag size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Gastos Registrados</span>
                    <span className="results-count">{expenses.length} registros</span>
                </div>

                <div className="table-responsive">
                    <table className="data-table" id="expenses-table">
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th>Categoría</th>
                                <th>Monto</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><div className="skeleton skeleton-text" style={{ width: '60%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '50%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '40%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '70%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '30%' }}></div></td>
                                    </tr>
                                ))
                            ) : expenses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="empty-state">
                                        <div className="empty-state-content">
                                            <DollarSign size={40} strokeWidth={1} />
                                            <p>No hay gastos registrados</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((exp) => (
                                    <tr key={exp.id}>
                                        <td className="concepto-cell">{exp.concepto}</td>
                                        <td>
                                            <span className="badge expense-cat-badge">{exp.categoria_nombre}</span>
                                        </td>
                                        <td className="expense-monto-cell">Bs {formatCurrency(exp.monto)}</td>
                                        <td>{formatDate(exp.fecha)}</td>
                                        <td>
                                            <button
                                                className="btn-icon-danger"
                                                onClick={() => setDeleteId(exp.id)}
                                                title="Eliminar gasto"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Category Modal */}
            {showCatModal && (
                <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Nueva Categoría de Gasto</h3>
                            <button className="icon-btn" onClick={() => setShowCatModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCategory}>
                            <div className="modal-body">
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label>Nombre</label>
                                    <input
                                        type="text"
                                        value={catNombre}
                                        onChange={(e) => setCatNombre(e.target.value)}
                                        placeholder="Ej: Servicios básicos"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Descripción (opcional)</label>
                                    <input
                                        type="text"
                                        value={catDescripcion}
                                        onChange={(e) => setCatDescripcion(e.target.value)}
                                        placeholder="Descripción de la categoría"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowCatModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Creando...' : 'Crear Categoría'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirmar Eliminación</h3>
                            <button className="icon-btn" onClick={() => setDeleteId(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-secondary)' }}>¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
                            <button className="btn-danger" onClick={confirmDelete}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpensesPage;
