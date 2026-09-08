import { jsPDF } from 'jspdf';

/**
 * Genera un PDF de VENTA en hoja tamaño carta para impresora normal.
 * @param {Object}        data
 * @param {number|string} data.ventaId
 * @param {Date|string}   data.fecha
 * @param {string}        data.cliente
 * @param {string}        data.metodoPago   efectivo | tarjeta | transferencia | Crédito
 * @param {string}        data.tipoVenta    pagada | credito
 * @param {number}        [data.plazo]
 * @param {Array}         data.items        [{nombre, cantidad, precio}]
 * @param {number}        data.subtotal
 * @param {number}        data.descuento
 * @param {number}        data.total
 */
export const generateSalePDF = (data) => {
    const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

    // ── Dimensiones de página carta ────────────────────────────────────────────
    const PH  = 279.4;
    const ML  = 12;
    const MR  = 215.9 - 12;   // 203.9
    const CW  = MR - ML;      // 191.9

    // ── Helpers ───────────────────────────────────────────────────────────────
    /** Línea horizontal */
    const hl = (x1, y, x2, lw = 0.25) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(lw);
        doc.line(x1, y, x2, y);
    };
    /** Línea vertical */
    const vl = (x, y1, y2, lw = 0.25) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(lw);
        doc.line(x, y1, x, y2);
    };
    /** Rectángulo solo borde */
    const box = (x, y, w, h, lw = 0.3) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(lw);
        doc.rect(x, y, w, h, 'S');
    };
    /** Rectángulo con fondo */
    const boxFill = (x, y, w, h, r, g, b, lw = 0.3) => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(lw);
        doc.setFillColor(r, g, b);
        doc.rect(x, y, w, h, 'FD');
    };
    const tL = (txt, x, y, sz = 8, st = 'normal', cr = 0, cg = 0, cb = 0) => {
        doc.setFontSize(sz);
        doc.setFont('helvetica', st);
        doc.setTextColor(cr, cg, cb);
        doc.text(String(txt ?? ''), x, y);
    };
    const tR = (txt, x, y, sz = 8, st = 'normal') => {
        doc.setFontSize(sz);
        doc.setFont('helvetica', st);
        doc.setTextColor(0, 0, 0);
        doc.text(String(txt ?? ''), x, y, { align: 'right' });
    };
    const tC = (txt, cx, y, sz = 8, st = 'normal') => {
        doc.setFontSize(sz);
        doc.setFont('helvetica', st);
        doc.setTextColor(0, 0, 0);
        doc.text(String(txt ?? ''), cx, y, { align: 'center' });
    };

    // ── Fecha ──────────────────────────────────────────────────────────────────
    const fechaObj = data.fecha instanceof Date ? data.fecha : new Date(data.fecha);
    const fStr = fechaObj.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hStr = fechaObj.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

    // ══════════════════════════════════════════════════════════════════════════
    // BLOQUE 1 — ENCABEZADO
    // ══════════════════════════════════════════════════════════════════════════
    let y = 12;
    const LOGO_W = 70;
    const HEAD_H = 38;

    box(ML, y, CW, HEAD_H, 0.5);
    vl(ML + LOGO_W, y, y + HEAD_H, 0.4);

    // Columna izquierda
    tL('FERRETERÍA', ML + 2, y + 8,  13, 'bold');
    tL('NOA',        ML + 4, y + 19, 20, 'bold');
    tL('Pedro Luque Cahuana',                   ML + 2, y + 25, 7,   'normal');
    tL('Av. Las Americas Esq. Huancane N° 395', ML + 2, y + 29, 6.5, 'normal');
    tL('Villa Fátima  Col: 75848995-76544667',  ML + 2, y + 33, 6.5, 'normal');
    tL('La Paz - Bolivia',                      ML + 2, y + 37, 6.5, 'normal', 80, 80, 80);

    // Columna derecha
    const RX = ML + LOGO_W + 3;
    const RW = CW - LOGO_W - 3;
    tC('VENTA', RX + RW / 2, y + 12, 22, 'bold');

    // Cajitas N°, Fecha, Hora
    const BY = y + 17;
    const BH = 7;
    const NW = 30;
    const DW = Math.floor((RW - NW - 6) / 2);
    const HW = RW - NW - DW - 8;

    box(RX,              BY, NW,  BH);
    box(RX + NW + 4,     BY, DW,  BH);
    box(RX + NW + DW + 8, BY, HW, BH);

    tL('N°',    RX + 2,          BY + 5, 7,   'bold');
    tL(String(data.ventaId), RX + 9, BY + 5, 8, 'bold');
    tL('Fecha:', RX + NW + 5,    BY + 5, 7,   'bold');
    tL(fStr,    RX + NW + 17,    BY + 5, 7,   'normal');
    tL('Hora:', RX + NW + DW + 9, BY + 5, 7,  'bold');
    tL(hStr,   RX + NW + DW + 19, BY + 5, 7,  'normal');

    // Método de pago
    const metLabel = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', 'Crédito': 'Crédito' };
    let pagoText = metLabel[data.metodoPago] || data.metodoPago || '';
    if (data.tipoVenta === 'credito' && data.plazo) pagoText += ` (${data.plazo} días)`;
    const PY = BY + BH + 2;
    box(RX, PY, RW - 2, 6);
    tL('Pago:',  RX + 2,  PY + 4.2, 7,   'bold');
    tL(pagoText, RX + 14, PY + 4.2, 7.5, 'normal');

    y += HEAD_H;

    // ── SEÑOR (ES) ─────────────────────────────────────────────────────────────
    y += 4;
    box(ML, y, CW, 8, 0.4);
    vl(ML + 32, y, y + 8, 0.3);
    tL('SEÑOR (ES)',                       ML + 2,  y + 5.5, 8,   'bold');
    tL(data.cliente || 'Consumidor Final', ML + 34, y + 5.5, 8.5, 'normal');
    y += 8;

    y += 4;
    tL('Detalle de los materiales vendidos:', ML, y + 4, 8, 'normal');
    y += 9;

    // ══════════════════════════════════════════════════════════════════════════
    // BLOQUE 2 — TABLA
    // ══════════════════════════════════════════════════════════════════════════
    const C_N    = { x: ML,       w: 9  };
    const C_DESC = { x: ML + 9,   w: 78 };
    const C_CANT = { x: ML + 87,  w: 17 };
    const C_PU   = { x: ML + 104, w: 22 };
    const C_TOT  = { x: ML + 126, w: 26 };
    const C_OBS  = { x: ML + 152, w: MR - (ML + 152) };
    const COLS   = [C_N, C_DESC, C_CANT, C_PU, C_TOT, C_OBS];

    const TABLE_TOP  = y;
    const HDR_H      = 7;
    const TOTAL_ROW_H = 7;
    const ROW_H      = 6;
    const MAX_ROWS   = data.items.length;

    // Cabecera
    boxFill(ML, TABLE_TOP, CW, HDR_H, 210, 210, 210, 0.4);
    COLS.forEach(c => vl(c.x, TABLE_TOP, TABLE_TOP + HDR_H, 0.3));
    vl(MR, TABLE_TOP, TABLE_TOP + HDR_H, 0.3);

    const hy = TABLE_TOP + 5;
    tC('N°',                   C_N.x    + C_N.w / 2,    hy, 7, 'bold');
    tC('DESCRIPCIÓN / COMPRA', C_DESC.x + C_DESC.w / 2, hy, 7, 'bold');
    tC('CANT.',                C_CANT.x + C_CANT.w / 2, hy, 7, 'bold');
    tC('P/U',                  C_PU.x   + C_PU.w / 2,   hy, 7, 'bold');
    tC('TOTAL Bs',             C_TOT.x  + C_TOT.w / 2,  hy, 7, 'bold');
    tC('OBSERVACIÓN',          C_OBS.x  + C_OBS.w / 2,  hy, 7, 'bold');

    y = TABLE_TOP + HDR_H;

    // Dibujar solo las filas con ítems reales
    data.items.forEach((item, i) => {
        const ry = y + i * ROW_H;

        hl(ML, ry, MR, 0.2);
        COLS.forEach(c => vl(c.x, ry, ry + ROW_H, 0.2));
        vl(MR, ry, ry + ROW_H, 0.2);

        tC(String(i + 1), C_N.x + C_N.w / 2, ry + 3.8, 6.5, 'normal');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const nameLine = doc.splitTextToSize(String(item.nombre || ''), C_DESC.w - 2)[0];
        doc.text(nameLine, C_DESC.x + 1, ry + 3.8);

        tC(String(item.cantidad),                    C_CANT.x + C_CANT.w / 2,  ry + 3.8, 7, 'normal');
        tR(Number(item.precio).toFixed(2),            C_PU.x + C_PU.w - 1,      ry + 3.8, 7, 'normal');
        tR((item.cantidad * item.precio).toFixed(2),  C_TOT.x + C_TOT.w - 1,    ry + 3.8, 7, 'normal');
    });

    y += MAX_ROWS * ROW_H;
    hl(ML, y, MR, 0.4);

    // Fila TOTAL
    box(ML, y, CW, TOTAL_ROW_H, 0.5);
    COLS.forEach(c => vl(c.x, y, y + TOTAL_ROW_H, 0.3));
    vl(MR, y, y + TOTAL_ROW_H, 0.3);

    const labelEndX = C_PU.x + C_PU.w;
    tC('TOTAL', ML + (labelEndX - ML) / 2, y + 4.8, 8, 'bold');
    tR('Bs ' + Number(data.total).toFixed(2), C_TOT.x + C_TOT.w - 1, y + 4.8, 8, 'bold');
    if (data.descuento > 0) {
        tL('Desc: Bs ' + Number(data.descuento).toFixed(2), C_OBS.x + 2, y + 4.8, 7, 'normal');
    }
    y += TOTAL_ROW_H;

    // ══════════════════════════════════════════════════════════════════════════
    // BLOQUE 3 — PIE DE PÁGINA FIJO
    // ══════════════════════════════════════════════════════════════════════════
    const FY  = PH - 34;
    const C3W = CW / 3;
    const C2W = CW / 2;
    const FH  = 7;

    box(ML, FY, CW, FH, 0.4);
    vl(ML + C3W, FY, FY + FH, 0.3);
    vl(ML + C3W * 2, FY, FY + FH, 0.3);
    tL('COMPROBANTE DE VENTA',           ML + 2,             FY + 4.8, 7,   'bold');
    tC('¡GRACIAS POR SU COMPRA!',        ML + C3W + C3W / 2, FY + 4.8, 7.5, 'bold');

    box(ML, FY + FH, CW, FH, 0.4);
    vl(ML + C3W, FY + FH, FY + FH * 2, 0.3);
    tL('VÁLIDO COMO COMPROBANTE INTERNO', ML + 2,             FY + FH + 4.8, 7,   'bold');
    tC('Ferretería NOA',                  ML + C3W + C3W / 2, FY + FH + 4.8, 7.5, 'normal');

    box(ML, FY + FH * 2, CW, FH, 0.4);
    vl(ML + C2W, FY + FH * 2, FY + FH * 3, 0.3);
    tL('CÉDULA DE IDENTIDAD', ML + 2,          FY + FH * 2 + 4.8, 7,   'bold');
    tL('13054654 L-P',        ML + C2W * 0.4,  FY + FH * 2 + 4.8, 7.5, 'normal');
    tL('NIT',                 ML + C2W + 2,    FY + FH * 2 + 4.8, 7,   'bold');
    tL('13054654010',         ML + C2W + 16,   FY + FH * 2 + 4.8, 7.5, 'normal');

    doc.save(`Venta_${data.ventaId}_${fStr.replace(/\//g, '-')}.pdf`);
};
