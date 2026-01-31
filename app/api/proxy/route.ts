import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

async function handleGET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Build headers, forwarding auth headers if present
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'ChainScan/1.0',
    };

    // Forward API key header if present
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error?.message || error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

async function handlePOST(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const body = await request.text();

    // Build headers, forwarding auth headers if present
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'ChainScan/1.0',
    };

    // Only add Content-Type if there's a body
    if (body && body.trim() !== '') {
      headers['Content-Type'] = 'application/json';
    }

    // Forward API key header if present
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Make request with appropriate method
    const hasBody = body && body.trim() !== '';
    const response = await fetch(url, {
      method: hasBody ? 'POST' : 'GET',
      headers,
      ...(hasBody && { body }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error?.message || error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleGET(request);
}

export async function POST(request: NextRequest) {
  return handlePOST(request);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
    },
  });
}
