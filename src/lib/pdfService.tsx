import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export async function generatePDF(htmlContent: string): Promise<Buffer> {
  // Load font as base64 to ensure it's available for Puppeteer
  let scriptFontBase64 = '';
  try {
    const fontPath = path.join(process.cwd(), 'public', 'font', 'Allura', 'Allura-Regular.ttf');
    const fontBuffer = fs.readFileSync(fontPath);
    scriptFontBase64 = fontBuffer.toString('base64');
  } catch (error) {
    console.error('Error loading font:', error);
  }

  // We wrap the user HTML with a layout that matches the old react-pdf styling.
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${scriptFontBase64 ? `
          @font-face {
            font-family: "Allura"; /* Re-mapping the name so existing HTML 'span' styles work */
            src: url("data:font/ttf;base64,${scriptFontBase64}") format("truetype");
          }
          ` : ''}
          body {
            background-color: #ffffff;
            font-size: 18px;
            font-family: Helvetica, Arial, sans-serif;
            line-height: 1.3;
            margin-bottom: -7px;
            margin: 20px;
            padding: 0;
          }
          div {
            padding-top: 20px;
            padding-right: 20px;
          }
          // img {
          //   height: 60px;
          // }
          // span {
          //   font-family: "Allura", cursive !important;
          //   font-weight: normal !important;
          //   font-style: normal !important;
          // }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Wait until dom is loaded
    await page.setContent(fullHtml, { waitUntil: 'load' });

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
}
