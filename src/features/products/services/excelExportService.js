import XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';

export const exportInventoryToExcel = (products, categories, filterCategory = 'all') => {
    // 1. Filtrar los productos si se especificó una categoría
    let filteredProducts = products;
    if (filterCategory !== 'all') {
        filteredProducts = products.filter(p => p.categoria_id === filterCategory);
    }

    // map helper
    const getCategoryName = (categoryId) => {
        const cat = categories.find(c => c.value === categoryId);
        return cat ? cat.label : `Categoría ${categoryId}`;
    };

    const wb = XLSX.utils.book_new();

    // Arrays para guardar la data fila por fila (vacíos iniciales para las cabeceras personalizadas)
    const wsData = [
        ["Importación Masiva de Inventario"], 
        ["Instrucciones: Completa esta plantilla con las indicaciones de cada columna. Recuerda que las primeras 3 columnas son obligatorias para importar tus productos sin problemas."],
        ["OBLIGATORIO*", "", "", "OPCIONAL"],
        [
            "Ingresa el nombre del producto.",
            "Ingresa el precio de venta del producto.",
            "Ingresa la cantidad disponible de tu producto.",
            "¿A qué categoría pertenece tu producto?",
            "¿Cuánto te cuesta comprar este producto?",
            "Ingresa el código de barras de tu producto o su código único.",
            "Escribe la información adicional relacionada con el producto."
        ],
        [
            "* Ingresa máx 500 caracteres.",
            " *Solo puedes usar números y comas, no puedes usar puntos.",
            " *Solo puedes usar números y comas, no puedes usar puntos.",
            "*Escoge una de tu lista de categorías actual o ingresa una nueva.",
            " *Solo puedes usar números y comas, no puedes usar puntos.",
            "*Asegúrate de no dejar espacios dentro del código.",
            "* Ingresa máx 500 caracteres."
        ],
        [
            "Nombre *",
            "Precio de venta *",
            "Unidades disponibles *",
            "Categoría",
            "Costo del producto",
            "Código de barras o SKU",
            "Descripción"
        ]
    ];

    // Mapear los productos a las filas requeridas
    filteredProducts.forEach(product => {
        const row = [
            product.nombre || '',
            product.precio_venta !== undefined && product.precio_venta !== null ? Number(product.precio_venta) : '',
            product.stock !== undefined && product.stock !== null ? Number(product.stock) : '',
            getCategoryName(product.categoria_id) || '',
            product.precio_compra !== undefined && product.precio_compra !== null ? Number(product.precio_compra) : '',
            product.codigo_barras || '',
            product.descripcion || ''
        ];
        wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge Cells (Las filas son 0-indexed)
    ws['!merges'] = [
        { s: { c: 0, r: 0 }, e: { c: 6, r: 0 } }, // Importación masiva
        { s: { c: 0, r: 1 }, e: { c: 6, r: 1 } }, // Instrucciones
        { s: { c: 0, r: 2 }, e: { c: 2, r: 2 } }, // OBLIGATORIO
        { s: { c: 3, r: 2 }, e: { c: 6, r: 2 } }  // OPCIONAL
    ];

    // DEFINIR ESTILOS
    const COLOR_HEADER_OB = "D1E2FF";
    const COLOR_HEADER_OP = "E0E0E0";
    const COLOR_TITLE = "0F59C4";
    const COLOR_WHITE = "FFFFFF";
    
    // Apply column widths roughly based on content
    ws['!cols'] = [
        { wch: 35 }, // Nombre
        { wch: 20 }, // Precio de venta
        { wch: 25 }, // Unidades
        { wch: 30 }, // Categoría
        { wch: 25 }, // Costo
        { wch: 25 }, // Codigo barras
        { wch: 45 }  // Descripcion
    ];

    const getCellRef = (c, r) => XLSX.utils.encode_cell({ c, r });

    // 1. Estilo para Fila 0 (Título principal)
    ws[getCellRef(0, 0)].s = {
        font: { bold: true, sz: 16, color: { rgb: COLOR_WHITE } },
        fill: { patternType: "solid", fgColor: { rgb: COLOR_TITLE } },
        alignment: { horizontal: "center", vertical: "center" }
    };

    // 2. Estilo para Fila 1 (Instrucciones)
    ws[getCellRef(0, 1)].s = {
        font: { italic: true, sz: 10, color: { rgb: "000000" } },
        fill: { patternType: "solid", fgColor: { rgb: COLOR_WHITE } },
        alignment: { horizontal: "center", wrapText: true, vertical: "center" }
    };

    // 3. Estilo para Fila 2 (Obligatorio/Opcional)
    ws[getCellRef(0, 2)].s = {
        font: { bold: true, color: { rgb: "000000" } },
        fill: { patternType: "solid", fgColor: { rgb: COLOR_HEADER_OB } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { bottom: { style: "thin", color: { auto: 1 } } }
    };
    ws[getCellRef(3, 2)] = ws[getCellRef(3, 2)] || { v: "OPCIONAL" };
    ws[getCellRef(3, 2)].s = {
        font: { bold: true, color: { rgb: "000000" } },
        fill: { patternType: "solid", fgColor: { rgb: COLOR_HEADER_OP } },
        alignment: { horizontal: "center", vertical: "center" },
        border: { bottom: { style: "thin", color: { auto: 1 } } }
    };

    // 4. Estilos para Filas 3, 4 y 5 (Cabeceras de columnas)
    for (let c = 0; c < 7; c++) {
        const isObligatory = c < 3;
        const bgColor = isObligatory ? COLOR_HEADER_OB : COLOR_HEADER_OP;
        
        // Fila 3 y 4: Descripciones
        for (let r = 3; r <= 4; r++) {
            if (ws[getCellRef(c, r)]) {
                ws[getCellRef(c, r)].s = {
                    font: { sz: 9 },
                    fill: { patternType: "solid", fgColor: { rgb: bgColor } },
                    alignment: { horizontal: "center", wrapText: true, vertical: "center" },
                    border: {
                        top: r === 3 ? { style: "thin", color: { rgb: "FFFFFF" } } : {},
                        bottom: r === 4 ? { style: "thin", color: { rgb: "FFFFFF" } } : {},
                        left: { style: "thin", color: { rgb: "FFFFFF" } },
                        right: { style: "thin", color: { rgb: "FFFFFF" } }
                    }
                };
            }
        }

        // Fila 5: Nombres de las columnas
        if (ws[getCellRef(c, 5)]) {
            ws[getCellRef(c, 5)].s = {
                font: { bold: true },
                fill: { patternType: "solid", fgColor: { rgb: bgColor } },
                alignment: { horizontal: "center", vertical: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "FFFFFF" } },
                    bottom: { style: "thick", color: { auto: 1 } },
                    left: { style: "thin", color: { rgb: "FFFFFF" } },
                    right: { style: "thin", color: { rgb: "FFFFFF" } }
                }
            };
        }
    }

    // 5. Estilos para las filas de datos
    for (let r = 6; r < wsData.length; r++) {
        for (let c = 0; c < 7; c++) {
            const cell = ws[getCellRef(c, r)];
            if (cell) {
                cell.s = {
                    alignment: { vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "E0E0E0" } },
                        bottom: { style: "thin", color: { rgb: "E0E0E0" } },
                        left: { style: "thin", color: { rgb: "E0E0E0" } },
                        right: { style: "thin", color: { rgb: "E0E0E0" } }
                    }
                };
            }
        }
    }

    // Set row heights for headers
    ws['!rows'] = [
        { hpt: 30 }, // Título
        { hpt: 30 }, // Instrucciones
        { hpt: 20 }, // Obligatorio/Opcional
        { hpt: 40 }, // Desc 1
        { hpt: 40 }, // Desc 2
        { hpt: 25 }, // Nombres columnas
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Mi inventario");
    
    // Configurar y guardar archivo
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const fileName = filterCategory === 'all' 
                        ? 'Inventario_Completo.xlsx' 
                        : `Inventario_${getCategoryName(filterCategory).replace(/\s+/g, '_')}.xlsx`;
                        
    saveAs(blob, fileName);
};
