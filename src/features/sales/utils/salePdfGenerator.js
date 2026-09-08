import { jsPDF } from 'jspdf';

/**
 * Genera un PDF de VENTA en hoja tamaño carta (216 × 279 mm).
 * Formato basado en el modelo físico de Ferretería NOA.
 *
 * @param {Object}        data
 * @param {number|string} data.ventaId
 * @param {Date|string}   data.fecha
 * @param {string}        data.cliente
 * @param {string}        data.metodoPago   - efectivo | tarjeta | transferencia | Crédito
 * @param {string}        data.tipoVenta    - pagada | credito
 * @param {number}        [data.plazo]      - días de crédito
 * @param {Array}         data.items        - [{nombre, cantidad, precio}]
 * @param {number}        data.subtotal
 * @param {number}        data.descuento
 * @param {number}        data.total
 */
export const generateSalePDF = (data) => {
    // ── Configuración de página ────────────────────────────────────────────────
    const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
    const PW = 215.9;
    const PH = 279.4;
    const ML = 12;
    const MR = PW - 12;
    const CW = MR - ML;

    // ── Helpers ────────────────────────────────────────────────────────────────
    const fechaObj = data.fecha instanceof Date ? data.fecha : new Date(data.fecha);
    const fStr = fechaObj.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hStr = fechaObj.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

    const line = (x1, y, x2, lw = 0.3) => {
        doc.setDrawColor(0);
        doc.setLineWidth(lw);
        doc.line(x1, y, x2, y);
    };
    const rect = (x, y, w, h, lw = 0.3) => {
        doc.setDrawColor(0);
        doc.setLineWidth(lw);
        doc.rect(x, y, w, h);
    };
    const txt = (text, x, y, size = 9, style = 'normal', color = [0, 0, 0]) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        doc.setTextColor(...color);
        doc.text(String(text ?? ''), x, y);
    };
    const txtR = (text, x, y, size = 9, style = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        doc.setTextColor(0, 0, 0);
        doc.text(String(text ?? ''), x, y, { align: 'right' });
    };
    const txtC = (text, x, y, w, size = 9, style = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        doc.setTextColor(0, 0, 0);
        doc.text(String(text ?? ''), x + w / 2, y, { align: 'center' });
    };

    // ══════════════════════════════════════════════════════════════════════════
    // SECCIÓN 1 — ENCABEZADO
    // ══════════════════════════════════════════════════════════════════════════
    let y = 12;

    rect(ML, y, CW, 38, 0.5);

    const logoW = 72;
    line(ML + logoW, y, ML + logoW, y + 38, 0.3);

    txt('FERRETERÍA', ML + 3, y + 8, 14, 'bold');
    txt('""', ML + 3, y + 19, 9, 'normal', [80, 80, 80]);
    txt('NOA', ML + 10, y + 20, 22, 'bold');
    txt('""', ML + 34, y + 14, 9, 'normal', [80, 80, 80]);

    txt('Pedro Luque Cahuana', ML + 3, y + 26, 7.5, 'normal');
    txt('Av. Las Americas Esq. Huancane N° 395', ML + 3, y + 30, 6.5, 'normal');
    txt('Villa Fátima - Col: 75848995-76544667', ML + 3, y + 34, 6.5, 'normal');
    txt('La Paz - Bolivia', ML + 3, y + 38, 6.5, 'normal', [80, 80, 80]);

    // Título VENTA (columna derecha)
    const titleX = ML + logoW + 4;
    const titleW = CW - logoW - 4;
    txt('VENTA', titleX + titleW / 2 - 2, y + 18, 24, 'bold');

    // Campos N°, Fecha y Hora
    const boxY = y + 22;
    const boxH = 7;
    const numW = 28;
    const dateW = Math.floor((titleW - numW - 2) / 2);
    const hourW = titleW - numW - dateW - 4;

    rect(titleX, boxY, numW, boxH, 0.3);
    rect(titleX + numW + 2, boxY, dateW, boxH, 0.3);
    rect(titleX + numW + dateW + 4, boxY, hourW, boxH, 0.3);

    txt('N°', titleX + 1, boxY + 5, 7, 'bold');
    txt(String(data.ventaId), titleX + 8, boxY + 5, 8, 'bold');
    txt('Fecha:', titleX + numW + 3, boxY + 5, 7, 'bold');
    txt(fStr, titleX + numW + 16, boxY + 5, 7, 'normal');
    txt('Hora:', titleX + numW + dateW + 5, boxY + 5, 7, 'bold');
    txt(hStr, titleX + numW + dateW + 15, boxY + 5, 7, 'normal');

    // Método de pago
    const metLabel = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', 'Crédito': 'Crédito' };
    let pagoText = metLabel[data.metodoPago] || data.metodoPago || '';
    if (data.tipoVenta === 'credito' && data.plazo) pagoText += ` (${data.plazo} días)`;

    const pY = boxY + boxH + 1;
    rect(titleX, pY, titleW - 2, 6, 0.3);
    txt('Pago:', titleX + 1, pY + 4.2, 7, 'bold');
    txt(pagoText, titleX + 13, pY + 4.2, 7.5, 'normal');

    y += 38;

    // ── Campo SEÑOR(ES) ────────────────────────────────────────────────────
    y += 5;
    rect(ML, y, CW, 8, 0.4);
    txt('SEÑOR (ES)', ML + 2, y + 5.5, 8, 'bold');
    line(ML + 30, y, ML + 30, y + 8, 0.3);
    txt(data.cliente || 'Consumidor Final', ML + 33, y + 5.5, 8.5, 'normal');
    y += 8;

    // Texto introductorio
    y += 4;
    txt('Detalle de los materiales vendidos:', ML, y + 4, 8, 'normal');
    y += 8;

    // ══════════════════════════════════════════════════════════════════════════
    // SECCIÓN 2 — TABLA DE ÍTEMS
    // ══════════════════════════════════════════════════════════════════════════
    const tableTop = y;
    const COL = {
        n:    { x: ML,       w: 9  },
        desc: { x: ML + 9,   w: 77 },
        cant: { x: ML + 86,  w: 16 },
        pu:   { x: ML + 102, w: 20 },
        tot:  { x: ML + 122, w: 24 },
        obs:  { x: ML + 146, w: MR - ML - 146 },
    };

    const HDR_H = 7;
    doc.setFillColor(230, 230, 230);
    doc.rect(ML, tableTop, CW, HDR_H, 'FD');
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);

    Object.values(COL).forEach(c => line(c.x, tableTop, c.x, tableTop + HDR_H));
    line(MR, tableTop, MR, tableTop + HDR_H);

    const hy = tableTop + 5;
    txtC('N°',                  COL.n.x,    hy, COL.n.w,    7, 'bold');
    txtC('DESCRIPCIÓN / COMPRA',COL.desc.x, hy, COL.desc.w, 7, 'bold');
    txtC('CANT.',               COL.cant.x, hy, COL.cant.w, 7, 'bold');
    txtC('P/U',                 COL.pu.x,   hy, COL.pu.w,   7, 'bold');
    txtC('TOTAL Bs',            COL.tot.x,  hy, COL.tot.w,  7, 'bold');
    txtC('OBSERVACIÓN',         COL.obs.x,  hy, COL.obs.w,  7, 'bold');

    y = tableTop + HDR_H;

    const ROW_H = 5.5;
    const MAX_ROWS = 34;

    rect(ML, y, CW, MAX_ROWS * ROW_H, 0.4);

    for (let i = 0; i < MAX_ROWS; i++) {
        const ry = y + i * ROW_H;
        const item = data.items[i];

        if (i > 0) line(ML, ry, MR, ry, 0.2);

        Object.values(COL).forEach(c => line(c.x, ry, c.x, ry + ROW_H, 0.2));
        line(MR, ry, MR, ry + ROW_H, 0.2);

        txtC(String(i + 1), COL.n.x, ry + 3.8, COL.n.w, 6.5, 'normal');

        if (item) {
            const nombre = item.nombre || '';
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            const displayName = doc.splitTextToSize(nombre, COL.desc.w - 2)[0];
            txt(displayName, COL.desc.x + 1, ry + 3.8, 7, 'normal');
            txtC(String(item.cantidad), COL.cant.x, ry + 3.8, COL.cant.w, 7, 'normal');
            txtR(Number(item.precio).toFixed(2), COL.pu.x + COL.pu.w - 1, ry + 3.8, 7, 'normal');
            const sub = (item.cantidad * item.precio).toFixed(2);
            txtR(sub, COL.tot.x + COL.tot.w - 1, ry + 3.8, 7, 'normal');
        } else {
            txtR('0.00', COL.tot.x + COL.tot.w - 1, ry + 3.8, 6.5, 'normal');
            doc.setTextColor(200, 200, 200);
            doc.setTextColor(0, 0, 0);
        }
    }

    y += MAX_ROWS * ROW_H;

    // ── Fila TOTAL ─────────────────────────────────────────────────────────
    rect(ML, y, CW, 7, 0.5);
    Object.values(COL).forEach(c => line(c.x, y, c.x, y + 7));
    line(MR, y, MR, y + 7);

    txtC('TOTAL', COL.n.x, y + 4.8, COL.n.w + COL.desc.w + COL.cant.w + COL.pu.w, 8, 'bold');
    txtR('Bs ' + Number(data.total).toFixed(2), COL.tot.x + COL.tot.w - 1, y + 4.8, 8, 'bold');

    if (data.descuento > 0) {
        txt(`Desc: Bs ${Number(data.descuento).toFixed(2)}`, COL.obs.x + 2, y + 4.8, 7, 'normal');
    }

    y += 7;

    // ══════════════════════════════════════════════════════════════════════════
    // SECCIÓN 3 — PIE DE PÁGINA
    // ══════════════════════════════════════════════════════════════════════════
    const footerY = PH - 28;

    const vCol = CW / 3;

    // Fila 1
    rect(ML, footerY, CW, 7, 0.4);
    line(ML + vCol, footerY, ML + vCol, footerY + 7);
    line(ML + vCol * 2, footerY, ML + vCol * 2, footerY + 7);
    txt('COMPROBANTE DE VENTA', ML + 2, footerY + 4.8, 7, 'bold');
    txtC('¡GRACIAS POR SU COMPRA!', ML + vCol, footerY + 4.8, vCol * 2, 7.5, 'bold');

    // Fila 2
    const f2 = footerY + 7;
    rect(ML, f2, CW, 7, 0.4);
    line(ML + vCol, f2, ML + vCol, f2 + 7);
    txt('VÁLIDO COMO COMPROBANTE INTERNO', ML + 2, f2 + 4.8, 7, 'bold');
    txtC('Ferretería NOA - Su ferretería de confianza', ML + vCol, f2 + 4.8, vCol * 2, 7.5, 'normal');

    // Fila 3
    const f3 = f2 + 7;
    rect(ML, f3, CW, 7, 0.4);
    const half = CW / 2;
    line(ML + half, f3, ML + half, f3 + 7);
    txt('CÉDULA DE IDENTIDAD', ML + 2, f3 + 4.8, 7, 'bold');
    txt('13054654 L-P', ML + half * 0.5, f3 + 4.8, 7.5, 'normal');
    txt('NIT', ML + half + 2, f3 + 4.8, 7, 'bold');
    txt('13054654010', ML + half + 15, f3 + 4.8, 7.5, 'normal');

    doc.save(`Venta_${data.ventaId}_${fStr.replace(/\//g, '-')}.pdf`);
};
