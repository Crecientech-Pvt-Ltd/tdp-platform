'use client';

import { ChevronsUpDownIcon, InfoIcon } from 'lucide-react';
import { useId } from 'react';
import { forceLayoutOptions } from '@/lib/data';
import { useStore } from '@/lib/hooks';
import type { ForceSettings } from '@/lib/interface';
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
    useStore.setState(({ forceSettings }) => ({
      forceSettings: {
        ...forceSettings,
        [key]: typeof value === 'string' ? Number.parseFloat(value) : value[0],
      },
    }));
  };

  const networkAnimationControlId = useId();

  return (
    <Collapsible defaultOpen className='text-xs'>
      <div className='flex w-full items-center justify-between bg-primary p-2'>
        <p className='font-bold text-white'>Network Layout</p>
        <CollapsibleTrigger asChild>
          <Button type='button' variant='oldtool' size='icon' className='h-6 w-6'>
            <ChevronsUpDownIcon size={15} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className='flex flex-col gap-2 p-1'>
        <div className='flex items-center gap-2 p-3'>
          <Label htmlFor={networkAnimationControlId} className='font-semibold text-xs'>
            Animation
          </Label>
          <Switch id={networkAnimationControlId} defaultChecked onCheckedChange={handleGraphAnimation} />
        </div>
        {forceLayoutOptions.map(option => (
          <div key={option.key} className='flex items-center space-x-2 px-3 pb-2'>
            <div className='flex w-full flex-col space-y-1'>
              <Label htmlFor={option.key} className='flex items-center gap-1 font-semibold text-xs'>
                {option.label}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className='shrink-0' size={12} />
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
              className='w-16 pr-0'
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
