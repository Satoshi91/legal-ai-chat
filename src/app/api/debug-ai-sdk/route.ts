import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // AI SDKの詳細情報を取得
    const debugInfo: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    };

    // AI SDK関連のインポートをチェック
    try {
      const aiModule = await import('ai');
      debugInfo.aiSDK = {
        available: true,
        exports: Object.keys(aiModule),
        streamTextAvailable: typeof aiModule.streamText === 'function',
      };
    } catch (error) {
      debugInfo.aiSDK = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // streamText関数の詳細チェック
    try {
      const { streamText } = await import('ai');
      const { createOpenAI } = await import('@ai-sdk/openai');
      
      const openrouter = createOpenAI({
        apiKey: process.env.OPENROUTER_API_KEY || 'dummy-key',
        baseURL: 'https://openrouter.ai/api/v1',
      });

      // streamTextを実際に呼び出してみる（ダミーデータで）
      const result = streamText({
        model: openrouter('anthropic/claude-3.5-sonnet'),
        messages: [{ role: 'user', content: 'test' }],
        temperature: 0.3,
      });

      debugInfo.streamTextTest = {
        resultType: typeof result,
        resultConstructor: result.constructor.name,
        availableMethods: Object.getOwnPropertyNames(Object.getPrototypeOf(result)),
        resultKeys: Object.keys(result),
        hasResponse: 'response' in result && typeof result.response === 'function',
        hasToDataStreamResponse: 'toDataStreamResponse' in result,
        hasToTextStream: 'toTextStream' in result,
        hasToAIStream: 'toAIStream' in result,
      };

    } catch (error) {
      debugInfo.streamTextTest = {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
      };
    }

    // 環境変数チェック
    debugInfo.environment = {
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
      keyLength: process.env.OPENROUTER_API_KEY?.length || 0,
      nodeVersion: process.version,
    };

    // パッケージバージョン情報
    try {
      const packageJson = await import('../../../../package.json');
      debugInfo.packages = {
        ai: packageJson.dependencies?.ai || 'Not found',
        '@ai-sdk/openai': packageJson.dependencies?.['@ai-sdk/openai'] || 'Not found',
        '@ai-sdk/react': packageJson.dependencies?.['@ai-sdk/react'] || 'Not found',
      };
    } catch {
      debugInfo.packages = {
        error: 'Could not read package.json',
      };
    }

    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json({
      error: 'Debug API failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
    }, { status: 500 });
  }
}