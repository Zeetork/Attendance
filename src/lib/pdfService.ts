import puppeteer from 'puppeteer';

export async function generatePDF(htmlContent: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  
  // Set content and wait for network idle to ensure fonts/images load
  await page.setContent(htmlContent, {
    waitUntil: 'networkidle0',
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
