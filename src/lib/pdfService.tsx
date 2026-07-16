import React from 'react';
import { renderToBuffer, Document, Page, StyleSheet } from '@react-pdf/renderer';
import Html from 'react-pdf-html';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    fontSize: 12,
  }
});

export async function generatePDF(htmlContent: string): Promise<Buffer> {
  // react-pdf/renderer throws if a font like 'Arial' is used but not registered.
  // We replace common unregistered fonts with built-in PDF fonts.
  const sanitizedHtml = htmlContent
    .replace(/Arial/gi, 'Helvetica')
    .replace(/Times New Roman/gi, 'Times-Roman')
    .replace(/Courier New/gi, 'Courier')
    .replace(/sans-serif/gi, 'Helvetica')
    .replace(/serif/gi, 'Times-Roman');

  const pdfBuffer = await renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <Html>{sanitizedHtml}</Html>
      </Page>
    </Document>
  );
  return pdfBuffer;
}
