import { InfoIcon } from 'lucide-react';
import type React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multiselect';
import { VirtualizedCombobox } from '@/components/VirtualizedCombobox';
import type { ThresholdControls } from './types';

interface VolcanoPlotControlsProps {
  showDropdown: boolean;
  availableContrasts: string[];
  selectedContrasts: string[];
  onContrastChange: (values: string[]) => void;
  thresholds: ThresholdControls;
  availableGenes: string[];
  selectedGenes: Set<string>;
  onGenesChange: (genes: Set<string>) => void;
  onShowSettings: () => void;
}

export const VolcanoPlotControls: React.FC<VolcanoPlotControlsProps> = ({
  showDropdown,
  availableContrasts,
  selectedContrasts,
  onContrastChange,
  thresholds,
  availableGenes,
  selectedGenes,
  onGenesChange,
  onShowSettings,
}) => {
  const multiSelectOptions = availableContrasts
    .filter(c => c !== 'default')
    .map(contrast => ({
      label: contrast.toUpperCase(),
      value: contrast,
    }));

  return (
    <div className='mb-1'>
      <div className='rounded-lg border bg-gray-50 p-2 sm:p-3'>
        <div className='flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-3'>
          {showDropdown && (
            <div className='flex min-w-0 items-center gap-1 sm:gap-2'>
              <Label className='shrink-0 whitespace-nowrap font-medium text-gray-700 text-xs'>Contrasts:</Label>
              <div className='relative z-10 min-w-0 flex-1 sm:w-52 sm:flex-none md:w-64 lg:w-80 xl:w-96'>
                <MultiSelect
                  options={multiSelectOptions}
                  selectedValues={selectedContrasts}
                  onChange={onContrastChange}
                  placeholder='Select...'
                  className='w-full text-xs'
                />
              </div>
            </div>
          )}

          <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
            <div className='flex items-center gap-1'>
              <Label className='whitespace-nowrap font-medium text-gray-700 text-xs'>X:</Label>
              <input
                type='number'
                value={thresholds.xInput}
                onChange={e => thresholds.updateXThreshold(e.target.value)}
                onBlur={thresholds.resetXThreshold}
                className='w-14 rounded border px-1 py-0.5 text-center text-xs sm:w-16'
              />
            </div>

            <div className='flex items-center gap-1'>
              <Label className='whitespace-nowrap font-medium text-gray-700 text-xs'>Y:</Label>
              <input
                type='number'
                value={thresholds.yInput}
                onChange={e => thresholds.updateYThreshold(e.target.value)}
                onBlur={thresholds.resetYThreshold}
                className='w-14 rounded border px-1 py-0.5 text-center text-xs sm:w-16'
              />
            </div>
          </div>

          {availableGenes.length > 0 && (
            <div className='flex min-w-0 items-center gap-1 sm:flex-1 sm:gap-2 lg:max-w-lg'>
              <Label className='shrink-0 whitespace-nowrap font-medium text-gray-700 text-xs'>Genes:</Label>
              <div className='relative z-10 min-w-0 flex-1'>
                <VirtualizedCombobox
                  data={availableGenes}
                  value={selectedGenes}
                  onChange={value => onGenesChange(value as Set<string>)}
                  placeholder='Search...'
                  multiselect={true}
                  showSelectedAsChip={true}
                  showSelectAll={false}
                  showClearAll={true}
                  className='w-full text-xs'
                  width='100%'
                />
              </div>
            </div>
          )}

          <div className='sm:ml-auto'>
            <Button
              onClick={onShowSettings}
              variant='outline'
              size='sm'
              className='flex h-7 w-full items-center justify-center gap-1 px-2 sm:h-7 sm:w-auto'
            >
              <InfoIcon className='size-3' />
              <span className='text-xs'>Settings</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
