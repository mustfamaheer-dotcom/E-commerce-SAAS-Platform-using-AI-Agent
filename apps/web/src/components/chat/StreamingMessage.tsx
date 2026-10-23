// apps/web/src/components/chat/StreamingMessage.tsx
import React from 'react';
import { Bot } from 'lucide-react';
import { GenUiRegistry } from './GenUiRegistry';

interface StreamingMessageProps {
  tokens: string;
  cardType?: string | null;
  cardPayload?: any;
  isStreaming?: boolean;
  onApproveAction?: (actionId: string) => void;
  onSendMessage?: (msg: string) => void;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  tokens,
  cardType,
  cardPayload,
  isStreaming = false,
  onApproveAction,
  onSendMessage,
}) => {
  if (!tokens && !cardType) return null;

  return (
    <div className="flex flex-col items-start space-y-1 animate-fadeIn" dir="rtl">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
        <Bot className="w-3 h-3 text-sky-500" />
        <span>وكيل تيك زون</span>
        <span>•</span>
        <span className="text-emerald-500 font-mono font-bold">بث مباشر</span>
      </div>

      <div className="max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-xs">
        {tokens && (
          <div className="whitespace-pre-line font-medium">
            {tokens}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3.5 bg-sky-500 ml-1 animate-pulse align-middle" />
            )}
          </div>
        )}

        {cardType && (
          <div className="mt-3">
            <GenUiRegistry
              cardType={cardType}
              payload={cardPayload || {}}
              onApprove={onApproveAction}
              onSendMessage={onSendMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
};
