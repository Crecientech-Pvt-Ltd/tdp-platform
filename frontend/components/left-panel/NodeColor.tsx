import { type NodeColorType, PROPERTY_LABEL_TYPE_MAPPING, nodeColor } from '@/lib/data';
import { useStore } from '@/lib/hooks';
import { ChevronsUpDown, Info, RefreshCcw } from 'lucide-react';
import { VirtualizedCombobox } from '../VirtualizedCombobox';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Combobox } from '../ui/combobox';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export function NodeColor({ onPropChange }: { onPropChange: (prop: string | Set<string>) => void }) {
  const radioValue = useStore(state => state.selectedRadioNodeColor);
  const radioOptions = useStore(state => state.radioOptions);
  const selectedNodeColorProperty = useStore(state => state.selectedNodeColorProperty);

  return (
    <Collapsible defaultOpen className='my-2'>
      <div className='flex items-center justify-between w-full bg-primary p-2'>
        <Label className='font-bold text-white'>Node Color</Label>
        <div className='space-x-1 flex items-center'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => useStore.setState({ selectedRadioNodeColor: undefined })}
                type='button'
                variant='oldtool'
                size='icon'
                className='w-6 h-6'
              >
                <RefreshCcw size={15} />
              </Button>
            </TooltipTrigger>
            <TooltipContent className='text-white'>Reset</TooltipContent>
          </Tooltip>
          <CollapsibleTrigger asChild>
            <Button type='button' variant='oldtool' size='icon' className='w-6 h-6'>
              <ChevronsUpDown size={15} />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className='p-4'>
        <RadioGroup
          value={radioValue ?? ''}
          onValueChange={value =>
            useStore.setState({ selectedRadioNodeColor: value as NodeColorType, selectedNodeColorProperty: '' })
          }
        >
          {nodeColor.map(({ label, tooltipContent }) => (
            <Tooltip key={label}>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value={PROPERTY_LABEL_TYPE_MAPPING[label]} id={label} />
                <Label htmlFor={label} className='text-xs'>
                  {label}
                </Label>
                <TooltipTrigger asChild>{tooltipContent && <Info size={12} className='shrink-0' />}</TooltipTrigger>
              </div>
              {tooltipContent && (
                <TooltipContent align='start' className='max-w-80 text-white'>
                  {tooltipContent}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </RadioGroup>
        {radioValue &&
          (radioValue === 'TE' || radioValue === 'Pathway' ? (
            <VirtualizedCombobox
              key={radioValue}
              data={[...radioOptions.database[radioValue], ...radioOptions.user[radioValue]]}
              className='mt-2 w-full text-black'
              value={selectedNodeColorProperty}
              onChange={onPropChange}
              width={radioValue === 'TE' ? '550px' : '800px'}
              radioOptions={radioOptions}
              selectedRadio={radioValue}
            />
          ) : (
            <Combobox
              key={radioValue}
              data={[...radioOptions.database[radioValue], ...radioOptions.user[radioValue]]}
              className='mt-2 w-full text-black'
              value={selectedNodeColorProperty}
              onChange={onPropChange}
              radioOptions={radioOptions}
              selectedRadio={radioValue}
            />
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

