'use client';

import { radialAnalysisOptions } from '@/lib/data';
import { useStore } from '@/lib/hooks';
import type { RadialAnalysisSetting } from '@/lib/interface';
import { ChevronsUpDown, Info } from 'lucide-react';
import React from 'react';
import { VirtualizedCombobox } from '../VirtualizedCombobox';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export function RadialAnalysis() {
  const [minScore, setMinScore] = React.useState(0);
  const [isGeneDegree, setIsGeneDegree] = React.useState(true);
  const radioOptions = useStore(state => state.radioOptions);

  const radialAnalysis = useStore(state => state.radialAnalysis);

  const updateRadialAnalysis = (value: number | string, key: keyof RadialAnalysisSetting) => {
    useStore.setState({ radialAnalysis: { ...radialAnalysis, [key]: value } });
  };

  React.useEffect(() => {
    const minScore = Number(JSON.parse(localStorage.getItem('graphConfig') ?? '{}').minScore) ?? 0;
    setMinScore(minScore);
    updateRadialAnalysis(minScore, 'edgeWeightCutOff');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Collapsible defaultOpen className='mb-2'>
      <div className='flex items-center justify-between bg-primary text-white p-2'>
        <Label className='font-bold'>Radial Analysis</Label>
        <CollapsibleTrigger asChild>
          <Button type='button' variant='oldtool' size='icon' className='w-6 h-6'>
            <ChevronsUpDown size={15} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className='flex flex-col gap-2 p-4'>
        {radialAnalysisOptions.map((option, idx) => (
          <div key={option.key} className='space-y-4'>
            <div className='flex gap-2 items-center'>
              <div className='flex flex-col gap-2 w-full'>
                <Label htmlFor={option.key} className='text-xs font-semibold flex gap-1 items-center'>
                  {option.label}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className='shrink-0' size={12} />
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
