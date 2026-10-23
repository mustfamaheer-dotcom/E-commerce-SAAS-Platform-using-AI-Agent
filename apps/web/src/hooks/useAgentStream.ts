// apps/web/src/hooks/useAgentStream.ts
import { useState, useCallback, useRef } from 'react';

export interface StreamCallbacks {
  onThinking?: (message?: string) => void;
  onToolCall?: (tool: string, message?: string) => void;
  onToken?: (token: string) => void;
  onCard?: (cardType: string, payload: any) => void;
  onDone?: (data: { reply: string; cardType?: string; payload?: any; sessionId?: string }) => void;
  onError?: (error: string) => void;
}

export function useAgentStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendStreamMessage = useCallback(
    async (
      payload: { message: string; session_id?: string; tenant_id: string },
      callbacks?: StreamCallbacks
    ) => {
      setIsStreaming(true);
      setThinkingStatus('وكيل تيك زون يحلل طلبك...');
      setCurrentTool(null);

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('http://127.0.0.1:8001/api/v1/agent/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Streaming failed: HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('ReadableStream not supported by browser');
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const block of parts) {
            const lines = block.split('\n');
            let eventType = 'message';
            let dataStr = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventType = line.replace('event:', '').trim();
              } else if (line.startsWith('data:')) {
                dataStr = line.replace('data:', '').trim();
              }
            }

            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              if (eventType === 'thinking') {
                setThinkingStatus(data.message || 'وكيل تيك زون يفكر...');
                callbacks?.onThinking?.(data.message);
              } else if (eventType === 'tool_call') {
                setCurrentTool(data.tool);
                setThinkingStatus(data.message || `جاري تشغيل أداة: ${data.tool}`);
                callbacks?.onToolCall?.(data.tool, data.message);
              } else if (eventType === 'token') {
                setThinkingStatus(null);
                callbacks?.onToken?.(data.token);
              } else if (eventType === 'card') {
                callbacks?.onCard?.(data.card_type, data.payload);
              } else if (eventType === 'done') {
                callbacks?.onDone?.(data);
              } else if (eventType === 'error') {
                callbacks?.onError?.(data.error || 'حدث خطأ');
              }
            } catch (err) {
              console.error('Failed to parse SSE JSON block:', err);
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('SSE Stream error:', err);
          callbacks?.onError?.(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
        }
      } finally {
        setIsStreaming(false);
        setThinkingStatus(null);
        setCurrentTool(null);
        abortControllerRef.current = null;
      }
    },
    []
  );

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    isStreaming,
    thinkingStatus,
    currentTool,
    sendStreamMessage,
    abortStream,
  };
}
