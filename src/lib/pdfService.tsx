import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export async function generatePDF(htmlContent: string): Promise<Buffer> {
  // Load font as base64 to ensure it's available for Puppeteer without relying on absolute web URLs
  let alluraFontBase64 = '';
  try {
    const fontPath = path.join(process.cwd(), 'public', 'font', 'Allura', 'Allura-Regular.ttf');
    const fontBuffer = fs.readFileSync(fontPath);
    alluraFontBase64 = fontBuffer.toString('base64');
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
          ${alluraFontBase64 ? `
          @font-face {
            font-family: "Allura";
            src: url("data:font/ttf;base64,${alluraFontBase64}") format("truetype");
          }
          ` : ''}
          body {
            background-color: #ffffff;
            font-size: 16px;
            font-family: Helvetica, Arial, sans-serif;
            line-height: 1.3;
            margin-bottom: -7px;
            margin: 0;
            padding: 0;
          }
          // div {
          //   padding-top: 20px;
          //   padding-right: 20px;
          // }
          // img {
          //   height: 100px;
          //   width: 100px;
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
    
    // Wait until network is idle so fonts have time to load
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

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
