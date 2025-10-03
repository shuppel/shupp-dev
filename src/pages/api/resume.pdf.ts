import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  // For now, we'll redirect to the HTML resume with a print suggestion
  // In production, you'd use a library like Puppeteer or Playwright to generate a PDF
  
  // Get the base URL from the request
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  // Redirect to the resume page with a print parameter
  return new Response(null, {
    status: 302,
    headers: {
      'Location': `${baseUrl}/resume?print=true`,
      'Cache-Control': 'no-cache'
    }
  });
};

// Alternative implementation with actual PDF generation (requires additional packages):
/*
import puppeteer from 'puppeteer';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  // Launch headless browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Navigate to resume page
  await page.goto(`${baseUrl}/resume`, {
    waitUntil: 'networkidle2'
  });
  
  // Generate PDF
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  });
  
  await browser.close();
  
  // Return PDF
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="erikk-shupp-resume.pdf"',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
*/