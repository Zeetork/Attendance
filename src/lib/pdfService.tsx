import { chromium as playwright } from "playwright-core";
import chromium from "@sparticuz/chromium";
import path from "path";
import fs from "fs";

export async function generatePDF(htmlContent: string): Promise<Buffer> {
  // Load custom font
  let alluraFontBase64 = "";

  try {
    const fontPath = path.join(
      process.cwd(),
      "public",
      "font",
      "Allura",
      "Allura-Regular.ttf"
    );

    const fontBuffer = fs.readFileSync(fontPath);
    alluraFontBase64 = fontBuffer.toString("base64");
  } catch (error) {
    console.error("Error loading font:", error);
  }

  // HTML template
  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          ${
            alluraFontBase64
              ? `
          @font-face {
            font-family: "Allura";
            src: url("data:font/ttf;base64,${alluraFontBase64}") format("truetype");
            font-weight: normal;
            font-style: normal;
          }
          `
              : ""
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            font-family: Helvetica, Arial, sans-serif;
            font-size: 20px;
            line-height: 1.3;
          }
        </style>
      </head>

      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  // Launch Chromium
  const browser = await playwright.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setContent(fullHtml, {
      waitUntil: "networkidle",
    });

    // Wait until fonts are loaded
    await page.evaluate(async () => {
      // @ts-ignore
      if (document.fonts) {
        // @ts-ignore
        await document.fonts.ready;
      }
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}