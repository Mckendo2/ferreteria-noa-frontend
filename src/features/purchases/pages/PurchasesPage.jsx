import React, { useState, useEffect } from 'react';
import { Plus, Box, Briefcase, Banknote } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import PurchaseForm from '../components/PurchaseForm';
import usePurchases from '../hooks/usePurchases';
import { generatePurchasePDF } from '../services/purchasePdfService';

const PurchasesPage = () => {
    const { purchasesHistory, loadingHistory, fetchPurchasesHistory } = usePurchases();
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (!isCreating) {
            fetchPurchasesHistory();
        }
    }, [isCreating, fetchPurchasesHistory]);

    if (isCreating) {
        return (
            <PurchaseForm 
                onCancel={() => setIsCreating(false)} 
                onSuccess={() => {
                    setIsCreating(false);
                    fetchPurchasesHistory();
                }} 
            />
        );
    }

    // Filter History
    let filtered = purchasesHistory;
    if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p => 
            p.proveedor_nombre.toLowerCase().includes(term) ||
            p.usuario_nombre.toLowerCase().includes(term) ||
            p.id.toString().includes(term)
        );
    }

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalInvertido = purchasesHistory.reduce((sum, p) => sum + parseFloat(p.total), 0);
    const totalComprasEsteMes = purchasesHistory.filter(p => {
        const d = new Date(p.fecha);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const handleReimprimir = (compra) => {
        const pdfData = {
            compraId: compra.id,
            fecha: new Date(compra.fecha),
            proveedor: compra.proveedor_nombre,
            items: [], // we don't have the details in the list view unless we fetch them or they are returned. Currently we just reprint the basic info.
            total: parseFloat(compra.total)
        };
        // For a full reprint, we would need to fetch `detalle_compras` for this ID.
        // As a quick workaround, we can just print the total.
        generatePurchasePDF(pdfData);
    };

    return (
        <div className="module-container">
            <PageHeader
                title="Historial de Compras"
                actionLabel="Nueva Compra"
                actionIcon={Plus}
                onAction={() => setIsCreating(true)}
            />

            {/* METRICS CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: 'rgba(0, 112, 243, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--accent-color)' }}>
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>Total Compras</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>{purchasesHistory.length}</div>
                    </div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', color: '#f59e0b' }}>
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>Compras del mes</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>{totalComprasEsteMes}</div>
                    </div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: 'rgba(0, 200, 83, 0.1)', padding: '1rem', borderRadius: '12px', color: '#00C853' }}>
                        <Banknote size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>Inversión Histórica</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>Bs {totalInvertido.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <div className="filters-bar" style={{ marginBottom: '1.5rem' }}>
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar por proveedor o comprador..."
                />
            </div>

            <div className="table-container page-transition-enter-active" style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                {loadingHistory ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando compras...</div>
                ) : (
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ID/Ref</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Proveedor</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Comprador</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Fecha</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length > 0 ? (
                                paginated.map(compra => (
                                    <tr key={compra.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>
                                            #{compra.id.toString().padStart(5, '0')}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{compra.proveedor_nombre}</div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            {compra.usuario_nombre}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                            {new Date(compra.fecha).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            Bs {parseFloat(compra.total).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                        <Box size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No hay compras registradas</h3>
                                        <p style={{ color: 'var(--text-secondary)' }}>Aún no has ingresado mercadería mediante compras.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

        </div>
    );
};

export default PurchasesPage;
