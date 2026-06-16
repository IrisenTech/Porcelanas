import { jsPDF } from 'jspdf';
import { CatalogItem } from '../types';
import { canvasCompress } from './imageUtils';

const CATEGORY_LABELS: Record<string, string> = {
  porcelanas: 'Porcelana',
  cristaleria: 'Cristalería',
};

interface PDFOptions {
  recipientEmail: string;
  selectedItems: CatalogItem[];
}

export async function generateOrderPDF({ selectedItems }: PDFOptions): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const cols = 3;
  const cellW = (pageW - margin * 2) / cols;
  const cellH = 70;
  const thumbH = 48;

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(13, 13, 13);
  doc.rect(0, 0, pageW, 22, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(201, 168, 76); // gold
  doc.text('PORCELANAS', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 170, 150);
  const dateStr = new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  doc.text(`Pedido generado: ${dateStr}`, pageW - margin, 14, { align: 'right' });
  doc.text(`${selectedItems.length} ítem(s) seleccionado(s)`, pageW - margin, 19, { align: 'right' });

  // ── Grid ──────────────────────────────────────────────────────────────────
  let x = margin;
  let y = 28;
  let col = 0;

  for (let i = 0; i < selectedItems.length; i++) {
    const item = selectedItems[i];

    // New page check
    if (y + cellH > pageH - margin) {
      doc.addPage();
      y = margin;
      col = 0;
      x = margin;
    }

    // Card background
    doc.setFillColor(245, 240, 232, 0.08);
    doc.setDrawColor(201, 168, 76);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cellW - 2, cellH, 2, 2, 'FD');

    // Thumbnail
    const primaryImg = item.images[0];
    if (primaryImg?.dataUrl) {
      try {
        const thumb = await canvasCompress(primaryImg.dataUrl, 160, 0.55, primaryImg.rotation ?? 0);
        const imgProps = doc.getImageProperties(thumb);
        const ratio = imgProps.width / imgProps.height;
        const tW = cellW - 10;
        const tH = Math.min(tW / ratio, thumbH);
        const tX = x + (cellW - 2 - tW) / 2;
        doc.addImage(thumb, 'JPEG', tX, y + 2, tW, tH);
      } catch {
        // skip image on error
      }
    }

    // Item number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(13, 13, 13);
    doc.text(`#${item.itemNumber}`, x + 3, y + thumbH + 7);

    // Category badge
    const catLabel = CATEGORY_LABELS[item.category] ?? item.category;
    const badgeColor = item.category === 'porcelanas' ? [26, 42, 108] : [13, 79, 79];
    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(x + cellW - 32, y + thumbH + 3, 28, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(245, 240, 232);
    doc.text(catLabel, x + cellW - 18, y + thumbH + 6.7, { align: 'center' });

    // Notes
    if (item.notes) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      const notes = doc.splitTextToSize(item.notes, cellW - 8);
      doc.text(notes.slice(0, 2), x + 3, y + thumbH + 13);
    }

    // Advance grid position
    col++;
    if (col >= cols) {
      col = 0;
      x = margin;
      y += cellH + 4;
    } else {
      x += cellW;
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Porcelanas — Catálogo exclusivo`, margin, pageH - 6);
    doc.text(`${p} / ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' });
  }

  return doc.output('blob');
}

export function downloadPDF(blob: Blob, filename = 'pedido-porcelanas.pdf'): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
