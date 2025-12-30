import { PDFDocument } from 'pdf-lib';

export const mergePagesToPDF = async (pages, documentTitle) => {
  try {
    const pdfDoc = await PDFDocument.create();
    
    for (const page of pages) {
      if (page.fileData && page.fileData.startsWith('data:image/')) {
        // Convert base64 image to PDF page
        const imageBytes = await fetch(page.fileData).then(res => res.arrayBuffer());
        const image = await pdfDoc.embedPng(imageBytes);
        
        const pageObj = pdfDoc.addPage([image.width, image.height]);
        pageObj.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }
    }
    
    const pdfBytes = await pdfDoc.save();
    
    // Create blob and file
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], `${documentTitle}.pdf`, { type: 'application/pdf' });
    
    return {
      file,
      blob,
      pdfBytes
    };
  } catch (error) {
    console.error('Error merging PDF:', error);
    throw new Error('Failed to merge pages into PDF');
  }
};

export const downloadPDF = (pdfBytes, filename) => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};