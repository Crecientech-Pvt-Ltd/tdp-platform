'use client';

import { ChevronsUpDownIcon } from 'lucide-react';
import React from 'react';
import { PROPERTY_TYPE_LABEL_MAPPING } from '@/lib/data';
import { useStore } from '@/lib/hooks';
import { P_VALUE_REGEX } from '@/lib/utils';
import { BinaryLegend, HeatmapLegend } from '../legends';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

export function Legend() {
  const selectedRadioNodeColor = useStore(state => state.selectedRadioNodeColor);
  const selectedNodeColorProperty = useStore(state => state.selectedNodeColorProperty);
  const showEdgeColor = useStore(state => state.showEdgeColor);
  const defaultNodeColor = useStore(state => state.defaultNodeColor);

  const [minScore, setMinScore] = React.useState(0);

  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).has('file')) {
      setMinScore(0);
      return;
    }
    const stored = Number(JSON.parse(localStorage.getItem('graphConfig') ?? '{}').minScore) ?? 0;
    setMinScore(stored);
  }, []);

  const edgeDivisions = Math.max(1, Math.round((1 - (minScore ?? 0)) * 10));

  return (
    <Collapsible defaultOpen className='text-xs'>
      <div className='flex w-full items-center justify-between bg-primary p-2'>
        <p className='font-bold text-white'>Legends</p>
        <CollapsibleTrigger asChild>
          <Button type='button' variant='basic' size='icon' className='size-6'>
            <ChevronsUpDownIcon size={15} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className='flex flex-col items-center gap-2 p-8'>
        {selectedRadioNodeColor ? (
          selectedRadioNodeColor === 'Pathway' ? (
            <BinaryLegend />
          ) : selectedRadioNodeColor === 'LogFC' || selectedRadioNodeColor === 'Genetics' ? (
            typeof selectedNodeColorProperty === 'string' && P_VALUE_REGEX.test(selectedNodeColorProperty) ? (
              <HeatmapLegend
                title='P-Value'
                range={[defaultNodeColor, 'red']}
                startLabel='Low Significance'
                endLabel='High Significance'
              />
            ) : (
              <HeatmapLegend
                title={PROPERTY_TYPE_LABEL_MAPPING[selectedRadioNodeColor]}
                domain={[-1, 0, 1]}
                range={['green', '#E2E2E2', 'red']}
                divisions={10}
              />
            )
          ) : selectedRadioNodeColor === 'Druggability' || selectedRadioNodeColor === 'OpenTargets' ? (
            <HeatmapLegend
              title={PROPERTY_TYPE_LABEL_MAPPING[selectedRadioNodeColor]}
              domain={[0, 1]}
              range={[defaultNodeColor, 'red']}
              divisions={10}
            />
          ) : selectedRadioNodeColor === 'TE' ? (
            <HeatmapLegend
              title={PROPERTY_TYPE_LABEL_MAPPING[selectedRadioNodeColor]}
              range={[defaultNodeColor, 'red']}
              startLabel='Low'
              endLabel='High'
            />
          ) : selectedRadioNodeColor === 'OT_Prioritization' ? (
            <HeatmapLegend
              title={PROPERTY_TYPE_LABEL_MAPPING[selectedRadioNodeColor]}
              domain={[-1, 0, 1]}
              range={['red', '#F0C584', 'green']}
              divisions={10}
            />
          ) : (
            <p className='text-center font-semibold'>No Legends Available</p>
          )
        ) : (
          <p className='text-center font-semibold'>Select Data-points on left to view legends!</p>
        )}
        {showEdgeColor && (
          <HeatmapLegend
            title='Edge Color'
            range={['yellow', 'red']}
            domain={[minScore ?? 0, 1]}
            divisions={edgeDivisions}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
