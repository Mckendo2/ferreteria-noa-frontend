import { jsPDF } from 'jspdf';

/**
 * Genera un PDF de COTIZACIÓN en hoja tamaño carta (216 × 279 mm).
 * Formato basado en el modelo físico de Ferretería NOA.
 *
 * @param {Object}        data
 * @param {number|string} data.cotizacionId
 * @param {Date|string}   data.fecha
 * @param {string}        data.cliente
 * @param {Array}         data.items        - [{nombre, cantidad, precio}]
 * @param {number}        data.subtotal
 * @param {number}        data.descuento
 * @param {number}        data.total
 * @param {number}        data.adelanto
 * @param {number}        data.saldo
 * @param {string}        [data.nota]
 */
export const generateQuotationPDF = (data) => {
    // ── Configuración de página ────────────────────────────────────────────────
    const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
    const PW = 215.9;   // ancho carta
    const PH = 279.4;   // alto carta
    const ML = 12;      // margen izquierdo
    const MR = PW - 12; // margen derecho
    const CW = MR - ML; // ancho útil

    // ── Helpers ────────────────────────────────────────────────────────────────
    const fechaObj = data.fecha instanceof Date ? data.fecha : new Date(data.fecha);
    const fStr = fechaObj.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const line  = (x1, y, x2, lw = 0.3, color = [0, 0, 0]) => {
        doc.setDrawColor(...color);
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

    // Borde superior del bloque de encabezado
    rect(ML, y, CW, 38, 0.5);

    // ── Logo / Nombre empresa (columna izquierda) ──────────────────────────
    const logoW = 72;
    // Borde interno separando logo de título
    line(ML + logoW, y, ML + logoW, y + 38, 0.3);

    txt('FERRETERÍA', ML + 3, y + 8, 14, 'bold');
    // "NOA" grande con comillas simuladas
    txt('""', ML + 3, y + 19, 9, 'normal', [80, 80, 80]);
    txt('NOA', ML + 10, y + 20, 22, 'bold');
    txt('""', ML + 34, y + 14, 9, 'normal', [80, 80, 80]);

    // Dirección
    txt('Pedro Luque Cahuana', ML + 3, y + 26, 7.5, 'normal');
    txt('Av. Las Americas Esq. Huancane N° 395', ML + 3, y + 30, 6.5, 'normal');
    txt('Villa Fátima - Col: 75848995-76544667', ML + 3, y + 34, 6.5, 'normal');
    txt('La Paz - Bolivia', ML + 3, y + 38, 6.5, 'normal', [80, 80, 80]);

    // ── Título COTIZACIÓN (columna derecha) ────────────────────────────────
    const titleX = ML + logoW + 4;
    const titleW = CW - logoW - 4;
    txt('COTIZACIÓN', titleX + titleW / 2 - 2, y + 18, 22, 'bold');
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');

    // Campos N° y Fecha alineados
    const boxY = y + 24;
    const boxH = 7;
    const numW = 30;
    const dateW = titleW - numW - 2;

    rect(titleX, boxY, numW, boxH, 0.3);
    rect(titleX + numW + 2, boxY, dateW - 2, boxH, 0.3);

    txt('N°', titleX + 1, boxY + 5, 7, 'bold');
    txt(String(data.cotizacionId), titleX + 8, boxY + 5, 8, 'bold');
    txt('Fecha:', titleX + numW + 4, boxY + 5, 7, 'bold');
    txt(fStr, titleX + numW + 18, boxY + 5, 7.5, 'normal');

    y += 38;

    // ── Campo SEÑOR(ES) ────────────────────────────────────────────────────
    y += 5;
    rect(ML, y, CW, 8, 0.4);
    txt('SEÑOR (ES)', ML + 2, y + 5.5, 8, 'bold');
    line(ML + 30, y, ML + 30, y + 8, 0.3);
    txt(data.cliente || 'Consumidor Final', ML + 33, y + 5.5, 8.5, 'normal');

    y += 8;

    // ── Texto introductorio ────────────────────────────────────────────────
    y += 4;
    txt('Enviamos conforme a su solicitud cotización de los siguientes materiales:', ML, y + 4, 8, 'normal');
    y += 8;

    // ══════════════════════════════════════════════════════════════════════════
    // SECCIÓN 2 — TABLA DE ÍTEMS
    // ══════════════════════════════════════════════════════════════════════════
    // Columnas: N° | DESCRIPCIÓN/COMPRA | CANT. | P/U | TOTAL Bs | OBSERVACIONES
    const tableTop = y;
    const COL = {
        n:    { x: ML,       w: 9  },   // N°
        desc: { x: ML + 9,   w: 77 },   // Descripción
        cant: { x: ML + 86,  w: 16 },   // CANT.
        pu:   { x: ML + 102, w: 20 },   // P/U
        tot:  { x: ML + 122, w: 24 },   // TOTAL Bs
        obs:  { x: ML + 146, w: MR - ML - 146 }, // OBSERVACIONES
    };

    const HDR_H = 7;
    // Cabecera de tabla
    doc.setFillColor(230, 230, 230);
    doc.rect(ML, tableTop, CW, HDR_H, 'FD');
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);

    // Líneas verticales del encabezado
    Object.values(COL).forEach(c => {
        line(c.x, tableTop, c.x, tableTop + HDR_H, 0.3);
    });
    line(MR, tableTop, MR, tableTop + HDR_H, 0.3);

    const hy = tableTop + 5;
    txtC('N°',              COL.n.x,    hy, COL.n.w,    7, 'bold');
    txtC('DESCRIPCIÓN / COMPRA', COL.desc.x, hy, COL.desc.w, 7, 'bold');
    txtC('CANT.',           COL.cant.x, hy, COL.cant.w, 7, 'bold');
    txtC('P/U',             COL.pu.x,   hy, COL.pu.w,   7, 'bold');
    txtC('TOTAL Bs',        COL.tot.x,  hy, COL.tot.w,  7, 'bold');
    txtC('OBSERVACIÓN',     COL.obs.x,  hy, COL.obs.w,  7, 'bold');

    y = tableTop + HDR_H;

    // ── Filas de datos ─────────────────────────────────────────────────────
    const ROW_H = 5.5;
    const MAX_ROWS = 34; // filas a dibujar (reales + vacías)

    // Dibujar todas las filas (borde exterior del bloque)
    rect(ML, y, CW, MAX_ROWS * ROW_H, 0.4);

    for (let i = 0; i < MAX_ROWS; i++) {
        const ry = y + i * ROW_H;
        const item = data.items[i];

        // línea horizontal de fila (salvo la primera que ya tiene el rect)
        if (i > 0) line(ML, ry, MR, ry, 0.2);

        // líneas verticales
        Object.values(COL).forEach(c => line(c.x, ry, c.x, ry + ROW_H, 0.2));
        line(MR, ry, MR, ry + ROW_H, 0.2);

        // número de fila
        txtC(String(i + 1), COL.n.x, ry + 3.8, COL.n.w, 6.5, 'normal');

        if (item) {
            const nombre = item.nombre || '';
            // truncar si es muy largo
            const displayName = doc.setFontSize(7) && doc.setFont('helvetica', 'normal')
                ? doc.splitTextToSize(nombre, COL.desc.w - 2)[0]
                : nombre;
            txt(displayName, COL.desc.x + 1, ry + 3.8, 7, 'normal');
            txtC(String(item.cantidad), COL.cant.x, ry + 3.8, COL.cant.w, 7, 'normal');
            txtR(Number(item.precio).toFixed(2), COL.pu.x + COL.pu.w - 1, ry + 3.8, 7, 'normal');
            const sub = (item.cantidad * item.precio).toFixed(2);
            txtR(sub, COL.tot.x + COL.tot.w - 1, ry + 3.8, 7, 'normal');
        } else {
            // fila vacía: sólo mostrar 0.00 en total
            txtR('0.00', COL.tot.x + COL.tot.w - 1, ry + 3.8, 6.5, 'normal', [160, 160, 160]);
        }
    }

    y += MAX_ROWS * ROW_H;

    // ── Fila TOTAL ─────────────────────────────────────────────────────────
    rect(ML, y, CW, 7, 0.5);
    Object.values(COL).forEach(c => line(c.x, y, c.x, y + 7, 0.3));
    line(MR, y, MR, y + 7, 0.3);

    txtC('TOTAL', COL.n.x, y + 4.8, COL.n.w + COL.desc.w + COL.cant.w + COL.pu.w, 8, 'bold');
    txtR('Bs ' + Number(data.total).toFixed(2), COL.tot.x + COL.tot.w - 1, y + 4.8, 8, 'bold');

    if (data.descuento > 0) {
        // fila descuento dentro de observaciones
        txt(`Desc: Bs ${Number(data.descuento).toFixed(2)}`, COL.obs.x + 2, y + 4.8, 7, 'normal');
    }

    y += 7;

    // ── Adelanto / Saldo (si aplica) ───────────────────────────────────────
    if (Number(data.adelanto) > 0) {
        rect(ML, y, CW, 6, 0.3);
        line(COL.tot.x, y, COL.tot.x, y + 6, 0.3);
        txt('Adelanto recibido:', ML + 2, y + 4.2, 7.5, 'normal');
        txtR('Bs ' + Number(data.adelanto).toFixed(2), COL.tot.x + COL.tot.w - 1, y + 4.2, 7.5, 'bold');
        y += 6;

        rect(ML, y, CW, 6, 0.3);
        line(COL.tot.x, y, COL.tot.x, y + 6, 0.3);
        txt('Saldo pendiente:', ML + 2, y + 4.2, 7.5, 'normal');
        txtR('Bs ' + Number(data.saldo).toFixed(2), COL.tot.x + COL.tot.w - 1, y + 4.2, 7.5, 'bold');
        y += 6;
    }

    // ── Nota / Observación ─────────────────────────────────────────────────
    if (data.nota) {
        y += 2;
        txt('Nota: ' + data.nota, ML, y + 4, 7.5, 'normal', [60, 60, 60]);
        y += 7;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SECCIÓN 3 — PIE DE PÁGINA (datos fijos de la empresa)
    // ══════════════════════════════════════════════════════════════════════════
    const footerY = PH - 28;

    // Fila 1: Validez
    rect(ML, footerY, CW, 7, 0.4);
    const vCol = CW / 3;
    line(ML + vCol, footerY, ML + vCol, footerY + 7, 0.3);
    line(ML + vCol * 2, footerY, ML + vCol * 2, footerY + 7, 0.3);
    txt('VALIDEZ DE LA PROFORMA', ML + 2, footerY + 4.8, 7, 'bold');
    txtC('15 DIAS CALENDARIO', ML + vCol, footerY + 4.8, vCol, 7.5, 'bold');
    txt('', ML + vCol * 2 + 2, footerY + 4.8, 7, 'normal');

    // Fila 2: Girar cheque a nombre
    const f2 = footerY + 7;
    rect(ML, f2, CW, 7, 0.4);
    line(ML + vCol, f2, ML + vCol, f2 + 7, 0.3);
    txt('GIRAR CHEQUE A NOMBRE', ML + 2, f2 + 4.8, 7, 'bold');
    txtC('Pedro Luque Cahuana', ML + vCol, f2 + 4.8, vCol * 2, 8, 'normal');

    // Fila 3: Cédula / NIT
    const f3 = f2 + 7;
    rect(ML, f3, CW, 7, 0.4);
    const half = CW / 2;
    line(ML + half, f3, ML + half, f3 + 7, 0.3);
    txt('CÉDULA DE IDENTIDAD', ML + 2, f3 + 4.8, 7, 'bold');
    txt('13054654 L-P', ML + half * 0.5, f3 + 4.8, 7.5, 'normal');
    txt('NIT', ML + half + 2, f3 + 4.8, 7, 'bold');
    txt('13054654010', ML + half + 15, f3 + 4.8, 7.5, 'normal');

    // ── Guardar ────────────────────────────────────────────────────────────────
    doc.save(`Cotizacion_${data.cotizacionId}_${fStr.replace(/\//g, '-')}.pdf`);
};
