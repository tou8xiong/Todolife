import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { title, pages } = await req.json();

    if (!title || !pages || !Array.isArray(pages)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Create HTML content with all pages
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: Georgia, 'Times New Roman', serif;
              font-size: 16px;
              line-height: 1.6;
              color: #000;
              margin: 0;
              padding: 0;
            }
            .page {
              page-break-after: always;
              padding: 20px;
            }
            .page:last-child {
              page-break-after: auto;
            }
            .title {
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .metadata {
              text-align: center;
              font-size: 14px;
              color: #666;
              margin-bottom: 30px;
            }
            h1 { font-size: 32px; font-weight: bold; margin: 24px 0 16px; }
            h2 { font-size: 24px; font-weight: bold; margin: 20px 0 12px; }
            h3 { font-size: 20px; font-weight: bold; margin: 16px 0 8px; }
            p { margin: 0 0 0.5em 0; }
            ul, ol { padding-left: 1.5em; margin: 1em 0; }
            li { margin: 0.25em 0; }
            img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
            a { color: #0ea5e9; text-decoration: underline; }
            strong { font-weight: bold; }
            em { font-style: italic; }
            u { text-decoration: underline; }
            s { text-decoration: line-through; }
          </style>
        </head>
        <body>
          ${pages.map((pageContent: string, index: number) => `
            <div class="page">
              ${index === 0 ? `<div class="title">${title}</div>` : ''}
              ${pageContent}
            </div>
          `).join('')}
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    await browser.close();

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title || 'document'}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("[POST /api/export-pdf]", err?.message ?? err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
