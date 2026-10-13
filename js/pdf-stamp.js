// ============================================
// PDF STAMP — menambahkan catatan kehadiran wajib
// ke SETIAP halaman kartu PDF sebelum dilihat/diunduh.
// Diproses di browser (client-side) memakai pdf-lib,
// sehingga file asli di Drive tidak pernah diubah oleh admin.
// ============================================

async function stampPdfWithNotice(base64, noticeText) {
  const { PDFDocument, rgb, StandardFonts } = PDFLib;

  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const pdfDoc = await PDFDocument.load(bytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  pages.forEach(page => {
    const { width } = page.getSize();
    const fontSize = Math.max(7, Math.min(10, width / 45));
    const textWidth = font.widthOfTextAtSize(noticeText, fontSize);
    const barHeight = fontSize + 10;

    // Pita catatan di bagian bawah halaman — latar biru tua, teks putih
    page.drawRectangle({ x: 0, y: 0, width, height: barHeight, color: rgb(0 / 255, 23 / 255, 92 / 255) });
    page.drawText(noticeText, {
      x: Math.max(6, (width - textWidth) / 2),
      y: barHeight / 2 - fontSize / 2.6,
      size: fontSize,
      font,
      color: rgb(1, 1, 1)
    });
  });

  const stampedBytes = await pdfDoc.save();
  return new Blob([stampedBytes], { type: 'application/pdf' });
}
