import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Mail, Phone, User, Box, Banknote, RefreshCw } from 'lucide-react';
import useClients from '../hooks/useClients';
import ClientModal from '../components/ClientModal';
import PageHeader from '../../../components/ui/PageHeader';
import SearchBar from '../../../components/ui/SearchBar';
import Pagination from '../../../components/ui/Pagination';
import api from '../../../services/api';

const ClientsPage = () => {
    const {
        clients,
        allClients,
        loading,
        searchTerm,
        setSearchTerm,
        currentPage,
        setCurrentPage,
        totalPages,
        handleCreate,
        handleUpdate,
        handleDelete,
        fetchClients,
    } = useClients();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [totalPorCobrar, setTotalPorCobrar] = useState(0);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await api.get('/ventas');
                const creditos = response.data.filter(v => v.tipo_venta === 'credito');
                const suma = creditos.reduce((acc, curr) => acc + parseFloat(curr.total), 0);
                setTotalPorCobrar(suma);
            } catch (error) {
                console.error("Error fetching credit sales:", error);
            }
        };
        fetchMetrics();
    }, []);

    const handleOpenCreate = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
    };

    const handleSaveClient = async (clientData) => {
        if (editingClient) {
            return await handleUpdate(editingClient.id, clientData);
        } else {
            return await handleCreate(clientData);
        }
    };

    const activeClientsCount = allClients.filter(c => c.activo === 1).length;

    return (
        <div className="module-container">
            <PageHeader
                title="Gestión de Clientes"
                actionLabel="Nuevo Cliente"
                actionIcon={Plus}
                onAction={handleOpenCreate}
            />

            {/* METRICS CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: 'rgba(0, 112, 243, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--accent-color)' }}>
                        <User size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>Total Clientes</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>{allClients.length}</div>
                    </div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: 'rgba(0, 200, 83, 0.1)', padding: '1rem', borderRadius: '12px', color: '#00C853' }}>
                        <User size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>Clientes Activos</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>{activeClientsCount}</div>
                    </div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '12px', color: '#f59e0b' }}>
                        <Banknote size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem' }}>Total por Cobrar</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700 }}>Bs {totalPorCobrar.toFixed(2)}</div>
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

            {/* CLIENTS TABLE */}
            <div className="table-container page-transition-enter-active" style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando clientes...</div>
                ) : (
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Cliente</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Contacto</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Dirección</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Estado</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.length > 0 ? (
                                clients.map(client => (
                                    <tr key={client.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(var(--brand-primary-rgb), 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                    {client.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{client.nombre}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {client.telefono && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Phone size={14} /> {client.telefono}</div>}
                                            {client.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {client.email}</div>}
                                            {!client.telefono && !client.email && <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Sin contacto</span>}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {client.direccion ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title={client.direccion}>
                                                    <MapPin size={14} style={{ flexShrink: 0 }} /> {client.direccion}
                                                </div>
                                            ) : (
                                                <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Sin dirección</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {client.activo ? (
                                                <span className="badge success" 
                                                    style={{ 
                                                        padding: '4px 8px', 
                                                        borderRadius: '20px', 
                                                        fontSize: '0.8rem', 
                                                        fontWeight: 600,
                                                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                        color: '#22c55e'
                                                    }}>
                                                    Activo
                                                </span>
                                            ) : (
                                                <button 
                                                    className="badge danger" 
                                                    onClick={() => handleUpdate(client.id, { activo: 1 })}
                                                    style={{ 
                                                        padding: '4px 8px', 
                                                        borderRadius: '20px', 
                                                        fontSize: '0.8rem', 
                                                        fontWeight: 600,
                                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        outline: 'none',
                                                        transition: 'transform 0.1s ease'
                                                    }}
                                                    title="Haga clic para restaurar"
                                                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                                                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    Inactivo
                                                </button>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button className="icon-btn" title="Editar" onClick={() => handleOpenEdit(client)}>
                                                    <Edit size={18} />
                                                </button>
                                                {client.activo ? (
                                                    <button className="icon-btn" title="Eliminar" onClick={() => handleDelete(client.id)} style={{ color: 'var(--danger-red)' }}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className="icon-btn" 
                                                        title="Restaurar" 
                                                        onClick={() => handleUpdate(client.id, { activo: 1 })} 
                                                        style={{ color: '#00C853' }}
                                                    >
                                                        <RefreshCw size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                        <Box size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No hay clientes encontrados</h3>
                                        <p style={{ color: 'var(--text-secondary)' }}>No se encontraron registros activos en la base de datos.</p>
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

            <ClientModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={handleSaveClient} 
                client={editingClient}
            />
        </div>
    );
};

export default ClientsPage;
