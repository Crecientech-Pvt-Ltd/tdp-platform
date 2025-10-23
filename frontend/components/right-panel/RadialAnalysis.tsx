'use client';

import { ChevronsUpDownIcon, InfoIcon } from 'lucide-react';
import React from 'react';
import { radialAnalysisOptions } from '@/lib/data';
import { useStore } from '@/lib/hooks';
import type { RadialAnalysisSetting } from '@/lib/interface';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { VirtualizedCombobox } from '../VirtualizedCombobox';

export function RadialAnalysis() {
  const [minScore, setMinScore] = React.useState(0);
  const [isGeneDegree, setIsGeneDegree] = React.useState(true);
  const radioOptions = useStore(state => state.radioOptions);

  const radialAnalysis = useStore(state => state.radialAnalysis);

  const updateRadialAnalysis = (value: number | string, key: keyof RadialAnalysisSetting) => {
    useStore.setState({ radialAnalysis: { ...radialAnalysis, [key]: value } });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: not required
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).has('file')) return;
    const minScore = Number(JSON.parse(localStorage.getItem('graphConfig') ?? '{}').minScore) ?? 0;
    setMinScore(minScore);
    updateRadialAnalysis(minScore, 'edgeWeightCutOff');
  }, []);

  return (
    <Collapsible defaultOpen className='mb-2'>
      <div className='flex items-center justify-between bg-primary p-2 text-white'>
        <Label className='font-bold'>Radial Analysis</Label>
        <CollapsibleTrigger asChild>
          <Button type='button' variant='oldtool' size='icon' className='h-6 w-6'>
            <ChevronsUpDownIcon size={15} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className='flex flex-col gap-2 p-4'>
        {radialAnalysisOptions.map((option, idx) => (
          <div key={option.key} className='space-y-4'>
            <div className='flex items-center gap-2'>
              <div className='flex w-full flex-col gap-2'>
                <Label htmlFor={option.key} className='flex items-center gap-1 font-semibold text-xs'>
                  {option.label}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className='shrink-0' size={12} />
                    </TooltipTrigger>
                    <TooltipContent align='end'>
                      <p className='max-w-60 text-white'>{option.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Slider
                  id={option.key}
                  min={option.key === 'edgeWeightCutOff' ? minScore : option.min}
                  max={option.key === 'nodeDegreeCutOff' && !isGeneDegree ? 1 : option.max}
                  step={option.key === 'nodeDegreeCutOff' && !isGeneDegree ? 0.01 : option.step}
                  value={[radialAnalysis[option.key]]}
                  onValueChange={value => updateRadialAnalysis(value[0], option.key as keyof RadialAnalysisSetting)}
                />
                {option.key === 'nodeDegreeCutOff' && (
                  <VirtualizedCombobox
                    data={['Gene Degree', ...radioOptions.database.TE, ...radioOptions.user.TE]}
                    width='550px'
                    align='end'
                    className='w-full'
                    value={radialAnalysis.nodeDegreeProperty}
                    onChange={value => {
                      if (typeof value !== 'string') return;
                      setIsGeneDegree(value === 'Gene Degree');
                      updateRadialAnalysis(value, 'nodeDegreeProperty');
                    }}
                  />
                )}
              </div>
              <Input
                type='number'
                className='w-14'
                min={option.min}
                max={option.max}
                step={option.step}
                value={radialAnalysis[option.key]}
                onChange={e =>
                  updateRadialAnalysis(Number.parseFloat(e.target.value), option.key as keyof RadialAnalysisSetting)
                }
              />
            </div>
            {idx !== radialAnalysisOptions.length - 1 && <hr />}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
