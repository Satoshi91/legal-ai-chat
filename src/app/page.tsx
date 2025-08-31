'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageList } from '@/components/MessageList';
import { MessageProps } from '@/components/Message';
import { ChatInput } from '@/components/ChatInput';
import { LegalChatRequest, LegalChatResponse, LegalChatError, ChatMessage, ContextDocument } from '@/types/legal-chat';

const STORAGE_KEY = 'legal-ai-chat-messages';

const getDefaultMessages = (): MessageProps[] => [
  {
    id: '1',
    content: 'こんにちは！私は法律AIです。条文に基づいた法律への質問回答を行います。どのようなご要件ですか？',
    role: 'assistant',
    timestamp: new Date()
  }
];

export default function Home() {
  const [messages, setMessages] = useState<MessageProps[]>(getDefaultMessages);
  
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  

  // ローカルストレージからメッセージを読み込み
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // timestampをDateオブジェクトに変換
        const messagesWithDates = parsedMessages.map((msg: MessageProps) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      }
    } catch (error) {
      console.error('Error loading messages from localStorage:', error);
    }
  }, []);

  // メッセージが変更されたらローカルストレージに保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }, [messages]);

  // 自動スクロール機能
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // メッセージが追加されたときに自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    console.log('Sending message:', content);
    
    setIsLoading(true);
    
    // ユーザーメッセージを追加
    const userMessage: MessageProps = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // 実際のAPI仕様に対応したリクエストボディを構築
      const chatMessages: ChatMessage[] = [...messages, userMessage]
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

      const requestBody: LegalChatRequest = {
        messages: chatMessages,
        max_context_docs: 10
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // JSONレスポンスを取得
      const responseData: LegalChatResponse | LegalChatError = await response.json();
      
      // エラーレスポンスのチェック
      if ('error' in responseData) {
        throw new Error(responseData.error);
      }
      
      // アシスタントメッセージを追加（実際のAPI仕様のai_responseフィールドを使用）
      const assistantMessage: MessageProps = {
        id: (Date.now() + 1).toString(),
        content: responseData.ai_response || 'エラーが発生しました。',
        role: 'assistant',
        timestamp: new Date(),
        contextDocuments: responseData.total_context_docs
      };

      // 参考文献メッセージを生成
      const referenceMessages: MessageProps[] = responseData.context_documents.map((doc: ContextDocument, index: number) => {
        const { LawID, LawTitle, ArticleTitle } = doc.metadata;
        const documentExcerpt = doc.document.length > 50 
          ? doc.document.substring(0, 50) + '...'
          : doc.document;
        
        return {
          id: `ref-${Date.now() + 2 + index}`,
          content: `${LawTitle} ${ArticleTitle} ${documentExcerpt}`,
          role: 'reference_url' as const,
          timestamp: new Date(),
          url: `https://laws.e-gov.go.jp/law/${LawID}`
        };
      });

      setMessages(prev => [...prev, assistantMessage, ...referenceMessages]);
      
      // レスポンス情報をコンソールに表示（デバッグ用）
      console.log('ユーザークエリ:', responseData.user_query);
      console.log('AI回答:', responseData.ai_response);
      console.log('参照文書数:', responseData.total_context_docs);
      console.log('コンテキスト文書:', responseData.context_documents);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // エラーメッセージを追加
      const errorMessage: MessageProps = {
        id: (Date.now() + 2).toString(),
        content: `エラーが発生しました。もう一度お試しください。${error instanceof Error ? `\nエラー詳細: ${error.message}` : ''}`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const clearMessage: MessageProps = {
      id: Date.now().toString(),
      content: '(チャット履歴をクリアしました)',
      role: 'system',
      timestamp: new Date()
    };
    
    const defaultMessage: MessageProps = {
      id: (Date.now() + 1).toString(),
      content: 'こんにちは！私は法律AIです。条文に基づいた法律への質問回答を行います。どのようなご要件ですか？',
      role: 'assistant',
      timestamp: new Date()
    };
    
    // クリアメッセージ → デフォルトメッセージの順番で表示
    const newMessages = [clearMessage, defaultMessage];
    setMessages(newMessages);
    
    // ローカルストレージにはデフォルトメッセージのみ保存
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(getDefaultMessages()));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white text-center">
          e-gov 法令検索 - RAG検索AIチャット
        </h1>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <MessageList messages={messages} isLoading={isLoading} />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={handleSendMessage} onClearHistory={handleClearHistory} disabled={isLoading} />
    </div>
  );
}
