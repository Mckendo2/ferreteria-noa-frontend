import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (value) => {
    return parseFloat(value || 0).toLocaleString('es-BO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getPaymentLabel = (metodo) => {
    const labels = {
        'efectivo': 'Efectivo',
        'tarjeta': 'Tarjeta',
        'transferencia': 'Transferencia',
        'credito': 'Crédito',
    };
    return labels[metodo] || metodo;
};

export const generateMovementsPDF = (movements, startDate, endDate, totals) => {
    // Landscape A4 for better table fitting
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Header setup
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(33, 37, 41);
    doc.text('FERRETERÍA NOA', 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text('Reporte de Movimientos Financieros', 14, 30);

    // Period Information
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    
    let periodText = 'Período: Histórico completo';
    if (startDate && endDate) {
        periodText = `Período: ${startDate} al ${endDate}`;
    } else if (startDate) {
        periodText = `Período: Desde ${startDate}`;
    } else if (endDate) {
        periodText = `Período: Hasta ${endDate}`;
    }
    doc.text(periodText, 14, 40);
    
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-BO')} ${new Date().toLocaleTimeString('es-BO')}`, 14, 46);

    // Totals Summary Box (Aligned right)
    const summaryX = 200;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(summaryX, 15, 80, 35, 3, 3, 'FD');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('RESUMEN DEL PERÍODO', summaryX + 5, 22);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Ventas Totales:', summaryX + 5, 29);
    doc.text('Gastos Totales:', summaryX + 5, 36);
    doc.setFont('helvetica', 'bold');
    doc.text('Balance Neto:', summaryX + 5, 43);

    // Align amounts to right inside the box
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(34, 197, 94); // success green
    doc.text(`${totals.ventas}`, summaryX + 75, 29, { align: 'right' });
    
    doc.setTextColor(239, 68, 68); // danger red
    doc.text(`Bs ${formatCurrency(totals.gastos)}`, summaryX + 75, 36, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Bs ${formatCurrency(totals.balance)}`, summaryX + 75, 43, { align: 'right' });

    // Table Data Preparation
    const tableBody = movements.map(mov => [
        formatDateTime(mov.fecha),
        mov.concepto || '-',
        mov.cliente || 'Consumidor Final',
        getPaymentLabel(mov.metodo_pago),
        mov.estado || 'Pagada',
        `Bs ${formatCurrency(mov.valor)}`
    ]);

    // Table Generation
    autoTable(doc, {
        startY: 55,
        head: [['Fecha y Hora', 'Concepto / Producto', 'Cliente', 'Método', 'Estado', 'Valor']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [51, 65, 85], // slate-700
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [51, 65, 85],
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 45 },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 25, halign: 'center' },
            5: { cellWidth: 25, halign: 'right' }
        },
        margin: { top: 55, left: 14, right: 14 },
        didParseCell: function(data) {
            // Add red color for negative values if needed, though usually these are positive values in the UI
            if (data.section === 'body' && data.column.index === 5 && data.row.raw[1].toLowerCase().includes('gasto')) {
               data.cell.styles.textColor = [239, 68, 68]; // red
            }
        }
    });

    // Footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
            `Página ${i} de ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(
            'Ferretería NOA - Sistema de Control Financiero',
            14,
            doc.internal.pageSize.height - 10
        );
    }

    // Save File
    let filename = 'Reporte_Movimientos';
    if (startDate && endDate) {
        filename += `_${startDate}_al_${endDate}`;
    }
    doc.save(`${filename}.pdf`);
};
