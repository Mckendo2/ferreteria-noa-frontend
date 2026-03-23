import { jsPDF } from 'jspdf';

export const generatePurchasePDF = (data) => {
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

    // HEADER
    doc.setTextColor(30, 30, 30);
    center('FERRETERÍA NOA', y, 14, 'bold');
    y += 5;
    doc.setTextColor(100);
    center('Comprobante de Compra', y, 9);
    y += 7;
    dashed(y); y += 5;

    // PURCHASE INFO
    doc.setTextColor(30); doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Proveedor:', left, y);
    doc.setFont('helvetica', 'normal');
    const proveedorText = data.proveedor.length > 25 ? data.proveedor.substring(0, 25) + '...' : data.proveedor;
    doc.text(proveedorText, left + 18, y);
    y += 5;

    const fStr = data.fecha.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hStr = data.fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha:', left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${fStr} ${hStr}`, left + 12, y);
    y += 6;
    dashed(y); y += 4;

    // COLUMN HEADERS
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(80);
    doc.text('PRODUCTO', left, y);
    doc.text('CANT', left + 38, y);
    doc.text('C.U.', left + 48, y);
    doc.text('TOTAL', right - doc.getTextWidth('TOTAL'), y);
    y += 4; dashed(y); y += 4;

    // ITEMS
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30); doc.setFontSize(7.5);
    data.items.forEach(item => {
        const nombre = item.nombre.length > 20 ? item.nombre.substring(0, 20) + '\u2026' : item.nombre;
        const sub = (item.cantidad * item.precio).toFixed(2);
        doc.text(nombre, left, y);
        doc.text(String(item.cantidad), left + 40, y);
        doc.text(item.precio.toFixed(2), left + 48, y);
        doc.text(sub, right - doc.getTextWidth(sub), y);
        y += 4.5;
    });

    y += 2; dashed(y); y += 5;

    // TOTAL
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    const tStr = `Bs ${data.total.toFixed(2)}`;
    doc.text('TOTAL DE COMPRA:', left, y);
    doc.text(tStr, right - doc.getTextWidth(tStr), y);
    y += 7;
    dashed(y); y += 6;

    // FOOTER
    doc.setTextColor(120); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    center('Control Interno de Ingreso de Mercadería', y, 7.5, 'bold');
    y += 4;
    center('Ferretería NOA', y, 6.5);

    doc.save(`Compra_${data.compraId || 'Nueva'}_${fStr.replace(/\//g, '-')}.pdf`);
};
