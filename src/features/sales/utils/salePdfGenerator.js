import { jsPDF } from 'jspdf';

/**
 * Generates a PDF receipt for a sale.
 * @param {Object} data - The sale data.
 * @param {number|string} data.ventaId - Sale ID.
 * @param {Date|string} data.fecha - Sale date.
 * @param {string} data.cliente - Client name.
 * @param {string} data.metodoPago - Payment method (efectivo, tarjeta, etc.).
 * @param {string} data.tipoVenta - Sale type (pagada, credito).
 * @param {number} [data.plazo] - Credit term.
 * @param {Array} data.items - Array of items [{nombre, cantidad, precio}].
 * @param {number} data.subtotal - Subtotal amount.
 * @param {number} data.descuento - Discount amount.
 * @param {number} data.total - Total amount.
 */
export const generateSalePDF = (data) => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 250] });
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
    doc.setTextColor(100);
    center('Comprobante de Venta', y, 9);
    y += 7;
    dashed(y); y += 5;

    // SALE INFO
    doc.setTextColor(30); doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Producto(s):', left, y);
    doc.setFont('helvetica', 'normal');
    const productNames = data.items.map(i => i.nombre).join(', ');
    const maxW = right - left - 22;
    const splitNames = doc.splitTextToSize(productNames, maxW);
    doc.text(splitNames, left + 22, y);
    y += (splitNames.length * 3.5) + 1;

    doc.text(dateText, right - doc.getTextWidth(dateText), y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.cliente.length > 28 ? data.cliente.substring(0, 28) + '...' : data.cliente, left + 14, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('Pago:', left, y);
    doc.setFont('helvetica', 'normal');
    const metLabel = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', 'Cr\u00e9dito': 'Cr\u00e9dito' };
    let pagoText = metLabel[data.metodoPago] || data.metodoPago;
    if (data.tipoVenta === 'credito' && data.plazo) pagoText += ` (${data.plazo} d\u00edas)`;
    doc.text(pagoText, left + 11, y);
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
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
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
    y += 6;
    dashed(y); y += 5;

    // FOOTER
    doc.setTextColor(120); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    center('\u00a1Gracias por su compra!', y, 8, 'bold');
    y += 4;
    center('Ferreter\u00eda NOA - Su ferreter\u00eda de confianza', y, 6.5);

    doc.save(`Venta_${data.ventaId}_${fStr.replace(/\//g, '-')}.pdf`);
};
