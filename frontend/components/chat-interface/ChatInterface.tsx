'use client';

import { useEffect, useState } from 'react';
import { chat as openaiChat } from '@/lib/api/openAi';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import buildPrompt from './prompts';
import ThinkingIndicator from './ThinkingIndicator';
import type { ChatInterfaceProps, ChatMessage } from './types';

/**
 * Generate a short unique id for chat messages.
 * @returns Unique id string suitable for React keys.
 */
function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Chat UI for prompting the backend and rendering a session transcript.
 * @param dataContext Optional context used to enrich prompts.
 * @param onSend Optional handler to send user input and return assistant text.
 * @param storageKey LocalStorage key for persisting messages.
 * @param showNewChatButton Toggle for the "New chat" action.
 * @returns Chat interface React element.
 */
export default function ChatInterface({
  dataContext,
  onSend,
  storageKey = 'traces-chat',
  showNewChatButton = true,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  console.log('Context: ', dataContext);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setMessages(parsed);
      }
    } catch (_e) {
      // ignore invalid storage
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  /**
   * Send a user message to the backend using the default OpenAI pipeline.
   * @param rawText User's raw input text.
   * @returns Assistant response text (or a readable error message).
   */
  async function defaultSend(rawText: string) {
    // Build the prompt including the data context
    const prompt = buildPrompt(dataContext, rawText);

    // Try calling a backend route; if unavailable, return a readable error message.
    try {
      const res = await openaiChat(prompt);
      return res.text || 'No response.';
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : 'Chat request failed. Check backend connectivity.';
      return `Chat error: ${message} (verify NEXT_PUBLIC_BACKEND_URL, /api/agent/respond, and OPENAI_API_KEY).`;
    }
  }

  /**
   * Append user message, resolve assistant response, then append assistant message.
   * @param text User input text.
   * @returns Promise that resolves after state updates complete.
   */
  async function handleSend(text: string) {
    const userMsg: ChatMessage = { id: makeId(), role: 'user', text, time: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);

    const responder = onSend ?? defaultSend;
    setIsThinking(true);
    let assistantText = '';
    try {
      assistantText = await responder(text);
    } finally {
      setIsThinking(false);
    }

    const assistantMsg: ChatMessage = {
      id: makeId(),
      role: 'assistant',
      text: assistantText || 'No response',
      time: new Date().toISOString(),
    };
    setMessages(m => [...m, assistantMsg]);
  }

  /**
   * Reset the chat transcript and clear persisted local storage entry.
   * @returns Void.
   */
  function handleNewChat() {
    setMessages([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
  }

  return (
    <div className='flex h-full flex-col rounded-lg bg-secondary text-[12px] text-secondary-foreground'>
      <div className='flex items-center justify-between border-border border-b px-2.5 py-1.5 font-semibold'>
        <span>Data Chat</span>
        {showNewChatButton && (
          <button
            type='button'
            className='rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-foreground hover:text-primary'
            onClick={handleNewChat}
          >
            New chat
          </button>
        )}
      </div>
      <div className='flex-1 overflow-auto p-2'>
        <MessageList
          messages={messages}
          emptyText={
            dataContext ? 'Ask a question about the selected genes.' : 'Ask a biology question to get started.'
          }
        />
        {isThinking && <ThinkingIndicator />}
      </div>
      <div className='border-border border-t p-2'>
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
}
