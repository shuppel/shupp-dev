import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url).searchParams.get('url');

  if (!url) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    // Validate the URL
    new URL(url);

    const apiKey = import.meta.env.SCREENSHOT_MACHINE_API_KEY;
    if (!apiKey) {
      return new Response('Screenshot API key not configured', { status: 500 });
    }

    const screenshotUrl = `https://api.screenshotmachine.com?key=${apiKey}&url=${encodeURIComponent(url)}&dimension=800x600`;

    // Fetch the screenshot
    const response = await fetch(screenshotUrl);

    if (!response.ok) {
      return new Response('Failed to generate screenshot', { status: 500 });
    }

    // Return the image with appropriate headers
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Screenshot generation error:', error);
    return new Response('Invalid URL or screenshot generation failed', { status: 400 });
  }
};