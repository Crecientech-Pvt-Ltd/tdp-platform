'use client';

import { ChevronsUpDown, Info } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { GenePropertyMetadata, RadioOptions } from '@/lib/interface';
import type { GeneProperties } from '@/lib/data';
import { cn, getProperty } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

export function Combobox({
  data,
  value,
  onChange,
  className,
  placeholder = 'Select...',
  align = 'start',
  multiselect = false,
  radioOptions,
  selectedRadio,
  disabled,
}: {
  data: readonly (string | GenePropertyMetadata)[];
  value: string | Set<string>;
  onChange: (value: string | Set<string>) => void;
  className?: string;
  placeholder?: string;
  align?: 'start' | 'end' | 'center';
  multiselect?: boolean;
  radioOptions?: RadioOptions;
  selectedRadio?: GeneProperties;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const selectedItem = data?.find(item => {
    const propertyName = typeof item === 'string' ? item : item.name;
    return multiselect && value instanceof Set ? value.has(propertyName) : value === propertyName;
  });

  const isSelectedUserProperty = selectedItem
    ? typeof selectedItem === 'string'
      ? selectedRadio && radioOptions?.user[selectedRadio]?.includes(selectedItem)
      : selectedItem.isUserProperty
    : false;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('w-full justify-between', !selectedItem && 'text-muted-foreground', className)}
          disabled={disabled}
        >
          {selectedItem ? (
            <div className='flex items-center gap-2'>
              <span className='truncate'>{typeof selectedItem === 'string' ? selectedItem : selectedItem.name}</span>
              <span className='text-xs'>{isSelectedUserProperty ? '[USER]' : ''}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className={cn('p-0 w-full', className)}>
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No Result Found.</CommandEmpty>
            <CommandGroup>
              {data?.map(item => {
                const propertyName = getProperty(item);
                const isUserProperty =
                  typeof item === 'string'
                    ? selectedRadio && radioOptions?.user[selectedRadio]?.includes(propertyName)
                    : item.isUserProperty;
                return (
                  <CommandItem
                    key={propertyName}
                    value={propertyName}
                    onSelect={currentValue => {
                      if (multiselect) {
                        onChange(value instanceof Set ? new Set([...value, currentValue]) : new Set([currentValue]));
                      } else {
                        onChange(currentValue);
                        setOpen(false);
                      }
                    }}
                    className='flex justify-between w-full'
                  >
                    <div className='flex items-center gap-2'>
                      <span className='truncate'>{propertyName}</span>
                      <span className='text-xs'>{isUserProperty ? '[USER]' : ''}</span>
                    </div>
                    {typeof item !== 'string' && item.description && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className='h-4 w-4 ml-4 cursor-pointer' />
                        </TooltipTrigger>
                        <TooltipContent side='right' align='start' className='max-w-80 text-white'>
                          {item.description}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

