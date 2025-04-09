import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { GenePropertyMetadata, RadioOptions } from '@/lib/interface';
import type { GeneProperties } from '@/lib/data';
import { cn, getProperty } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, ChevronsUpDown, Info, ListCheck } from 'lucide-react';
import * as React from 'react';
import { Spinner } from './ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

interface VirtualizedCommandProps {
  options: (string | GenePropertyMetadata)[];
  placeholder: string;
  selectedOption: string | Set<string>;
  onSelectOption?: (option: string | string[]) => void;
  loading?: boolean;
  width?: string;
  multiselect?: boolean;
  radioOptions: RadioOptions;
  selectedRadio: GeneProperties;
}

const VirtualizedCommand = ({
  options,
  placeholder,
  selectedOption,
  onSelectOption,
  loading,
  width,
  multiselect = false,
  radioOptions,
  selectedRadio,
}: VirtualizedCommandProps) => {
  const [filteredOptions, setFilteredOptions] = React.useState<(string | GenePropertyMetadata)[]>(options);
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  const virtualOptions = virtualizer.getVirtualItems();

  const handleSearch = (search: string) => {
    const lowerCaseSearch = search.toLowerCase();
    setFilteredOptions(
      options.filter(option => {
        if (typeof option === 'string') {
          return option.toLowerCase().includes(lowerCaseSearch);
        }
        return option.name.toLowerCase().includes(lowerCaseSearch);
      }),
    );
  };

  return (
    <Command style={{ width }} shouldFilter={false}>
      <CommandInput onValueChange={handleSearch} placeholder={placeholder}>
        {multiselect && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className='bg-transparent hover:bg-muted cursor-pointer p-2 rounded border shadow'
                onClick={() => onSelectOption?.(filteredOptions.slice(0, 50).map(getProperty))}
              >
                <ListCheck className='h-4 w-4 text-black' />
              </Button>
            </TooltipTrigger>
            <TooltipContent className='text-white'>Select all (only first 50 items are selected at max)</TooltipContent>
          </Tooltip>
        )}
      </CommandInput>
      {loading ? <Spinner variant={1} size={'small'} /> : <CommandEmpty>No Result Found.</CommandEmpty>}
      <CommandGroup>
        <CommandList ref={parentRef}>
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualOptions.map(virtualOption => {
              const option = filteredOptions[virtualOption.index];
              const value = getProperty(option);
              const isUserProperty =
                typeof option === 'string' ? radioOptions.user[selectedRadio]?.includes(value) : option.isUserProperty;
              return (
                <CommandItem
                  className='absolute flex justify-between w-full overflow-visible'
                  style={{
                    transform: `translateY(${virtualOption.start}px)`,
                  }}
                  key={value}
                  value={value}
                  onSelect={onSelectOption}
                >
                  <div className='flex items-center'>
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        (selectedOption instanceof Set ? selectedOption.has(value) : selectedOption === value)
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    <div className='flex items-center gap-1'>
                      <span>{value}</span>
                      <span className='text-xs'>{isUserProperty ? '[USER]' : ''}</span>
                    </div>
                  </div>
                  {typeof option !== 'string' && option.description && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className='h-4 w-4 ml-2 cursor-pointer' />
                      </TooltipTrigger>
                      <TooltipContent side='left' align='start' className='max-w-48 text-white'>
                        {option.description}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </CommandItem>
              );
            })}
          </div>
        </CommandList>
      </CommandGroup>
    </Command>
  );
};

interface VirtualizedComboboxProps {
  loading?: boolean;
  className?: string;
  data?: (string | GenePropertyMetadata)[];
  placeholder?: string;
  value: string | Set<string>;
  width?: string;
  onChange: (value: string | Set<string>) => void;
  align?: 'start' | 'end' | 'center';
  multiselect?: boolean;
  radioOptions: RadioOptions;
  selectedRadio: GeneProperties;
}

export function VirtualizedCombobox({
  loading = false,
  className,
  data = [],
  placeholder: searchPlaceholder = 'Search items...',
  value,
  width = '800px',
  onChange,
  align = 'start',
  multiselect = false,
  radioOptions,
  selectedRadio,
}: VirtualizedComboboxProps) {
  const [open, setOpen] = React.useState<boolean>(false);

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
          variant='oldtool'
          role='combobox'
          aria-expanded={open}
          className={cn(
            'w-[200px] border justify-between text-ellipsis text-wrap break-words h-9 bg-white text-black',
            className,
          )}
        >
          {selectedItem ? (
            <div className='flex items-center gap-2'>
              <span className='truncate'>{typeof selectedItem === 'string' ? selectedItem : selectedItem.name}</span>
              <span className='text-xs'>{isSelectedUserProperty ? '[USER]' : ''}</span>
            </div>
          ) : (
            <span className='truncate'>
              {multiselect && value instanceof Set
                ? value.size
                  ? `${value.size} selected`
                  : searchPlaceholder
                : value || searchPlaceholder}
            </span>
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0' />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className={cn(`w-[${width || '200px'}] p-0`, className)}>
        <VirtualizedCommand
          multiselect={multiselect}
          options={data}
          placeholder={searchPlaceholder}
          selectedOption={value}
          onSelectOption={currentValue => {
            if (multiselect) {
              if (typeof value === 'string') value = new Set();
              if (typeof currentValue === 'string') {
                if (value.has(currentValue)) {
                  value.delete(currentValue);
                } else {
                  value.add(currentValue);
                }
              } else {
                if (currentValue.length) {
                  for (const v of currentValue) {
                    value.add(v);
                  }
                } else {
                  value.clear();
                }
              }
              onChange(new Set(value));
            } else if (typeof currentValue === 'string') {
              onChange(currentValue);
              setOpen(false);
            }
          }}
          loading={loading}
          width={width}
          radioOptions={radioOptions}
          selectedRadio={selectedRadio}
        />
      </PopoverContent>
    </Popover>
  );
}

