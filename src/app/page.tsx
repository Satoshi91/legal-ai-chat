'use client';

import { useState, useEffect } from 'react';
import { MessageList } from '@/components/MessageList';
import { MessageProps } from '@/components/Message';
import { ChatInput } from '@/components/ChatInput';

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // アシスタントメッセージの準備
      const assistantMessage: MessageProps = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        timestamp: new Date()
      };

      // ストリーミング読み取り
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        // ストリームからテキストを抽出
        assistantMessage.content += chunk;
        
        // リアルタイムでメッセージを更新
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.id === assistantMessage.id) {
            // 既存のアシスタントメッセージを更新
            newMessages[newMessages.length - 1] = { ...assistantMessage };
          } else {
            // 新しいアシスタントメッセージを追加
            newMessages.push({ ...assistantMessage });
          }
          
          return newMessages;
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // エラーメッセージを追加
      const errorMessage: MessageProps = {
        id: (Date.now() + 2).toString(),
        content: 'エラーが発生しました。もう一度お試しください。',
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
          法律AIチャット
        </h1>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          <MessageList messages={messages} isLoading={isLoading} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={handleSendMessage} onClearHistory={handleClearHistory} disabled={isLoading} />
    </div>
  );
}
