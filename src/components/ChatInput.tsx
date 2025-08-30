import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onClearHistory: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, onClearHistory, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力してください..."
              disabled={disabled}
              rows={2}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none disabled:opacity-50 disabled:cursor-not-allowed text-base"
              style={{ minHeight: '96px', maxHeight: '200px' }}
            />
            <button
              type="submit"
              disabled={!message.trim() || disabled}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={24} />
            </button>
          </div>
        </form>
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter で送信、Shift + Enter で改行
          </p>
          <button
            onClick={onClearHistory}
            disabled={disabled}
            className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={16} />
            <span>チャット履歴クリア</span>
          </button>
        </div>
      </div>
    </div>
  );
}