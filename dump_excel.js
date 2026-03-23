import XLSX from 'xlsx';
import fs from 'fs';

const wb = XLSX.readFile('Inventario Herramientas Electricas.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];

const data = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});
const result = [];
data.slice(0, 40).forEach((row, i) => {
    const nonEmpty = row.map((c, j) => c ? `[${j}]: ${c}` : null).filter(Boolean);
    if (nonEmpty.length > 0) {
        result.push(`Row ${i}: ${nonEmpty.join(' | ')}`);
    }
});
fs.writeFileSync('excel_structure.json', JSON.stringify({
    sheetName: wb.SheetNames[0],
    range: ws['!ref'],
    merges: ws['!merges'],
    firstRows: result
}, null, 2));
console.log('Saved to excel_structure.json');
