import React from 'react';
import Select from 'react-select';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { ClipboardList, RefreshCw, Search, X, Calendar } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import { getAuditEvents } from '../services/auditService';
import { getSessions } from '../services/sessionService';
import { getProducts } from '../../products/services/productService';
import { getClients } from '../../clients/services/clientService';
import { getCategories } from '../../categories/services/categoryService';
import { getUsers } from '../../users/services/userService';
import { getProviders } from '../../providers/services/providerService';

registerLocale('es', es);

const ACTION_OPTIONS = [
    { value: '', label: 'Todas las acciones' },
    { value: 'crear', label: 'Crear' },
    { value: 'actualizar', label: 'Actualizar' },
    { value: 'eliminar', label: 'Eliminar' },
    { value: 'asignar_permisos', label: 'Asignar permisos' },
    { value: 'registrar_abono', label: 'Registrar abono' },
];

const MODULE_OPTIONS = [
    { value: '', label: 'Todos los modulos' },
    { value: 'categorias', label: 'Categorias' },
    { value: 'productos', label: 'Productos' },
    { value: 'clientes', label: 'Clientes' },
    { value: 'proveedores', label: 'Proveedores' },
    { value: 'usuarios', label: 'Usuarios' },
    { value: 'roles', label: 'Roles' },
    { value: 'permisos', label: 'Permisos' },
    { value: 'ventas', label: 'Ventas' },
    { value: 'compras', label: 'Compras' },
    { value: 'gastos', label: 'Gastos' },
    { value: 'categorias_gastos', label: 'Categorias de gastos' },
    { value: 'creditos', label: 'Creditos' },
];

const formatDateTime = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('es-BO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const prettifyJson = (value) => {
    if (!value) return '-';
    try {
        return JSON.stringify(value, null, 2);
    } catch (e) {
        return '-';
    }
};

const RenderChanges = ({ action, before, after, lookups = {} }) => {
    const isUpdate = action === 'actualizar';
    const isDelete = action === 'eliminar';
    const isCreate = action === 'crear';

    const getLabel = (key, value) => {
        if (!value) return null;
        
        // Product Mapping
        if (key === 'producto_id' && lookups.products?.[value]) {
            return lookups.products[value];
        }
        // Client Mapping
        if (key === 'cliente_id' && lookups.clients?.[value]) {
            return lookups.clients[value];
        }
        // Category Mapping
        if (key === 'categoria_id' && lookups.categories?.[value]) {
            return lookups.categories[value];
        }
        // User Mapping
        if (key === 'usuario_id' && lookups.users?.[value]) {
            return lookups.users[value];
        }
        // Provider Mapping
        if (key === 'proveedor_id' && lookups.providers?.[value]) {
            return lookups.providers[value];
        }
        
        return null;
    };

    const renderValue = (key, val) => {
        if (val === null || val === undefined) return <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>null</span>;
        
        const label = getLabel(key, val);
        if (label) {
            return (
                <span>
                    {label} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(ID: {val})</span>
                </span>
            );
        }

        if (typeof val === 'boolean') return val ? 'Sí' : 'No';
        
        if (Array.isArray(val) && key === 'detalles') {
            return (
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', marginTop: '0.25rem' }}>
                    {val.map((item, i) => (
                        <div key={i} style={{ borderBottom: i < val.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', padding: '0.35rem 0' }}>
                            {item.producto_id && lookups.products?.[item.producto_id] ? (
                                <strong>{lookups.products[item.producto_id]}</strong>
                            ) : (
                                <span>Producto ID: {item.producto_id}</span>
                            )}
                            <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                                ({item.cantidad} x Q{item.precio})
                            </span>
                        </div>
                    ))}
                </div>
            );
        }

        if (typeof val === 'object') return <pre style={{ fontSize: '0.75rem', margin: 0 }}>{JSON.stringify(val, null, 2)}</pre>;
        return String(val);
    };

    const getDiff = () => {
        if (!before || !after) return [];
        const diff = [];
        const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
        
        allKeys.forEach(key => {
            if (['id', 'created_at', 'updated_at', 'usuario_id'].includes(key) && before[key] === after[key]) return;
            
            if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
                diff.push({
                    key: key,
                    field: key.replaceAll('_', ' '),
                    oldValue: before[key],
                    newValue: after[key]
                });
            }
        });
        return diff;
    };

    if (isUpdate) {
        const diff = getDiff();
        if (diff.length === 0) return <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No hay cambios detectados en los campos principales.</div>;

        return (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
                {diff.map((item, i) => (
                    <div key={i} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'minmax(120px, auto) 1fr 20px 1fr', 
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '6px',
                        fontSize: '0.85rem'
                    }}>
                        <strong style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{item.field}:</strong>
                        <div style={{ color: '#E63946', textDecoration: 'line-through' }}>
                            {renderValue(item.key, item.oldValue)}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>→</div>
                        <div style={{ color: '#00A651', fontWeight: 500 }}>
                            {renderValue(item.key, item.newValue)}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const data = isDelete ? before : after;
    if (!data) return <div style={{ color: 'var(--text-secondary)' }}>Sin datos disponibles</div>;

    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px'
        }}>
            {Object.entries(data).map(([key, value]) => (
                <div key={key} style={{ fontSize: '0.85rem' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.15rem', textTransform: 'capitalize' }}>
                        {key.replaceAll('_', ' ')}
                    </div>
                    <div style={{ fontWeight: 500 }}>{renderValue(key, value)}</div>
                </div>
            ))}
        </div>
    );
};

const getBadgeStyle = (action) => {
    const palette = {
        crear: { background: 'rgba(0, 200, 83, 0.12)', color: '#00A651' },
        actualizar: { background: 'rgba(0, 112, 243, 0.12)', color: '#0070F3' },
        eliminar: { background: 'rgba(230, 57, 70, 0.12)', color: '#E63946' },
        asignar_permisos: { background: 'rgba(255, 170, 0, 0.12)', color: '#C77D00' },
        registrar_abono: { background: 'rgba(0, 223, 216, 0.12)', color: '#008B8B' },
    };

    return palette[action] || { background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' };
};

const DatePickerStyles = () => (
    <style>{`
        .date-picker-input {
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-size: 0.9rem;
            width: 100px;
            cursor: pointer;
            outline: none;
            font-weight: 500;
        }
        .react-datepicker-wrapper {
            width: auto;
        }
        .react-datepicker__close-icon::after {
            background-color: transparent !important;
            color: var(--text-secondary) !important;
            font-size: 1.2rem !important;
        }
    `}</style>
);

const AuditPage = () => {
    const [events, setEvents] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [selectedAction, setSelectedAction] = React.useState(ACTION_OPTIONS[0]);
    const [selectedModule, setSelectedModule] = React.useState(MODULE_OPTIONS[0]);

    // UI state
    const [activeTab, setActiveTab] = React.useState('eventos'); // 'eventos' or 'sesiones'
    const [sessions, setSessions] = React.useState([]);
    const [sessionSearch, setSessionSearch] = React.useState('');
    const [loadingSessions, setLoadingSessions] = React.useState(false);
    
    // Lookups
    const [lookups, setLookups] = React.useState({
        products: {},
        clients: {},
        categories: {},
        users: {},
        providers: {},
    });

    // Filter state
    const [startDate, setStartDate] = React.useState(null);
    const [endDate, setEndDate] = React.useState(null);

    React.useEffect(() => {
        const loadLookups = async () => {
            try {
                const [p, c, cat, u, pr] = await Promise.all([
                    getProducts(),
                    getClients(),
                    getCategories(),
                    getUsers(),
                    getProviders(),
                ]);
                
                setLookups({
                    products: p.reduce((acc, item) => ({ ...acc, [item.id]: item.nombre }), {}),
                    clients: c.reduce((acc, item) => ({ ...acc, [item.id]: item.nombre }), {}),
                    categories: cat.reduce((acc, item) => ({ ...acc, [item.id]: item.nombre }), {}),
                    users: u.reduce((acc, item) => ({ ...acc, [item.id]: item.nombre }), {}),
                    providers: pr.reduce((acc, item) => ({ ...acc, [item.id]: item.nombre }), {}),
                });
            } catch (error) {
                console.error('Error loading lookups for audit:', error);
            }
        };
        loadLookups();
    }, []);

    const formatDateForAPI = (date) => {
        if (!date) return null;
        try {
            return date.toISOString().split('T')[0];
        } catch (e) {
            return null;
        }
    };

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await getAuditEvents({
                accion: selectedAction?.value,
                modulo: selectedModule?.value,
                startDate: formatDateForAPI(startDate),
                endDate: formatDateForAPI(endDate),
                limit: 150,
            });
            setEvents(data);
        } catch (error) {
            console.error('No se pudo cargar la auditoria:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadEvents();
    }, [selectedAction, selectedModule, startDate, endDate]);

    const loadSessions = async () => {
        try {
            setLoadingSessions(true);
            const data = await getSessions({ 
                search: sessionSearch,
                startDate: formatDateForAPI(startDate),
                endDate: formatDateForAPI(endDate),
            });
            setSessions(data);
        } catch (error) {
            console.error('No se pudo cargar las sesiones:', error);
        } finally {
            setLoadingSessions(false);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'sesiones') {
            loadSessions();
        }
    }, [activeTab, sessionSearch, startDate, endDate]);

    const stats = React.useMemo(() => ({
        total: events.length,
        usuarios: new Set(events.map((event) => event.usuario_id).filter(Boolean)).size,
        modulos: new Set(events.map((event) => event.modulo)).size,
    }), [events]);

    return (
        <div className="module-container">
            <DatePickerStyles />
            <PageHeader
                title="Auditoria del Sistema"
            />

            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '2rem', 
                gap: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '0.4rem',
                    borderRadius: '12px',
                    width: 'fit-content',
                    border: '1px solid var(--border-light)'
                }}>
                    <button
                        onClick={() => setActiveTab('eventos')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            background: activeTab === 'eventos' ? 'var(--primary-blue)' : 'transparent',
                            color: activeTab === 'eventos' ? '#fff' : 'var(--text-secondary)',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem'
                        }}
                    >
                        <ClipboardList size={18} />
                        Eventos de Auditoria
                    </button>
                    <button
                        onClick={() => setActiveTab('sesiones')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            background: activeTab === 'sesiones' ? 'var(--primary-blue)' : 'transparent',
                            color: activeTab === 'sesiones' ? '#fff' : 'var(--text-secondary)',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem'
                        }}
                    >
                        <Search size={18} />
                        Control de Sesiones
                    </button>
                </div>

                <div style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    alignItems: 'center',
                    background: 'var(--bg-card)',
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-light)'
                }}>
                    <Calendar size={18} color="var(--primary-blue)" />
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            placeholderText="Fecha inicio"
                            className="date-picker-input"
                            locale="es"
                            dateFormat="dd/MM/yyyy"
                            isClearable
                        />
                        <span style={{ color: 'var(--text-secondary)' }}>al</span>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            placeholderText="Fecha fin"
                            className="date-picker-input"
                            locale="es"
                            dateFormat="dd/MM/yyyy"
                            isClearable
                            minDate={startDate}
                        />
                    </div>
                </div>
            </div>

            {activeTab === 'eventos' ? (
                <>
                    <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                        <div className="stat-card">
                            <div className="stat-card-header">
                                <span>Eventos</span>
                                <ClipboardList size={18} />
                            </div>
                            <div className="stat-value">{stats.total}</div>
                            <p className="stat-description">Cambios visibles en el historial</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-header">
                                <span>Usuarios</span>
                            </div>
                            <div className="stat-value">{stats.usuarios}</div>
                            <p className="stat-description">Usuarios que realizaron cambios</p>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-header">
                                <span>Modulos</span>
                            </div>
                            <div className="stat-value">{stats.modulos}</div>
                            <p className="stat-description">Areas con actividad registrada</p>
                        </div>
                    </div>

                    <div className="filters-bar" style={{ marginBottom: '1.5rem' }}>
                        <div className="filter-group" style={{ minWidth: '240px' }}>
                            <Select
                                classNamePrefix="react-select"
                                options={MODULE_OPTIONS}
                                value={selectedModule}
                                onChange={(option) => setSelectedModule(option || MODULE_OPTIONS[0])}
                            />
                        </div>
                        <div className="filter-group" style={{ minWidth: '240px' }}>
                            <Select
                                classNamePrefix="react-select"
                                options={ACTION_OPTIONS}
                                value={selectedAction}
                                onChange={(option) => setSelectedAction(option || ACTION_OPTIONS[0])}
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Usuario</th>
                                    <th>Modulo</th>
                                    <th>Accion</th>
                                    <th>Descripcion</th>
                                    <th>Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={index}>
                                            <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '70%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '60%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '55%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '90%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '95%' }}></div></td>
                                        </tr>
                                    ))
                                ) : events.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            <div className="empty-state-content">
                                                <ClipboardList size={40} strokeWidth={1} />
                                                <p>No hay eventos de auditoria con esos filtros.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((event) => (
                                        <tr key={event.id}>
                                            <td>{formatDateTime(event.created_at)}</td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{event.usuario_nombre || 'Sistema'}</div>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{event.usuario_email || '-'}</div>
                                            </td>
                                            <td style={{ textTransform: 'capitalize' }}>{event.modulo.replaceAll('_', ' ')}</td>
                                            <td>
                                                <span className="badge" style={getBadgeStyle(event.accion)}>
                                                    {event.accion.replaceAll('_', ' ')}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{event.descripcion}</div>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                    ID entidad: {event.entidad_id || '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <details>
                                                    <summary style={{ cursor: 'pointer', color: 'var(--accent-mint)', fontWeight: 500 }}>
                                                        Ver detalle del cambio
                                                    </summary>
                                                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                                                        <RenderChanges 
                                                            action={event.accion}
                                                            before={event.datos_anteriores}
                                                            after={event.datos_nuevos}
                                                            lookups={lookups}
                                                        />
                                                    </div>
                                                </details>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div className="search-input-wrapper" style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por usuario, email o IP..."
                            value={sessionSearch}
                            onChange={(e) => setSessionSearch(e.target.value)}
                        />
                    </div>

                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Inicio</th>
                                    <th>Fin</th>
                                    <th>IP</th>
                                    <th>User Agent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingSessions ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={index}>
                                            <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '70%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '60%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '55%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '90%' }}></div></td>
                                        </tr>
                                    ))
                                ) : sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="empty-state">
                                            <div className="empty-state-content">
                                                <Search size={40} strokeWidth={1} />
                                                <p>No se encontraron sesiones.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.map(s => (
                                        <tr key={s.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{s.usuario_nombre}</div>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{s.usuario_email}</div>
                                            </td>
                                            <td>{formatDateTime(s.inicio)}</td>
                                            <td>{formatDateTime(s.fin)}</td>
                                            <td>{s.ip_address}</td>
                                            <td>
                                                <div 
                                                    style={{ 
                                                        fontSize: '0.82rem', 
                                                        color: 'var(--text-secondary)',
                                                        maxWidth: '300px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }} 
                                                    title={s.user_agent}
                                                >
                                                    {s.user_agent}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditPage;
