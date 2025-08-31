import { useState } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';

export interface MessageProps {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'reference_url';
  timestamp: Date;
  contextDocuments?: number;
  url?: string; // reference_urlロールで使用
}

export function Message({ content, role, contextDocuments, url }: MessageProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';
  const isReference = role === 'reference_url';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  // システムメッセージの場合は特別な表示
  if (isSystem) {
    return (
      <div className="flex justify-center mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          {content}
        </p>
      </div>
    );
  }

  // 参考URLメッセージの場合は特別な表示
  if (isReference && url) {
    const handleLinkClick = (e: React.MouseEvent) => {
      e.preventDefault();
      window.open(url, '_blank');
    };

    return (
      <div className="flex justify-start mb-2">
        <div className="max-w-xs lg:max-w-md xl:max-w-lg">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2">
            <div className="flex items-start space-x-2">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">📜</span>
              <a 
                href={url}
                onClick={handleLinkClick}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline cursor-pointer break-words"
                title={`新しいウィンドウで開く: ${url}`}
              >
                {content}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start ${isUser ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}>
          {isUser ? <User size={24} /> : <Bot size={24} />}
        </div>

        {/* Message Content */}
        <div className="flex flex-col">
          <div className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
          }`}>
            <p className="text-base whitespace-pre-wrap break-words">{content}</p>
          </div>
          
          {/* Copy Button for Assistant Messages Only (not for system) */}
          {role === 'assistant' && (
            <div className="mt-2 space-y-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="コピー"
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    <span className="text-sm">コピーしました</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span className="text-sm">コピー</span>
                  </>
                )}
              </button>
              
              {/* 実際のAPI仕様に基づく情報表示 */}
              {contextDocuments && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    参照文書数: {contextDocuments}件
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}