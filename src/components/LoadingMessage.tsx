import { Bot } from 'lucide-react';
import { LoadingIcon } from './LoadingIcon';

export function LoadingMessage() {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex flex-row items-start space-x-2 max-w-xs lg:max-w-md xl:max-w-lg">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 mr-2">
          <Bot size={16} />
        </div>

        {/* Loading Content */}
        <div className="rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <LoadingIcon size={16} className="text-gray-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              回答を生成中...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}