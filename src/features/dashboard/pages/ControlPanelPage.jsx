import React from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import useDashboard from '../hooks/useDashboard';
import CountUp from 'react-countup';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import es from 'date-fns/locale/es';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingBag, AlertTriangle,
    Users, UserCheck, ShoppingCart, Package, BarChart3, CreditCard, Banknote,
    ArrowUpRight, ArrowDownRight, Wallet, Star, Calendar
} from 'lucide-react';

registerLocale('es', es);
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);
};

const getChangePercent = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(1);
};

const getCSSVar = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();

/* ─────────────── Reusable mini-components ─────────────── */

const KpiCard = ({ icon: Icon, iconBg, label, value, prefix, suffix, loading }) => (
    <div style={{
        background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem',
        border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1.25rem',
        transition: 'transform 0.2s, box-shadow 0.2s',
    }}>
        <div style={{
            width: '52px', height: '52px', borderRadius: '14px', background: iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
            <Icon size={24} color="white" />
        </div>
        <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, marginBottom: '0.25rem' }}>{label}</p>
            {loading ? (
                <div className="skeleton" style={{ width: '80px', height: '1.8rem', borderRadius: '6px' }}></div>
            ) : (
                <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {prefix}<CountUp end={value || 0} separator="," decimals={prefix === 'Bs ' ? 2 : 0} duration={1.5} />{suffix}
                </p>
            )}
        </div>
    </div>
);

const SectionTitle = ({ icon: Icon, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', marginTop: '2.5rem' }}>
        <div style={{
            width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 223, 216, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <Icon size={18} color="var(--accent-mint)" />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
    </div>
);

const TrendCard = ({ label, current, previous, prefix, loading }) => {
    const pct = getChangePercent(current, previous);
    const isUp = pct >= 0;
    return (
        <div style={{
            background: 'var(--bg-card)', borderRadius: '14px', padding: '1.25rem',
            border: '1px solid var(--border-light)', flex: 1, minWidth: '220px'
        }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, marginBottom: '0.5rem' }}>{label}</p>
            {loading ? (
                <div className="skeleton" style={{ width: '100px', height: '1.6rem', borderRadius: '6px' }}></div>
            ) : (
                <>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {prefix}{formatCurrency(current)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.4rem' }}>
                        {isUp ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownRight size={14} color="#ef4444" />}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isUp ? '#10b981' : '#ef4444' }}>
                            {isUp ? '+' : ''}{pct}%
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>vs mes anterior ({prefix}{formatCurrency(previous)})</span>
                    </div>
                </>
            )}
        </div>
    );
};

/* ─────────────── Main Dashboard ─────────────── */

const ControlPanelPage = () => {
    const [datePreset, setDatePreset] = React.useState('mes');
    const [customStart, setCustomStart] = React.useState('');
    const [customEnd, setCustomEnd] = React.useState('');

    const getDateRangeParams = () => {
        const today = new Date();
        const format = (d) => {
            const tzoffset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - tzoffset).toISOString().split('T')[0];
        };
        if (datePreset === 'hoy') return { startDate: format(today), endDate: format(today) };
        if (datePreset === '7dias') {
            const d = new Date(today);
            d.setDate(d.getDate() - 6);
            return { startDate: format(d), endDate: format(today) };
        }
        if (datePreset === 'mes') {
            const d = new Date(today.getFullYear(), today.getMonth(), 1);
            return { startDate: format(d), endDate: format(today) };
        }
        if (datePreset === 'personalizado') {
            return { startDate: customStart || format(today), endDate: customEnd || format(today) };
        }
        return { startDate: '', endDate: '' };
    };

    const { startDate, endDate } = getDateRangeParams();
    const { stats, loading } = useDashboard(startDate, endDate);
    const [selectedCategory, setSelectedCategory] = React.useState('Todas');

    const bgCard = getCSSVar('--bg-card');
    const textPrimary = getCSSVar('--text-primary');
    const textSecondary = getCSSVar('--text-secondary');
    const borderLight = getCSSVar('--border-light');

    /* ── Chart: Sales by Day ── */
    const salesChartData = {
        labels: stats?.ventas?.salesByDay?.map(s => s.date) || [],
        datasets: [{
            label: 'Ventas Diarias',
            data: stats?.ventas?.salesByDay?.map(s => s.total) || [],
            borderColor: '#00DFD8',
            backgroundColor: 'rgba(0, 223, 216, 0.08)',
            borderWidth: 2, tension: 0.4, fill: true,
            pointBackgroundColor: bgCard, pointBorderColor: '#00DFD8',
            pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6
        }]
    };

    const lineOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: bgCard, titleColor: textPrimary, bodyColor: textSecondary,
                borderColor: borderLight, borderWidth: 1, padding: 10, displayColors: false,
                callbacks: { label: (ctx) => `Bs ${formatCurrency(ctx.parsed.y)}` }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: textSecondary, font: { size: 11 } } },
            y: { grid: { color: borderLight }, ticks: { color: textSecondary, font: { size: 11 }, callback: v => `Bs ${v}` } }
        }
    };

    /* ── Chart: Sales by Payment Method (Doughnut) ── */
    const methodLabels = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', credito: 'Crédito' };
    const methodColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
    const doughnutData = {
        labels: stats?.ventas?.salesByMethod?.map(m => methodLabels[m.metodo_pago] || m.metodo_pago) || [],
        datasets: [{
            data: stats?.ventas?.salesByMethod?.map(m => m.total) || [],
            backgroundColor: methodColors,
            borderWidth: 0, hoverOffset: 6
        }]
    };
    const doughnutOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { color: textSecondary, padding: 15, usePointStyle: true, pointStyleWidth: 10 } },
            tooltip: {
                backgroundColor: bgCard, titleColor: textPrimary, bodyColor: textSecondary,
                callbacks: { label: (ctx) => `Bs ${formatCurrency(ctx.parsed)}` }
            }
        }, cutout: '65%'
    };

    /* ── Chart: Sales by Category (Vertical Bar) ── */
    const productSales = stats?.ventas?.productSales || [];
    const availableCategories = ['Todas', ...new Set(productSales.map(p => p.categoria_nombre))];
    const filteredProducts = productSales.filter(p => selectedCategory === 'Todas' || p.categoria_nombre === selectedCategory);
    const topFilteredProducts = filteredProducts.slice(0, 10); // Show top 10 products

    const barData = {
        labels: topFilteredProducts.map(p => p.nombre?.length > 15 ? p.nombre.substring(0, 15) + '…' : p.nombre),
        datasets: [{
            label: 'Unidades vendidas',
            data: topFilteredProducts.map(p => p.cantidad_vendida),
            backgroundColor: 'rgba(0, 223, 216, 0.6)',
            borderColor: '#00DFD8', borderWidth: 1, borderRadius: 6, barThickness: 30
        }]
    };
    const barOptions = {
        responsive: true, maintainAspectRatio: false, 
        plugins: { legend: { display: false }, tooltip: { backgroundColor: bgCard, titleColor: textPrimary, bodyColor: textSecondary } },
        scales: {
            x: { grid: { display: false }, ticks: { color: textSecondary, font: { size: 11 } } },
            y: { grid: { color: borderLight }, ticks: { color: textPrimary, font: { size: 12 } } }
        }
    };

    const panelStyle = {
        background: 'var(--bg-card)', borderRadius: '14px', padding: '1.5rem',
        border: '1px solid var(--border-light)'
    };

    return (
        <div className="dashboard" style={{ padding: '2rem' }}>
            {/* ════════════════ HEADER ════════════════ */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Panel de Control</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '0.3rem 0 0' }}>Resumen interactivo de tu negocio</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                    <Calendar size={18} color="var(--text-secondary)" style={{ marginLeft: '0.5rem' }} />
                    <select 
                        value={datePreset}
                        onChange={(e) => setDatePreset(e.target.value)}
                        style={{ padding: '0.4rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                        <option value="hoy">Hoy</option>
                        <option value="7dias">Últimos 7 días</option>
                        <option value="mes">Este mes</option>
                        <option value="personalizado">Personalizado</option>
                    </select>
                    {datePreset === 'personalizado' && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderLeft: '1px solid var(--border-light)', paddingLeft: '0.5rem' }}>
                            <DatePicker
                                selected={customStart ? new Date(customStart + "T00:00:00") : null}
                                onChange={(date) => setCustomStart(date ? date.toISOString().split('T')[0] : '')}
                                selectsStart
                                startDate={customStart ? new Date(customStart + "T00:00:00") : null}
                                endDate={customEnd ? new Date(customEnd + "T00:00:00") : null}
                                locale="es"
                                dateFormat="dd/MM/yyyy"
                                withPortal
                                placeholderText="Fecha inicio"
                                customInput={
                                    <input style={{ padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', width: '100px', outline: 'none' }} />
                                }
                            />
                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                            <DatePicker
                                selected={customEnd ? new Date(customEnd + "T00:00:00") : null}
                                onChange={(date) => setCustomEnd(date ? date.toISOString().split('T')[0] : '')}
                                selectsEnd
                                startDate={customStart ? new Date(customStart + "T00:00:00") : null}
                                endDate={customEnd ? new Date(customEnd + "T00:00:00") : null}
                                minDate={customStart ? new Date(customStart + "T00:00:00") : null}
                                locale="es"
                                dateFormat="dd/MM/yyyy"
                                withPortal
                                placeholderText="Fecha fin"
                                customInput={
                                    <input style={{ padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem', width: '100px', outline: 'none' }} />
                                }
                            />
                        </div>
                    )}
                </div>
            </header>

            {/* ════════════════ 1. KPI CARDS ════════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <KpiCard icon={ShoppingCart} iconBg="linear-gradient(135deg, #3b82f6, #2563eb)" label="Ventas (Unidades)" value={stats?.kpis?.ventasPeriodoCantidad} prefix="" suffix={stats?.kpis?.ventasPeriodoCantidad === 1 ? ' venta' : ' ventas'} loading={loading} />
                <KpiCard icon={DollarSign} iconBg="linear-gradient(135deg, #10b981, #059669)" label="Ingresos" value={stats?.kpis?.ventasPeriodoMonto} prefix="Bs " suffix="" loading={loading} />
                <KpiCard icon={Banknote} iconBg="linear-gradient(135deg, #f59e0b, #d97706)" label="Ganancia Real" value={stats?.kpis?.gananciaPeriodo} prefix="Bs " suffix="" loading={loading} />
                <KpiCard icon={Users} iconBg="linear-gradient(135deg, #8b5cf6, #7c3aed)" label="Clientes Registrados" value={stats?.kpis?.clientes} prefix="" suffix="" loading={loading} />
            </div>

            {/* ════════════════ 1.5. EARLY WARNINGS & HIGHLIGHTS ════════════════ */}
            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Producto Estrella Highlight */}
                {!loading && stats?.ventas?.topProducts?.length > 0 && (
                    <div style={{ ...panelStyle, background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderColor: '#fcd34d', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.15)' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                            <Star size={30} color="white" fill="white" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Producto Estrella</p>
                            <h4 style={{ margin: '0.2rem 0', fontSize: '1.5rem', color: '#92400e', fontWeight: 800 }}>{stats.ventas.topProducts[0].nombre}</h4>
                            <p style={{ margin: 0, color: '#b45309', fontSize: '0.95rem' }}>
                                Has vendido <strong>{stats.ventas.topProducts[0].cantidad_vendida}</strong> unidades, generando <strong>Bs {formatCurrency(stats.ventas.topProducts[0].total_vendido)}</strong>.
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Alert for sales drops */}
                {!loading && stats?.comparaciones?.ventasMes < stats?.comparaciones?.ventasMesAnterior && (
                    <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.08)' }}>
                        <div style={{ background: '#ef4444', padding: '0.75rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}><TrendingDown size={24} color="white" /></div>
                        <div>
                            <h4 style={{ margin: 0, color: '#ef4444', fontWeight: 700, fontSize: '1.1rem' }}>Posible Caída en Ventas</h4>
                            <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.4 }}>Tus ventas en este período (Bs {formatCurrency(stats.comparaciones.ventasMes)}) son un {Math.abs(getChangePercent(stats.comparaciones.ventasMes, stats.comparaciones.ventasMesAnterior))}% menores comparadas con el período anterior (Bs {formatCurrency(stats.comparaciones.ventasMesAnterior)}). ¡Podría ser momento de lanzar una promoción o ajustar precios!</p>
                        </div>
                    </div>
                )}
            </div>

            {/* ════════════════ 2. VENTAS Y RENDIMIENTO ════════════════ */}
            <SectionTitle icon={BarChart3} title="Ventas e Ingresos" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {/* Ingresos del periodo card */}
                <div style={{
                    ...panelStyle, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div>
                        <p style={{ fontSize: '0.9rem', margin: 0, opacity: 0.9 }}>Ingresos en el Período</p>
                        {loading ? (
                            <div className="skeleton" style={{ width: '150px', height: '2rem', borderRadius: '6px', marginTop: '0.3rem' }}></div>
                        ) : (
                            <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.25rem 0 0' }}>
                                Bs <CountUp end={stats?.ventas?.ingresosPeriodo || 0} separator="," decimals={2} duration={2} />
                            </p>
                        )}
                    </div>
                    <Wallet size={40} style={{ opacity: 0.3 }} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
                {/* Sales Chart */}
                <div style={panelStyle}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', margin: '0 0 1rem' }}>Ventas Últimos 7 Días</p>
                    {loading ? (
                        <div className="skeleton" style={{ height: '250px', borderRadius: '8px' }}></div>
                    ) : (
                        <div style={{ height: '250px' }}>
                            <Line data={salesChartData} options={lineOptions} />
                        </div>
                    )}
                </div>

                {/* Payment Method Doughnut */}
                <div style={panelStyle}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 1rem' }}>Método de Pago</p>
                    {loading ? (
                        <div className="skeleton" style={{ height: '250px', borderRadius: '8px' }}></div>
                    ) : (
                        <div style={{ height: '250px' }}>
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                        </div>
                    )}
                </div>
            </div>

            {/* Category Products */}
            <div style={{ ...panelStyle, marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Ventas por Producto (Según Categoría)</p>
                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                        {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                {loading ? (
                    <div className="skeleton" style={{ height: '250px', borderRadius: '8px' }}></div>
                ) : topFilteredProducts.length > 0 ? (
                    <div style={{ height: '280px' }}>
                        <Bar data={barData} options={barOptions} />
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No hay datos de ventas en esta categoría.</p>
                )}
            </div>

            {/* ════════════════ 3. PRODUCTOS ════════════════ */}
            <SectionTitle icon={Package} title="Productos" />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <KpiCard icon={Package} iconBg="linear-gradient(135deg, #6366f1, #4f46e5)" label="Total Productos" value={stats?.productos?.totalProductos} prefix="" suffix="" loading={loading} />
                <KpiCard icon={DollarSign} iconBg="linear-gradient(135deg, #ec4899, #db2777)" label="Valor del Inventario" value={stats?.productos?.valorInventario} prefix="Bs " suffix="" loading={loading} />
                <KpiCard icon={AlertTriangle} iconBg="linear-gradient(135deg, #ef4444, #dc2626)" label="Stock Bajo" value={stats?.productos?.lowStock?.length} prefix="" suffix={stats?.productos?.lowStock?.length === 1 ? ' producto' : ' productos'} loading={loading} />
            </div>

            {/* Low Stock List */}
            <div style={{ ...panelStyle, marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Stock Crítico</p>
                    <AlertTriangle size={18} color="#ef4444" />
                </div>
                {loading ? (
                    <div className="skeleton" style={{ height: '120px', borderRadius: '8px' }}></div>
                ) : stats?.productos?.lowStock?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {stats.productos.lowStock.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '8px',
                                border: '1px solid var(--border-light)'
                            }}>
                                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.nombre}</span>
                                <span className="badge danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <AlertTriangle size={12} /> Quedan {item.stock}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem 0' }}>
                        No hay productos con stock bajo. ¡Todo en orden!
                    </p>
                )}
            </div>

            {/* ════════════════ 4. ANÁLISIS DE CLIENTES ════════════════ */}
            <SectionTitle icon={UserCheck} title="Análisis de Clientes" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* Top Clients */}
                <div style={panelStyle}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Star size={16} color="#f59e0b" /> Mejores Clientes
                    </p>
                    {loading ? (
                        <div className="skeleton" style={{ height: '150px', borderRadius: '8px' }}></div>
                    ) : stats?.clientes?.topClients?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {stats.clientes.topClients.map((client, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.7rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px',
                                    border: '1px solid var(--border-light)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.08)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.75rem', fontWeight: 700, color: i === 0 ? 'white' : 'var(--text-secondary)'
                                        }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 500, color: 'var(--text-primary)', margin: 0, fontSize: '0.9rem' }}>{client.nombre}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{client.total_compras} compras</p>
                                        </div>
                                    </div>
                                    <span style={{ fontWeight: 600, color: 'var(--accent-mint)', fontSize: '0.9rem' }}>Bs {formatCurrency(client.monto_total)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem 0' }}>No hay datos de clientes aún.</p>
                    )}
                </div>

                {/* Clients with Credits */}
                <div style={panelStyle}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CreditCard size={16} color="#ef4444" /> Clientes con Créditos Pendientes
                    </p>
                    {loading ? (
                        <div className="skeleton" style={{ height: '150px', borderRadius: '8px' }}></div>
                    ) : stats?.clientes?.clientsWithCredits?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {stats.clientes.clientsWithCredits.map((client, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.7rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}>
                                    <div>
                                        <p style={{ fontWeight: 500, color: 'var(--text-primary)', margin: 0, fontSize: '0.9rem' }}>{client.nombre}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{client.creditos_pendientes} crédito(s)</p>
                                    </div>
                                    <span style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.9rem' }}>Bs {formatCurrency(client.deuda_total)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1.5rem 0' }}>No hay clientes con créditos pendientes.</p>
                    )}
                </div>
            </div>

            {/* ════════════════ 5. COMPARACIONES Y TENDENCIAS ════════════════ */}
            <SectionTitle icon={TrendingUp} title="Comparaciones vs Período Anterior" />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <TrendCard label="Ventas (Monto)" current={stats?.comparaciones?.ventasMes} previous={stats?.comparaciones?.ventasMesAnterior} prefix="Bs " loading={loading} />
                <TrendCard label="Compras (Monto)" current={stats?.comparaciones?.comprasMes} previous={stats?.comparaciones?.comprasMesAnterior} prefix="Bs " loading={loading} />
            </div>
        </div>
    );
};

export default ControlPanelPage;
