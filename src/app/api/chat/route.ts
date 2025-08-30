
export async function POST(req: Request) {
  try {
    console.log('POST /api/chat - Request received');
    
    // リクエストボディの解析
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    // AI SDK 5.0の新しいリクエスト形式に対応
    const messages = body.messages || [];
    
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // OpenRouter API キーチェック
    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    
    if (!apiKey) {
      console.error('OpenRouter API key not found');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Calling OpenRouter directly...');
    
    // AI SDKを使わずに直接OpenRouterを呼び出し
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
            content: `あなたは法務AI アシスタントです。日本の法律に関する質問に正確で分かりやすく回答してください。以下の点に注意してください：

1. 正確な法的情報を提供する
2. 複雑な内容も分かりやすく説明する
3. 必要に応じて具体例を示す
4. 不明確な場合は専門家への相談を推奨する
5. 常に丁寧で親しみやすい口調で回答する

回答は日本語で行ってください。`
          },
          ...messages,
        ],
        temperature: 0.3,
        max_tokens: 2000,
        stream: true
      })
    });

    console.log('OpenRouter response status:', openrouterResponse.status);

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${openrouterResponse.status} - ${errorText}`);
    }

    if (!openrouterResponse.body) {
      throw new Error('No response body from OpenRouter');
    }

    // OpenRouterのストリームをそのまま返す
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting OpenRouter stream processing...');
          const reader = openrouterResponse.body!.getReader();
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('OpenRouter stream completed');
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            console.log('OpenRouter chunk received:', chunk.substring(0, 100) + '...');
            
            // Server-Sent Events形式のパース
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  console.log('OpenRouter stream [DONE]');
                  controller.close();
                  return;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                    const content = parsed.choices[0].delta.content;
                    console.log('Streaming content:', content);
                    controller.enqueue(encoder.encode(content));
                  }
                } catch {
                  // JSONパースエラーは無視（空行など）
                }
              }
            }
          }
        } catch (streamError) {
          console.error('Stream processing error:', streamError);
          controller.error(streamError);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Chat API Error - Full details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown',
      error: error
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}