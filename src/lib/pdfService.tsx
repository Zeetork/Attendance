import { renderToBuffer, Document, Page, StyleSheet } from '@react-pdf/renderer';
import Html from 'react-pdf-html';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
  }
});

export async function generatePDF(htmlContent: string): Promise<Buffer> {
  // react-pdf/renderer throws if a font like 'Arial' is used but not registered.
  // It also does NOT support comma-separated fallback fonts (e.g. "Arial, sans-serif").
  // We replace the entire font-family declaration with just 'Helvetica'.
  const sanitizedHtml = htmlContent.replace(/font-family\s*:\s*[^;>"']+/gi, 'font-family: Helvetica');

  const pdfBuffer = await renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <Html
          style={{
            fontSize: 16,
            fontFamily: 'Helvetica',
            lineHeight: 1.3,
            marginBottom: -7
          }}>{sanitizedHtml}</Html>
      </Page>
    </Document>
  );
  return pdfBuffer;
}
