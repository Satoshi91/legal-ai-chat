'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

export default function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useChatフックのテスト
  const debugChatHook = useChat({
    api: '/api/chat',
  });

  const [chatDebugInfo, setChatDebugInfo] = useState<any>(null);
  const [messageFlowDebug, setMessageFlowDebug] = useState<any>(null);
  const [openrouterTestResult, setOpenrouterTestResult] = useState<any>(null);

  const testApiEndpoint = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing API endpoint...');
      
      const testMessage = {
        messages: [
          {
            role: 'user',
            content: 'テストメッセージです'
          }
        ]
      };

      console.log('Sending request:', testMessage);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // ストリーミングレスポンスの場合
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          fullResponse += chunk;
          console.log('Received chunk:', chunk);
        }

        setResult({
          success: true,
          type: 'stream',
          data: fullResponse,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        });
      } else {
        const data = await response.json();
        console.log('Response data:', data);
        
        setResult({
          success: true,
          type: 'json',
          data,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        });
      }

    } catch (err) {
      console.error('API test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkEnvironment = () => {
    const envCheck = {
      hasOpenRouterKey: !!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || 'キーは環境変数で確認',
      nodeVersion: typeof window !== 'undefined' ? 'ブラウザ環境' : process.version,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'サーバー環境'
    };
    
    setResult({
      success: true,
      type: 'environment',
      data: envCheck
    });
  };

  const checkAISDK = async () => {
    try {
      const response = await fetch('/api/debug-ai-sdk');
      const data = await response.json();
      
      setResult({
        success: response.ok,
        type: 'ai-sdk-check',
        data,
        status: response.status
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const testUseChatHook = async () => {
    try {
      console.log('Testing useChat hook...');
      
      // useChatフックの現在の状態を記録
      const hookState = {
        id: debugChatHook.id,
        messages: debugChatHook.messages,
        messagesLength: debugChatHook.messages.length,
        status: debugChatHook.status,
        error: debugChatHook.error,
        availableMethods: Object.keys(debugChatHook),
        sendMessageType: typeof debugChatHook.sendMessage,
      };

      console.log('useChat hook state:', hookState);

      // テストメッセージを送信
      console.log('Sending test message...');
      await debugChatHook.sendMessage({
        role: 'user',
        content: 'デバッグテストメッセージです',
      });

      // 送信後の状態を記録
      setTimeout(() => {
        const postSendState = {
          id: debugChatHook.id,
          messages: debugChatHook.messages,
          messagesLength: debugChatHook.messages.length,
          status: debugChatHook.status,
          error: debugChatHook.error,
        };

        setChatDebugInfo({
          beforeSend: hookState,
          afterSend: postSendState,
          timestamp: new Date().toISOString(),
        });

        console.log('Post-send hook state:', postSendState);
      }, 2000);

    } catch (error) {
      console.error('useChat test error:', error);
      setError(`useChat test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const inspectUseChatState = () => {
    const currentState = {
      id: debugChatHook.id,
      messages: debugChatHook.messages,
      messagesLength: debugChatHook.messages.length,
      status: debugChatHook.status,
      error: debugChatHook.error,
      availableMethods: Object.keys(debugChatHook),
      sendMessageType: typeof debugChatHook.sendMessage,
      messagesDetailed: debugChatHook.messages.map((msg, index) => ({
        index,
        id: msg.id,
        role: msg.role,
        content: msg.content,
        contentLength: msg.content?.length || 0,
      })),
      timestamp: new Date().toISOString(),
    };

    setChatDebugInfo(currentState);
    console.log('Current useChat state:', currentState);
  };

  const traceMessageFlow = async () => {
    setLoading(true);
    setError(null);
    setMessageFlowDebug(null);

    const debugLog: any[] = [];
    const startTime = Date.now();

    try {
      debugLog.push({
        step: 1,
        action: 'Starting message flow test',
        timestamp: new Date().toISOString(),
        elapsed: 0
      });

      // Step 1: 準備
      const testMessage = 'フローテスト用のメッセージです';
      debugLog.push({
        step: 2,
        action: 'Preparing test message',
        data: { testMessage },
        timestamp: new Date().toISOString(),
        elapsed: Date.now() - startTime
      });

      // Step 2: リクエスト送信前の確認
      const requestPayload = {
        messages: [
          { role: 'user', content: testMessage }
        ]
      };

      debugLog.push({
        step: 3,
        action: 'Preparing API request',
        data: requestPayload,
        timestamp: new Date().toISOString(),
        elapsed: Date.now() - startTime
      });

      // Step 3: フェッチリクエストの送信
      console.log('Sending request to /api/chat...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      debugLog.push({
        step: 4,
        action: 'Received response',
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          ok: response.ok
        },
        timestamp: new Date().toISOString(),
        elapsed: Date.now() - startTime
      });

      if (!response.ok) {
        const errorText = await response.text();
        debugLog.push({
          step: 5,
          action: 'Response error',
          error: `HTTP ${response.status}: ${errorText}`,
          timestamp: new Date().toISOString(),
          elapsed: Date.now() - startTime
        });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Step 4: レスポンスボディの確認
      if (!response.body) {
        debugLog.push({
          step: 5,
          action: 'No response body',
          error: 'Response body is null',
          timestamp: new Date().toISOString(),
          elapsed: Date.now() - startTime
        });
        throw new Error('No response body');
      }

      debugLog.push({
        step: 5,
        action: 'Response body available',
        data: { hasBody: !!response.body },
        timestamp: new Date().toISOString(),
        elapsed: Date.now() - startTime
      });

      // Step 5: ストリームリーダーの取得
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      debugLog.push({
        step: 6,
        action: 'Stream reader obtained',
        timestamp: new Date().toISOString(),
        elapsed: Date.now() - startTime
      });

      let fullResponse = '';
      let chunkCount = 0;

      // Step 6: ストリームの読み取り
      let hasReceivedData = false;
      
      while (true) {
        const readResult = await reader.read();
        const { done, value } = readResult;
        
        debugLog.push({
          step: `6.${chunkCount + 1}`,
          action: `Read attempt ${chunkCount + 1}`,
          data: {
            done,
            valueExists: !!value,
            valueLength: value?.length || 0,
            hasReceivedData
          },
          timestamp: new Date().toISOString(),
          elapsed: Date.now() - startTime
        });
        
        if (done) {
          debugLog.push({
            step: 7,
            action: 'Stream reading completed',
            data: {
              totalChunks: chunkCount,
              fullResponseLength: fullResponse.length,
              fullResponse: fullResponse.substring(0, 500), // 最初の500文字のみ
              hasReceivedData
            },
            timestamp: new Date().toISOString(),
            elapsed: Date.now() - startTime
          });
          break;
        }

        if (value) {
          hasReceivedData = true;
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          chunkCount++;

          if (chunkCount <= 5) { // 最初の5チャンクをログに記録
            debugLog.push({
              step: `6.${chunkCount}`,
              action: `Received chunk ${chunkCount}`,
              data: {
                chunkSize: value.length,
                chunkContent: chunk.substring(0, 200), // 最初の200文字のみ
                chunkRaw: Array.from(value.slice(0, 50)).map(b => String.fromCharCode(b)).join(''), // バイト表現
                totalLengthSoFar: fullResponse.length
              },
              timestamp: new Date().toISOString(),
              elapsed: Date.now() - startTime
            });
          }
        }
      }

      debugLog.push({
        step: 8,
        action: 'Message flow test completed successfully',
        data: {
          totalTime: Date.now() - startTime,
          responseLength: fullResponse.length,
          chunkCount
        },
        timestamp: new Date().toISOString(),
        elapsed: Date.now() - startTime
      });

      setMessageFlowDebug({
        success: true,
        debugLog,
        fullResponse: fullResponse.substring(0, 1000), // 最初の1000文字
        totalTime: Date.now() - startTime
      });

    } catch (error) {
      debugLog.push({
        step: 'ERROR',
        action: 'Message flow test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        timestamp: new Date().toISOString(),
        elapsed: Date.now() - startTime
      });

      console.error('Message flow error:', error);
      setError(`Message flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageFlowDebug({
        success: false,
        debugLog,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testOpenRouterDirect = async () => {
    setLoading(true);
    setError(null);
    setOpenrouterTestResult(null);

    const debugLog: any[] = [];
    const startTime = Date.now();

    try {
      debugLog.push({
        step: 1,
        action: 'Starting OpenRouter direct test',
        timestamp: new Date().toISOString(),
        elapsed: 0
      });

      // OpenRouter APIキーを取得
      const response = await fetch('/api/debug-openrouter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'OpenRouter接続テストメッセージです'
        })
      });

      debugLog.push({
        step: 2,
        action: 'Received response from debug endpoint',
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        },
        timestamp: new Date().toISOString(),
        elapsed: Date.now() - startTime
      });

      const data = await response.json();

      debugLog.push({
        step: 3,
        action: 'Parsed response data',
        data: data,
        timestamp: new Date().toISOString(),
        elapsed: Date.now() - startTime
      });

      setOpenrouterTestResult({
        success: response.ok,
        debugLog,
        responseData: data,
        totalTime: Date.now() - startTime
      });

    } catch (error) {
      debugLog.push({
        step: 'ERROR',
        action: 'OpenRouter test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        elapsed: Date.now() - startTime
      });

      console.error('OpenRouter test error:', error);
      setError(`OpenRouter test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setOpenrouterTestResult({
        success: false,
        debugLog,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          デバッグページ
        </h1>

        <div className="space-y-4 mb-8">
          <button
            onClick={testApiEndpoint}
            disabled={loading}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium"
          >
            {loading ? 'テスト中...' : 'API エンドポイントテスト'}
          </button>

          <button
            onClick={checkEnvironment}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium ml-4"
          >
            環境チェック
          </button>

          <button
            onClick={checkAISDK}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium ml-4"
          >
            AI SDK チェック
          </button>

          <button
            onClick={testUseChatHook}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium ml-4"
          >
            useChat フックテスト
          </button>

          <button
            onClick={inspectUseChatState}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium ml-4"
          >
            useChat 状態確認
          </button>

          <button
            onClick={traceMessageFlow}
            disabled={loading}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-medium ml-4"
          >
            {loading ? 'フロー分析中...' : 'メッセージフロー分析'}
          </button>

          <button
            onClick={testOpenRouterDirect}
            disabled={loading}
            className="px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white rounded-lg font-medium ml-4"
          >
            {loading ? 'テスト中...' : 'OpenRouter 直接テスト'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-8">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              エラー
            </h2>
            <pre className="text-red-700 dark:text-red-300 whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        )}

        {result && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              結果
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {chatDebugInfo && (
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">
              useChat デバッグ情報
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-auto max-h-96">
                {JSON.stringify(chatDebugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {messageFlowDebug && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100 mb-4">
              メッセージフロー分析結果
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-semibold mb-2">概要</h3>
                <p className={`text-sm ${messageFlowDebug.success ? 'text-green-600' : 'text-red-600'}`}>
                  ステータス: {messageFlowDebug.success ? '成功' : '失敗'}
                </p>
                {messageFlowDebug.totalTime && (
                  <p className="text-sm text-gray-600">
                    総実行時間: {messageFlowDebug.totalTime}ms
                  </p>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-semibold mb-2">ステップ別ログ</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {messageFlowDebug.debugLog?.map((log: any, index: number) => (
                    <div key={index} className={`p-2 rounded text-xs ${
                      log.error ? 'bg-red-100 text-red-800' : 'bg-white text-gray-700'
                    }`}>
                      <div className="font-mono">
                        Step {log.step}: {log.action} ({log.elapsed}ms)
                      </div>
                      {log.error && <div className="text-red-600 mt-1">{log.error}</div>}
                      {log.data && (
                        <div className="mt-1 text-gray-600">
                          {JSON.stringify(log.data, null, 1)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {messageFlowDebug.fullResponse && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">レスポンス内容（最初の1000文字）</h3>
                  <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-auto max-h-32">
                    {messageFlowDebug.fullResponse}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {openrouterTestResult && (
          <div className="bg-pink-50 dark:bg-pink-900 border border-pink-200 dark:border-pink-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-pink-900 dark:text-pink-100 mb-4">
              OpenRouter 直接テスト結果
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-semibold mb-2">概要</h3>
                <p className={`text-sm ${openrouterTestResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  ステータス: {openrouterTestResult.success ? '成功' : '失敗'}
                </p>
                {openrouterTestResult.totalTime && (
                  <p className="text-sm text-gray-600">
                    総実行時間: {openrouterTestResult.totalTime}ms
                  </p>
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="font-semibold mb-2">ステップ別ログ</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {openrouterTestResult.debugLog?.map((log: any, index: number) => (
                    <div key={index} className={`p-2 rounded text-xs ${
                      log.error ? 'bg-red-100 text-red-800' : 'bg-white text-gray-700'
                    }`}>
                      <div className="font-mono">
                        Step {log.step}: {log.action} ({log.elapsed}ms)
                      </div>
                      {log.error && <div className="text-red-600 mt-1">{log.error}</div>}
                      {log.data && (
                        <div className="mt-1 text-gray-600">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {openrouterTestResult.responseData && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">OpenRouter レスポンス</h3>
                  <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-auto max-h-64">
                    {JSON.stringify(openrouterTestResult.responseData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            APIテスト結果
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            上記のボタンでAPIエンドポイントの動作を確認できます。
          </p>
        </div>
      </div>
    </div>
  );
}