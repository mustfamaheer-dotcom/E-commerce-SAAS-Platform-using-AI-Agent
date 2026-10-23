// apps/web/src/utils/exportExcel.ts
import * as XLSX from 'xlsx';

export function exportToExcel(
  data: Record<string, any>[],
  filename: string = 'report',
  sheetName: string = 'التقرير'
) {
  if (!data || data.length === 0) return;
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (err) {
    console.error('Excel export error:', err);
  }
}
