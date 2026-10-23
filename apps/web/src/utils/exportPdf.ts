// apps/web/src/utils/exportPdf.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportElementAsPdf(elementId: string, filename: string = 'dashboard-report') {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 277;
    const pageHeight = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, Math.min(imgHeight, pageHeight));
    pdf.save(`${filename}.pdf`);
  } catch (err) {
    console.error('PDF export error:', err);
  }
}
