import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, request }) => {
  // Try multiple ways to get the URL parameter
  let targetUrl = url.searchParams.get('url');
  
  // Fallback to parsing from request URL if url.searchParams doesn't work
  if (!targetUrl) {
    const requestUrl = new URL(request.url);
    targetUrl = requestUrl.searchParams.get('url');
  }

  // Debug logging for production
  console.log('Request URL:', request.url);
  console.log('Target URL:', targetUrl);
  console.log('API Key available:', !!import.meta.env.SCREENSHOT_MACHINE_API_KEY);

  if (!targetUrl) {
    console.error('Missing url parameter from:', request.url);
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    // Validate the URL
    new URL(targetUrl);

    const apiKey = import.meta.env.SCREENSHOT_MACHINE_API_KEY;
    if (!apiKey) {
      console.error('Screenshot API key not configured');
      return new Response('Screenshot API key not configured', { status: 500 });
    }

    const screenshotUrl = `https://api.screenshotmachine.com/?key=${apiKey}&url=${encodeURIComponent(targetUrl)}&device=desktop&dimension=1024x768&format=png`;
    console.log('Calling Screenshot API:', screenshotUrl.replace(apiKey, '***'));

    // Fetch the screenshot with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(screenshotUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Screenshot-API/1.0)',
        },
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      const errorMsg = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
      return new Response(`Screenshot service unavailable: ${errorMsg}`, { status: 503 });
    }
      
    console.log('Screenshot API response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Get response text to see actual error
      const errorText = await response.text();
      console.error('Screenshot API error response:', errorText);
      
      // Check for specific Screenshot Machine errors
      const errorHeader = response.headers.get('X-Screenshotmachine-Response');
      if (errorHeader) {
        console.error('Screenshot service error:', errorHeader);
        return new Response(`Screenshot service error: ${errorHeader}`, { status: 400 });
      }
      console.error('Failed to generate screenshot, status:', response.status);
      return new Response(`Failed to generate screenshot: ${errorText}`, { status: 500 });
    }

    console.log('Screenshot generated successfully');
    
    // Return the image with appropriate headers
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Screenshot generation error:', error);
    return new Response('Invalid URL or screenshot generation failed', { status: 400 });
  }
};