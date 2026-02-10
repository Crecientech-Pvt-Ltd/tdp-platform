'use client';

import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from './types';

/**
 * Render a list of chat messages or an empty-state placeholder.
 * @param messages Chat transcript to display.
 * @param emptyText Optional text shown when there are no messages.
 * @returns Message list React element.
 */
export default function MessageList({ messages, emptyText }: { messages: ChatMessage[]; emptyText?: string }) {
  if (!messages.length) {
    return <div className='text-muted-foreground'>{emptyText ?? 'Ask a question about the selected genes.'}</div>;
  }

  const components: Components = {
    p: props => <p className='mb-1 last:mb-0' {...props} />,
    a: props => <a className='text-primary underline' {...props} />,
    ul: props => <ul className='mb-1 ml-4 list-disc' {...props} />,
    ol: props => <ol className='mb-1 ml-4 list-decimal' {...props} />,
    li: props => <li className='my-0.5' {...props} />,
    code: props => {
      const isInline = !('className' in props) || !props.className?.includes('language-');
      if (isInline) {
        return (
          <code className='rounded bg-background px-1 py-[1px] font-mono text-[11px] text-foreground' {...props} />
        );
      }
      return <code className='font-mono text-[11px]' {...props} />;
    },
    pre: props => (
      <pre className='my-1.5 overflow-auto rounded-md bg-primary px-2.5 py-2 text-primary-foreground' {...props} />
    ),
    blockquote: props => (
      <blockquote className='my-1 border-border border-l-[3px] pl-2 text-muted-foreground' {...props} />
    ),
    h1: props => <h1 className='my-1 font-bold text-[13px]' {...props} />,
    h2: props => <h2 className='my-1 font-bold text-[12.5px]' {...props} />,
    h3: props => <h3 className='my-1 font-bold text-[12px]' {...props} />,
    h4: props => <h4 className='my-1 font-bold text-[12px]' {...props} />,
    table: props => <table className='my-1 w-full table-auto border-collapse text-[11px]' {...props} />,
    th: props => <th className='border border-border bg-background px-1.5 py-1 text-left font-bold' {...props} />,
    td: props => <td className='border border-border px-1.5 py-1 text-left align-top' {...props} />,
  };

  return (
    <div className='flex flex-col gap-2'>
      {messages.map(message => (
        <div
          key={message.id}
          className={`rounded-md p-2 leading-[1.3] ${
            message.role === 'user' ? 'bg-background' : message.role === 'system' ? 'bg-accent/20' : 'bg-muted'
          }`}
        >
          <div className='whitespace-pre-wrap'>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {message.text}
            </ReactMarkdown>
          </div>
          <div className='mt-1 text-[10px] text-muted-foreground'>{new Date(message.time).toLocaleTimeString()}</div>
        </div>
      ))}
    </div>
  );
}
