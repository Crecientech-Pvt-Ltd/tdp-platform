'use client';

import type React from 'react';
import { useState } from 'react';

/**
 * Input row for composing and submitting chat messages.
 * @param onSend Callback invoked with trimmed user text.
 * @returns Message input React element.
 */
export default function MessageInput({ onSend }: { onSend: (text: string) => void | Promise<void> }) {
  const [value, setValue] = useState('');

  /**
   * Handle form submission, validate input, and forward to the sender.
   * @param e Form submit event.
   * @returns Promise that resolves after sending completes.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    setValue('');
    await onSend(text);
  }

  return (
    <form className='flex gap-1.5' onSubmit={handleSubmit}>
      <input
        className='flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-foreground'
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder='Ask about a gene or neighborhood...'
      />
      <button className='rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/90' type='submit'>
        Send
      </button>
    </form>
  );
}
