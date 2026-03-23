import React, { useState } from 'react';
import { FileText, Download, Calendar, PieChart, TrendingUp, AlertTriangle, CreditCard, DollarSign, Package, ChevronRight, Users } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import reportService from '../services/reportService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

const ReportsPage = () => {
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const generatePDF = (title, columns, data, fileName) => {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.setTextColor(40);
        doc.text('FERRETERÍA NOA', 14, 22);
        
        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text(title, 14, 32);
        
        doc.setFontSize(10);
        doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 14, 40);
        doc.text(`Periodo: ${dateRange.startDate} al ${dateRange.endDate}`, 14, 46);

        // Table
        autoTable(doc, {
            startY: 55,
            head: [columns],
            body: data,
            theme: 'grid', // Better "table" look
            headStyles: { 
                fillColor: [33, 37, 41], 
                textColor: 255,
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: { 
                fontSize: 9,
                textColor: 50
            },
            alternateRowStyles: { 
                fillColor: [250, 250, 250] 
            },
            margin: { top: 55, left: 14, right: 14 },
            styles: {
                cellPadding: 3,
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
            }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
            doc.text('Generado por Sistema de Gestión Noa', 14, doc.internal.pageSize.height - 10);
        }

        doc.save(`${fileName}_${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}.pdf`);
    };

    const reports = [
        {
            id: 'sales',
            title: 'Ventas por Periodo',
            description: 'Resumen detallado de ingresos y métodos de pago.',
            icon: <TrendingUp size={24} />,
            color: '#0070F3',
            action: async () => {
                setLoading(true);
                try {
                    const data = await reportService.getSales(dateRange.startDate, dateRange.endDate);
                    const columns = ['ID', 'Fecha', 'Cliente', 'Metodo', 'Total'];
                    const rows = data.map(v => [
                        v.id,
                        new Date(v.fecha).toLocaleDateString(),
                        v.cliente || 'Consumidor Final',
                        v.metodo_pago || 'N/A',
                        `Bs ${parseFloat(v.total).toFixed(2)}`
                    ]);
                    generatePDF('Reporte de Ventas por Periodo', columns, rows, 'Reporte_Ventas');
                } catch (error) {
                    console.error(error);
                    const errorMsg = error.response?.data?.error || error.message;
                    Swal.fire('Error', `No se pudo generar el reporte de ventas: ${errorMsg}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        },
        {
            id: 'top-customers',
            title: 'Clientes Estrella',
            description: 'Clientes que más compras han realizado.',
            icon: <Users size={24} />,
            color: '#8b5cf6',
            action: async () => {
                setLoading(true);
                try {
                    const data = await reportService.getTopCustomers(dateRange.startDate, dateRange.endDate);
                    const columns = ['Nombre', 'Teléfono', 'Total Ventas', 'Total Gastado'];
                    const rows = data.map(c => [
                        c.nombre,
                        c.telefono || '—',
                        c.total_ventas,
                        `Bs ${parseFloat(c.total_gastado).toFixed(2)}`
                    ]);
                    generatePDF('Reporte de Clientes VIP', columns, rows, 'Clientes_Estrella');
                } catch (error) {
                    console.error(error);
                    const errorMsg = error.response?.data?.error || error.message;
                    Swal.fire('Error', `No se pudo generar el reporte de clientes: ${errorMsg}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        },
        {
            id: 'low-stock',
            title: 'Inventario Bajo en Stock',
            description: 'Productos que necesitan reposición inmediata.',
            icon: <AlertTriangle size={24} />,
            color: '#ef4444',
            action: async () => {
                setLoading(true);
                try {
                    const data = await reportService.getLowStock();
                    const columns = ['ID', 'Producto', 'Código', 'Categoría', 'Stock', 'Mínimo'];
                    const rows = data.map(p => [
                        p.id,
                        p.nombre,
                        p.codigo || '—',
                        p.categoria,
                        p.stock,
                        p.stock_minimo
                    ]);
                    generatePDF('Reporte de Productos con Stock Bajo', columns, rows, 'Stock_Bajo');
                } catch (error) {
                    console.error(error);
                    const errorMsg = error.response?.data?.error || error.message;
                    Swal.fire('Error', `No se pudo generar el reporte de stock: ${errorMsg}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        },
        {
            id: 'inventory-value',
            title: 'Valorización de Inventario',
            description: 'Valor total del almacén a costo y venta.',
            icon: <Package size={24} />,
            color: '#8b5cf6',
            action: async () => {
                setLoading(true);
                try {
                    const data = await reportService.getInventoryValue();
                    const columns = ['Producto', 'Stock', 'Costo T.', 'Venta T.', 'Ganancia P.'];
                    const rows = data.map(p => [
                        p.nombre,
                        p.stock,
                        `Bs ${parseFloat(p.valor_costo_total).toFixed(2)}`,
                        `Bs ${parseFloat(p.valor_venta_total).toFixed(2)}`,
                        `Bs ${parseFloat(p.ganancia_potencial).toFixed(2)}`
                    ]);
                    generatePDF('Reporte de Valorización de Inventario', columns, rows, 'Valor_Inventario');
                } catch (error) {
                    console.error(error);
                    const errorMsg = error.response?.data?.error || error.message;
                    Swal.fire('Error', `No se pudo generar el reporte de valorización: ${errorMsg}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        },
        {
            id: 'credits',
            title: 'Cuentas por Cobrar',
            description: 'Lista de créditos pendientes y saldos por cobrar.',
            icon: <CreditCard size={24} />,
            color: '#f59e0b',
            action: async () => {
                setLoading(true);
                try {
                    const data = await reportService.getCredits();
                    const columns = ['ID', 'Cliente', 'Total', 'Pagado', 'Pendiente', 'Vence'];
                    const rows = data.map(c => [
                        c.id,
                        c.cliente,
                        `Bs ${parseFloat(c.monto_total).toFixed(2)}`,
                        `Bs ${parseFloat(c.monto_pagado).toFixed(2)}`,
                        `Bs ${parseFloat(c.saldo_pendiente).toFixed(2)}`,
                        new Date(c.fecha_vencimiento).toLocaleDateString()
                    ]);
                    generatePDF('Reporte de Cuentas por Cobrar', columns, rows, 'Creditos_Pendientes');
                } catch (error) {
                    console.error(error);
                    const errorMsg = error.response?.data?.error || error.message;
                    Swal.fire('Error', `No se pudo generar el reporte de créditos: ${errorMsg}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        },
        {
            id: 'expenses',
            title: 'Gastos y Compras',
            description: 'Resumen de egresos operativos y compras.',
            icon: <DollarSign size={24} />,
            color: '#10b981',
            action: async () => {
                setLoading(true);
                try {
                    const data = await reportService.getExpensesPurchases(dateRange.startDate, dateRange.endDate);
                    const columns = ['Tipo', 'Fecha', 'Concepto', 'Monto'];
                    const rows = data.map(e => [
                        e.tipo,
                        new Date(e.fecha).toLocaleDateString(),
                        e.concepto,
                        `Bs ${parseFloat(e.monto).toFixed(2)}`
                    ]);
                    generatePDF('Reporte de Egresos (Gastos y Compras)', columns, rows, 'Gastos_Compras');
                } catch (error) {
                    console.error(error);
                    const errorMsg = error.response?.data?.error || error.message;
                    Swal.fire('Error', `No se pudo generar el reporte: ${errorMsg}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        },
        {
            id: 'top-products',
            title: 'Productos Estrella',
            description: 'Los productos más vendidos del periodo.',
            icon: <FileText size={24} />,
            color: '#ec4899',
            action: async () => {
                setLoading(true);
                try {
                    const data = await reportService.getTopProducts(dateRange.startDate, dateRange.endDate);
                    const columns = ['Producto', 'Código', 'Vendido', 'Ingresos', 'Ganancia'];
                    const rows = data.map(p => [
                        p.nombre,
                        p.codigo || '—',
                        p.total_vendido,
                        `Bs ${parseFloat(p.ingresos_totales).toFixed(2)}`,
                        `Bs ${parseFloat(p.ganancia_total).toFixed(2)}`
                    ]);
                    generatePDF('Reporte de Productos Estrella', columns, rows, 'Top_Productos');
                } catch (error) {
                    console.error(error);
                    const errorMsg = error.response?.data?.error || error.message;
                    Swal.fire('Error', `No se pudo generar el reporte: ${errorMsg}`, 'error');
                } finally {
                    setLoading(false);
                }
            }
        }
    ];

    return (
        <div className="reports-page" style={{ padding: '0 1rem' }}>
            <PageHeader title="Módulo de Reportes" />

            <div style={{ 
                background: 'var(--bg-card)', 
                padding: '1.5rem', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Calendar size={20} color="var(--text-secondary)" />
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Rango del Reporte:</span>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Desde</label>
                        <input 
                            type="date" 
                            name="startDate"
                            value={dateRange.startDate}
                            onChange={handleDateChange}
                            style={{ 
                                padding: '0.5rem', 
                                borderRadius: '6px', 
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)'
                            }} 
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hasta</label>
                        <input 
                            type="date" 
                            name="endDate"
                            value={dateRange.endDate}
                            onChange={handleDateChange}
                            style={{ 
                                padding: '0.5rem', 
                                borderRadius: '6px', 
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)'
                            }} 
                        />
                    </div>
                </div>

                <div style={{ flex: 1 }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <PieChart size={16} />
                    <span>Los reportes se generan basándose en el rango seleccionado.</span>
                </div>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {reports.map((report) => (
                    <div 
                        key={report.id}
                        className="report-card"
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onClick={report.action}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.borderColor = report.color;
                            e.currentTarget.style.boxShadow = `0 10px 20px rgba(0,0,0,0.1)`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '10px', 
                            background: `${report.color}15`,
                            color: report.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {report.icon}
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                {report.title}
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                {report.description}
                            </p>
                        </div>

                        <div style={{ 
                            marginTop: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid var(--border-color)'
                        }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: report.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Generar PDF <Download size={14} />
                            </span>
                            <ChevronRight size={18} color="var(--text-secondary)" />
                        </div>

                        {loading && (
                            <div style={{ 
                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(2px)'
                            }}>
                                <div className="spinner-small" style={{ width: '24px', height: '24px' }}></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReportsPage;
