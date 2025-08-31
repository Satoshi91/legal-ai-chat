import { LegalChatRequest, LegalChatResponse, LegalChatError } from '@/types/legal-chat';

function getBackendUrl(): string {
  // ローカル開発環境かどうかを判定
  if (process.env.NODE_ENV === 'development') {
    return process.env.LOCAL_BACKEND_URL || 'http://localhost:8000';
  }
  // 本番環境（Vercel）
  return process.env.BACKEND_URL || 'https://legal-ai-rag-production.up.railway.app';
}

export async function POST(req: Request) {
  try {
    console.log('POST /api/chat - Request received');
    
    // リクエストボディの解析
    const body: Partial<LegalChatRequest> = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const messages = body.messages || [];
    
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      const errorResponse: LegalChatError = { error: 'Invalid messages format' };
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // バックエンドURLを環境に応じて決定
    const backendUrl = getBackendUrl();
    console.log('Backend URL:', backendUrl);
    console.log('Environment:', process.env.NODE_ENV);

    console.log('Calling FastAPI backend...');
    
    // 実際のAPI仕様に対応したリクエストボディを構築
    const requestBody: LegalChatRequest = {
      messages,
      max_context_docs: body.max_context_docs || 10
    };
    
    // FastAPIバックエンドを呼び出し（実際のエンドポイント）
    const backendResponse = await fetch(`${backendUrl}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('Backend API error:', errorText);
      throw new Error(`Backend API error: ${backendResponse.status} - ${errorText}`);
    }

    // JSONレスポンスを取得
    const responseData: LegalChatResponse = await backendResponse.json();
    console.log('Backend response received');

    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Chat API Error - Full details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown',
      error: error
    });
    
    const errorResponse: LegalChatError = {
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}