import { Label } from '@radix-ui/react-label';
import { ChevronsUpDownIcon } from 'lucide-react';
import { algorithms } from '@/lib/data';
import { Events, eventEmitter } from '@/lib/utils';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import SliderWithInput from './SliderWithInput';

export function NetworkAnalysis() {
  const handleAlgoQuery = (name: string, formData?: FormData) => {
    if (formData) eventEmitter.emit(Events.ALGORITHM, { name, parameters: Object.fromEntries(formData.entries()) });
    else eventEmitter.emit(Events.ALGORITHM, { name });
  };

  return (
    <Collapsible defaultOpen className='mb-2 text-xs'>
      <div className='flex w-full items-center justify-between bg-primary p-2'>
        <p className='font-bold text-white'>Network Analysis</p>
        <CollapsibleTrigger asChild>
          <Button type='button' variant='oldtool' size='icon' className='h-6 w-6'>
            <ChevronsUpDownIcon size={15} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className='-mb-2 mt-1 p-4'>
        <RadioGroup defaultValue='None' className='mb-2'>
          {algorithms.map(({ name, parameters }) => (
            <Popover key={name}>
              <PopoverTrigger asChild onClick={() => name === 'None' && handleAlgoQuery(name)}>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value={name} id={name} />
                  <Label htmlFor={name} className='text-xs'>
                    {name}
                  </Label>
                </div>
              </PopoverTrigger>
              {parameters.length > 0 && (
                <PopoverContent className='w-52'>
                  <form key={name} className='flex flex-col space-y-2' action={f => handleAlgoQuery(name, f)}>
                    {parameters.map(({ name, displayName, type, defaultValue, min, max, step }) => {
                      if (type === 'slider') {
                        return (
                          <div key={name}>
                            <Label key={name} htmlFor={name} className='font-semibold text-xs'>
                              {displayName}
                            </Label>
                            <SliderWithInput
                              min={min}
                              max={max}
                              step={step}
                              id={name}
                              defaultValue={defaultValue as number}
                            />
                          </div>
                        );
                      }
                      return (
                        <div
                          key={name}
                          style={{ gridTemplateColumns: '1fr 2fr' }}
                          className='grid w-full grid-cols-2 items-center gap-2'
                        >
                          <Label key={name} htmlFor={name} className='font-semibold text-xs'>
                            {displayName}
                          </Label>
                          <Checkbox name={name} id={name} defaultChecked={defaultValue as boolean} />
                        </div>
                      );
                    })}
                    <Button type='submit' size={'sm'}>
                      Apply
                    </Button>
                  </form>
                </PopoverContent>
              )}
            </Popover>
          ))}
        </RadioGroup>
      </CollapsibleContent>
    </Collapsible>
  );
}
