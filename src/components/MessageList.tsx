import { Message, MessageProps } from './Message';
import { LoadingMessage } from './LoadingMessage';

interface MessageListProps {
  messages: MessageProps[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 max-w-md text-center">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            法律AIチャットへようこそ
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base">
            法律に関する質問をお聞かせください。お答えします。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <Message key={message.id} {...message} />
      ))}
      {isLoading && <LoadingMessage />}
    </div>
  );
}