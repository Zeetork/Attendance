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
  const pdfBuffer = await renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <Html>{htmlContent}</Html>
      </Page>
    </Document>
  );
  return pdfBuffer;
}
