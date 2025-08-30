import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('OpenRouter direct test started');
    
    const { message } = await req.json();
    const debugInfo: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      step: 'start'
    };

    // 環境変数チェック
    const apiKey = process.env.OPENROUTER_API_KEY;
    debugInfo.apiKeyStatus = {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey?.substring(0, 10) + '...' || 'Not found'
    };
    
    if (!apiKey) {
      console.log('No API key found');
      return NextResponse.json({
        success: false,
        error: 'API key not found',
        debugInfo
      }, { status: 400 });
    }

    debugInfo.step = 'making_request';

    // OpenRouter APIに直接リクエスト
    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'Legal AI Chat'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'あなたは法務AIアシスタントです。日本語で回答してください。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
        stream: false // ストリーミングしない
      })
    });

    debugInfo.step = 'received_response';
    debugInfo.openrouterResponse = {
      status: openrouterResponse.status,
      statusText: openrouterResponse.statusText,
      headers: Object.fromEntries(openrouterResponse.headers.entries()),
      ok: openrouterResponse.ok
    };

    console.log('OpenRouter response status:', openrouterResponse.status);
    console.log('OpenRouter response headers:', Object.fromEntries(openrouterResponse.headers.entries()));

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.log('OpenRouter error:', errorText);
      
      debugInfo.step = 'error';
      debugInfo.error = {
        status: openrouterResponse.status,
        statusText: openrouterResponse.statusText,
        body: errorText
      };

      return NextResponse.json({
        success: false,
        error: `OpenRouter API error: ${openrouterResponse.status}`,
        errorDetails: errorText,
        debugInfo
      }, { status: openrouterResponse.status });
    }

    const responseData = await openrouterResponse.json();
    console.log('OpenRouter response data:', JSON.stringify(responseData, null, 2));

    debugInfo.step = 'success';
    debugInfo.responseData = responseData;

    return NextResponse.json({
      success: true,
      message: 'OpenRouter API test successful',
      openrouterResponse: responseData,
      debugInfo
    });

  } catch (error) {
    console.error('OpenRouter direct test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}