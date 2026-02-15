'use client';

import * as Popover from '@radix-ui/react-popover';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { Button } from './button';

interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MultiSelect = ({
  options,
  selectedValues = [],
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className,
  ref,
}: MultiSelectProps & {
  ref?: React.RefObject<HTMLButtonElement | null> | React.RefCallback<HTMLButtonElement | null>;
}) => {
  const [open, setOpen] = React.useState(false);
  const selected = selectedValues ?? [];

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [minWidth, setMinWidth] = React.useState<number>();

  React.useEffect(() => {
    if (open && triggerRef.current) {
      setMinWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  const setRefs = (node: HTMLButtonElement | null) => {
    if (typeof ref === 'function') ref(node);
    else if (ref && 'current' in ref) (ref as React.RefObject<HTMLButtonElement | null>).current = node;
    if (triggerRef && 'current' in triggerRef) {
      (triggerRef as React.RefObject<HTMLButtonElement | null>).current = node;
    }
  };

  const toggleValue = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          type='button'
          variant={'outline'}
          ref={setRefs}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className='min-w-0 flex-1 truncate text-left'>
            {selected.length > 0
              ? options
                  .filter(o => selected.includes(o.value))
                  .map(o => o.label)
                  .join(', ')
              : placeholder}
          </span>
          <ChevronsUpDownIcon className='size-4 shrink-0 opacity-50' />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align='start'
          style={minWidth ? { minWidth } : undefined}
          className={cn(
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-96 w-auto overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in',
          )}
        >
          {options.map(option => (
            <button
              type='button'
              key={option.value}
              onClick={() => toggleValue(option.value)}
              className={cn(
                'relative flex w-full cursor-default select-none items-center whitespace-nowrap rounded-sm py-1.5 pr-8 pl-2 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <span className='absolute right-2 flex h-3.5 w-3.5 items-center justify-center'>
                {selected.includes(option.value) && <CheckIcon className='size-4' />}
              </span>
              {option.label}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
