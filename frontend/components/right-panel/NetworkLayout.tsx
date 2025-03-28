'use client';

import { forceLayoutOptions } from '@/lib/data';
import { useStore } from '@/lib/hooks';
import type { ForceSettings } from '@/lib/interface';
import { ChevronsUpDown, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export function NetworkLayout() {
  const { start, stop } = useStore(state => state.forceWorker);
  const forceSettings = useStore(state => state.forceSettings);

  const handleGraphAnimation = (checked: boolean) => {
    if (checked) {
      start();
    } else {
      stop();
    }
  };

  const updateForceSetting = (value: number[] | string, key: keyof ForceSettings) => {
    useStore.setState({
      forceSettings: {
        ...forceSettings,
        [key]: typeof value === 'string' ? Number.parseFloat(value) : value[0],
      },
    });
  };
  return (
    <Collapsible defaultOpen className='text-xs'>
      <div className='flex items-center justify-between w-full p-2 bg-primary'>
        <p className='font-bold text-white'>Network Layout</p>
        <CollapsibleTrigger asChild>
          <Button type='button' variant='oldtool' size='icon' className='w-6 h-6'>
            <ChevronsUpDown size={15} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className='flex flex-col gap-2 p-1'>
        <div className='flex items-center gap-2 p-3'>
          <Label htmlFor='network-animation-control' className='text-xs font-semibold'>
            Animation
          </Label>
          <Switch id='network-animation-control' defaultChecked onCheckedChange={handleGraphAnimation} />
        </div>
        {forceLayoutOptions.map(option => (
          <div key={option.key} className='flex space-x-2 items-center px-3 pb-2'>
            <div className='flex flex-col space-y-2 w-full'>
              <Label htmlFor={option.key} className='text-xs font-semibold flex gap-1 items-center'>
                {option.label}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='shrink-0' size={12} />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-60 text-white' align='end'>
                    {option.tooltip}
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Slider
                id={option.key}
                className='w-full'
                min={option.min}
                max={option.max}
                step={option.step}
                value={[forceSettings[option.key]]}
                onValueChange={value => updateForceSetting(value, option.key)}
              />
            </div>
            <Input
              type='number'
              className='w-16'
              min={option.min}
              max={option.max}
              step={option.step}
              value={forceSettings[option.key]}
              onChange={e => e.target.value && updateForceSetting(e.target.value, option.key)}
            />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
