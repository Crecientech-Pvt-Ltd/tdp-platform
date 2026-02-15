'use client';

export default function ThinkingIndicator() {
  return (
    <output className='mt-2 flex items-center gap-2 text-muted-foreground text-xs' aria-live='polite'>
      <span>Thinking</span>
      <span className='flex items-center gap-1'>
        <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]' />
        <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]' />
        <span className='h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground' />
      </span>
    </output>
  );
}
