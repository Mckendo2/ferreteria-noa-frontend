import React, { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Mail, Phone, Truck, Box } from 'lucide-react';
import useProviders from '../hooks/useProviders';
import ProviderModal from '../components/ProviderModal';
import PageHeader from '../../../components/ui/PageHeader';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';

const ProvidersPage = () => {
    const {
        providers,
        allProviders,
        loading,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        totalPages,
        handleCreate,
        handleUpdate,
        handleToggleStatus,
    } = useProviders();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);

    const handleOpenCreate = () => {
        setEditingProvider(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (provider) => {
        setEditingProvider(provider);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProvider(null);
    };

    const handleSaveProvider = async (providerData) => {
        if (editingProvider) {
            return await handleUpdate(editingProvider.id, providerData);
        } else {
            return await handleCreate(providerData);
        }
    };

    const activeProvidersCount = allProviders.filter(p => p.activo === 1).length;

    return (
        <div className="module-container">
            <PageHeader
                title="Gestión de Proveedores"
                actionLabel="Nuevo Proveedor"
                actionIcon={Plus}
                onAction={handleOpenCreate}
            />

            {/* METRICS CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: 'rgba(0, 112, 243, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--accent-color)' }}>
                        <Truck size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>Total Proveedores</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>{allProviders.length}</div>
                    </div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: 'rgba(0, 200, 83, 0.1)', padding: '1rem', borderRadius: '12px', color: '#00C853' }}>
                        <Truck size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>Proveedores Activos</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>{activeProvidersCount}</div>
                    </div>
                </div>
            </div>

            {/* BARRA DE FILTROS HORIZONTAL */}
            <div className="filters-bar" style={{ marginBottom: '1.5rem' }}>
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar por nombre, correo, teléfono..."
                />
            </div>

            {/* PROVIDERS TABLE */}
            <div className="table-container page-transition-enter-active" style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando proveedores...</div>
                ) : (
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Proveedor</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Contacto</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Dirección</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Estado</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {providers.length > 0 ? (
                                providers.map(provider => (
                                <tr key={provider.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s', opacity: provider.activo ? 1 : 0.6 }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(var(--brand-primary-rgb), 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                    {provider.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{provider.nombre}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {provider.telefono && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Phone size={14} /> {provider.telefono}</div>}
                                            {provider.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {provider.email}</div>}
                                            {!provider.telefono && !provider.email && <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Sin contacto</span>}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {provider.direccion ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title={provider.direccion}>
                                                    <MapPin size={14} style={{ flexShrink: 0 }} /> {provider.direccion}
                                                </div>
                                            ) : (
                                                <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Sin dirección</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '20px', 
                                                fontSize: '0.8rem', 
                                                fontWeight: 600,
                                                backgroundColor: provider.activo ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: provider.activo ? '#22c55e' : '#ef4444'
                                            }}>
                                                {provider.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button className="icon-btn" title="Editar" onClick={() => handleOpenEdit(provider)}>
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    className="icon-btn" 
                                                    title={provider.activo ? "Desactivar" : "Reactivar"} 
                                                    onClick={() => handleToggleStatus(provider)} 
                                                    style={{ color: provider.activo ? 'var(--danger-red)' : 'var(--accent-mint)' }}
                                                >
                                                    {provider.activo ? <Trash2 size={18} /> : <Plus size={18} style={{ transform: 'rotate(45deg)' }} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                        <Box size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No se encontraron proveedores</h3>
                                        <p style={{ color: 'var(--text-secondary)' }}>No hay registros coincidentes disponibles.</p>
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

            <ProviderModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={handleSaveProvider} 
                provider={editingProvider}
            />
        </div>
    );
};

export default ProvidersPage;
