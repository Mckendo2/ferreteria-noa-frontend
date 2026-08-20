import { jsPDF } from 'jspdf';

/**
 * Generates a PDF for a quotation.
 * @param {Object} data
 * @param {number|string} data.cotizacionId - Quotation ID
 * @param {Date|string} data.fecha - Date
 * @param {string} data.cliente - Client name
 * @param {Array} data.items - [{nombre, cantidad, precio}]
 * @param {number} data.subtotal - Subtotal
 * @param {number} data.descuento - Discount
 * @param {number} data.total - Total
 * @param {number} data.adelanto - Down payment
 * @param {number} data.saldo - Remaining balance
 */
export const generateQuotationPDF = (data) => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 280] });
    const w = 80;
    let y = 10;
    const left = 5;
    const right = w - 5;

    const center = (text, yPos, size = 10, style = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        const tw = doc.getTextWidth(text);
        doc.text(text, (w - tw) / 2, yPos);
    };

    const dashed = (yPos) => {
        doc.setDrawColor(180);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(left, yPos, right, yPos);
        doc.setLineDashPattern([], 0);
    };

    const fechaObj = data.fecha instanceof Date ? data.fecha : new Date(data.fecha);
    const fStr = fechaObj.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hStr = fechaObj.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    const dateText = `${fStr} ${hStr}`;

    // HEADER
    doc.setTextColor(30, 30, 30);
    center('FERRETERÍA NOA', y, 14, 'bold');
    y += 5;
    doc.setTextColor(80);
    center('COTIZACIÓN / PRESUPUESTO', y, 10, 'bold');
    y += 5;
    doc.setTextColor(100);
    center(`N° ${data.cotizacionId}`, y, 8);
    y += 7;
    dashed(y); y += 5;

    // QUOTE INFO
    doc.setTextColor(30); doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(dateText, left + 13, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', left, y);
    doc.setFont('helvetica', 'normal');
    const clienteText = data.cliente.length > 28 ? data.cliente.substring(0, 28) + '...' : data.cliente;
    doc.text(clienteText, left + 14, y);
    y += 5;
    dashed(y); y += 4;

    // COLUMN HEADERS
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(80);
    doc.text('PRODUCTO', left, y);
    doc.text('CANT', left + 38, y);
    doc.text('P.U.', left + 48, y);
    doc.text('TOTAL', right - doc.getTextWidth('TOTAL'), y);
    y += 3; dashed(y); y += 4;

    // ITEMS
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30); doc.setFontSize(7.5);
    data.items.forEach(item => {
        const nombreArr = doc.splitTextToSize(item.nombre, 35);
        const sub = (item.cantidad * item.precio).toFixed(2);
        doc.text(nombreArr, left, y);
        doc.text(String(item.cantidad), left + 40, y);
        doc.text(Number(item.precio).toFixed(2), left + 48, y);
        doc.text(sub, right - doc.getTextWidth(sub), y);
        y += (nombreArr.length * 3.5);
    });

    y += 1; dashed(y); y += 5;

    // TOTALS
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(30);
    const stStr = `Bs ${Number(data.subtotal).toFixed(2)}`;
    doc.text('Subtotal:', left, y);
    doc.text(stStr, right - doc.getTextWidth(stStr), y);
    y += 4;

    if (data.descuento > 0) {
        doc.setTextColor(200, 50, 50);
        const dsStr = `- Bs ${Number(data.descuento).toFixed(2)}`;
        doc.text('Descuento:', left, y);
        doc.text(dsStr, right - doc.getTextWidth(dsStr), y);
        y += 4;
        doc.setTextColor(30);
    }

    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    const tStr = `Bs ${Number(data.total).toFixed(2)}`;
    doc.text('TOTAL:', left, y);
    doc.text(tStr, right - doc.getTextWidth(tStr), y);
    y += 5;

    if (data.adelanto > 0) {
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 150, 60);
        const adStr = `Bs ${Number(data.adelanto).toFixed(2)}`;
        doc.text('Adelanto:', left, y);
        doc.text(adStr, right - doc.getTextWidth(adStr), y);
        y += 4;

        doc.setTextColor(180, 80, 0);
        doc.setFont('helvetica', 'bold');
        const salStr = `Bs ${Number(data.saldo).toFixed(2)}`;
        doc.text('Saldo Pendiente:', left, y);
        doc.text(salStr, right - doc.getTextWidth(salStr), y);
        y += 4;
        doc.setTextColor(30);
    }

    y += 2;
    dashed(y); y += 5;

    // FOOTER
    doc.setTextColor(120); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    center('Esta cotización es válida por 30 días.', y, 7);
    y += 4;
    center('Ferretería NOA - Su ferretería de confianza', y, 6.5);

    doc.save(`Cotizacion_${data.cotizacionId}_${fStr.replace(/\//g, '-')}.pdf`);
};
