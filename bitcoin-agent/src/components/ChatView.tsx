import { useState, useRef, useEffect } from 'react';
import { useWalletStore } from '../store/walletStore';

export function ChatView() {
  const {
    chatHistory,
    isAgentThinking,
    sendAgentMessage,
  } = useWalletStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAgentThinking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isAgentThinking) return;
    setInput('');
    await sendAgentMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl">
      <h2 className="text-2xl font-bold text-white mb-4">Agent</h2>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
        {chatHistory.length === 0 && !isAgentThinking && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 mb-3">
              Ask your agent anything about your wallet.
            </p>
            <div className="space-y-1">
              <p className="text-xs text-gray-600 font-mono">
                &quot;What&apos;s my balance?&quot;
              </p>
              <p className="text-xs text-gray-600 font-mono">
                &quot;Give me a receive address&quot;
              </p>
              <p className="text-xs text-gray-600 font-mono">
                &quot;What are the current fees?&quot;
              </p>
              <p className="text-xs text-gray-600 font-mono">
                &quot;Show me my UTXOs&quot;
              </p>
              <p className="text-xs text-gray-600 font-mono">
                &quot;Send 5000 sats to tb1q...&quot;
              </p>
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i}>
            {/* Message bubble */}
            <div
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-orange-600/20 text-gray-200'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>

            {/* Tool results (shown below assistant messages) */}
            {msg.role === 'assistant' &&
              msg.toolResults &&
              msg.toolResults.length > 0 && (
                <div className="flex justify-start mt-1">
                  <div className="max-w-[80%] space-y-1">
                    {msg.toolResults.map((tr, j) => {
                      let parsed: Record<string, unknown> | null = null;
                      try {
                        parsed = JSON.parse(tr.result);
                      } catch {
                        // not JSON
                      }
                      return (
                        <div
                          key={j}
                          className="bg-gray-900 border border-gray-800 rounded px-3 py-2"
                        >
                          <p className="text-xs text-orange-400 font-mono mb-1">
                            {tr.tool}
                          </p>
                          {parsed ? (
                            <pre className="text-xs text-gray-500 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(parsed, null, 2)}
                            </pre>
                          ) : (
                            <p className="text-xs text-gray-500">{tr.result}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        ))}

        {isAgentThinking && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg px-4 py-2.5">
              <p className="text-sm text-gray-500 animate-pulse">Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-gray-800 pt-4">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your agent..."
          disabled={isAgentThinking}
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isAgentThinking || !input.trim()}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
