import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function generatePDF(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: (chromium as any).defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: (chromium as any).headless,
  });

  const page = await browser.newPage();
  
  // Set content and wait for network idle to ensure fonts/images load
  await page.setContent(htmlContent, {
    waitUntil: 'domcontentloaded',
  });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '20mm',
      right: '20mm',
    },
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
}
