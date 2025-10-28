import { ChevronsUpDownIcon, InfoIcon, RefreshCcwIcon } from 'lucide-react';
import { type NodeSizeType, nodeSize, PROPERTY_LABEL_TYPE_MAPPING } from '@/lib/data';
import { useStore } from '@/lib/hooks';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Combobox } from '../ui/combobox';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { VirtualizedCombobox } from '../VirtualizedCombobox';

export function NodeSize({ onPropChange }: { onPropChange: (prop: string | Set<string>) => void }) {
  const radioValue = useStore(state => state.selectedRadioNodeSize);
  const radioOptions = useStore(state => state.radioOptions);
  const selectedNodeSizeProperty = useStore(state => state.selectedNodeSizeProperty);

  return (
    <Collapsible defaultOpen className='mb-2'>
      <div className='flex w-full items-center justify-between bg-primary p-2'>
        <Label className='font-bold text-white'>Node Size</Label>
        <div className='flex items-center space-x-1'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => useStore.setState({ selectedRadioNodeSize: undefined })}
                type='button'
                variant='basic'
                size='icon'
                className='size-6'
              >
                <RefreshCcwIcon size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className='text-white'>Reset</TooltipContent>
          </Tooltip>
          <CollapsibleTrigger asChild>
            <Button type='button' variant='basic' size='icon' className='size-6'>
              <ChevronsUpDownIcon size={15} />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className='mt-2 p-4'>
        <RadioGroup
          value={radioValue ?? ''}
          onValueChange={value =>
            useStore.setState({ selectedRadioNodeSize: value as NodeSizeType, selectedNodeSizeProperty: '' })
          }
        >
          {nodeSize.map(({ label, tooltipContent }) => {
            return (
              <Tooltip key={label}>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value={PROPERTY_LABEL_TYPE_MAPPING[label]} id={label} />
                  <Label htmlFor={label} className='text-xs'>
                    {label}
                  </Label>
                  <TooltipTrigger asChild>
                    {tooltipContent && <InfoIcon size={12} className='shrink-0' />}
                  </TooltipTrigger>
                </div>
                {tooltipContent && (
                  <TooltipContent align='start' className='max-w-80 text-white'>
                    {tooltipContent}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </RadioGroup>
        {radioValue &&
          (radioValue === 'TE' ? (
            <VirtualizedCombobox
              key={radioValue}
              data={[...radioOptions.user[radioValue], ...radioOptions.database[radioValue]]}
              className='mt-2 w-full text-black'
              value={selectedNodeSizeProperty}
              onChange={onPropChange}
              width='550px'
              multiselect
            />
          ) : (
            <Combobox
              key={radioValue}
              data={[...radioOptions.user[radioValue], ...radioOptions.database[radioValue]]}
              className='mt-2 w-full text-black'
              value={selectedNodeSizeProperty}
              onChange={onPropChange}
            />
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
