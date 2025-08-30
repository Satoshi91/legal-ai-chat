import { useState } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';

export interface MessageProps {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

export function Message({ content, role }: MessageProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';
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
            <button
              onClick={handleCopy}
              className="mt-2 flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors self-start"
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
          )}
        </div>
      </div>
    </div>
  );
}