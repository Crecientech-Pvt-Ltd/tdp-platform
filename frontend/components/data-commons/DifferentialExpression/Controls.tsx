import React from 'react';
import { MultiSelect } from '@/components/ui/multiselect';
import { VirtualizedCombobox } from '@/components/VirtualizedCombobox';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
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
      <div className='bg-gray-50 rounded-lg p-2 border'>
        <div className='flex flex-wrap items-center gap-2 sm:gap-3 text-sm'>
          {showDropdown && (
            <div className='flex items-center gap-1 sm:gap-2 min-w-0'>
              <label className='text-xs font-medium text-gray-700 whitespace-nowrap'>Contrasts:</label>
              <div className='w-40 sm:w-52 md:w-64 lg:w-80 xl:w-96 relative z-10 min-w-0'>
                <MultiSelect
                  options={multiSelectOptions}
                  selectedValues={selectedContrasts}
                  onChange={onContrastChange}
                  placeholder='Select...'
                  className='text-xs w-full'
                />
              </div>
            </div>
          )}

          <div className='flex items-center gap-2 sm:gap-3'>
            <div className='flex items-center gap-1'>
              <label className='text-xs font-medium text-gray-700 whitespace-nowrap'>X:</label>
              <input
                type='number'
                value={thresholds.xInput}
                onChange={e => thresholds.updateXThreshold(e.target.value)}
                onBlur={thresholds.resetXThreshold}
                className='border px-1 py-0.5 w-12 sm:w-16 text-center rounded text-xs'
              />
            </div>

            <div className='flex items-center gap-1'>
              <label className='text-xs font-medium text-gray-700 whitespace-nowrap'>Y:</label>
              <input
                type='number'
                value={thresholds.yInput}
                onChange={e => thresholds.updateYThreshold(e.target.value)}
                onBlur={thresholds.resetYThreshold}
                className='border px-1 py-0.5 w-12 sm:w-16 text-center rounded text-xs'
              />
            </div>
          </div>

          {availableGenes.length > 0 && (
            <div className='flex items-center gap-1 sm:gap-2 min-w-0 flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg'>
              <label className='text-xs font-medium text-gray-700 whitespace-nowrap'>Genes:</label>
              <div className='w-full relative z-10 min-w-0'>
                <VirtualizedCombobox
                  data={availableGenes}
                  value={selectedGenes}
                  onChange={value => onGenesChange(value as Set<string>)}
                  placeholder='Search...'
                  multiselect={true}
                  showSelectedAsChip={true}
                  showSelectAll={false}
                  showClearAll={true}
                  className='text-xs w-full'
                  width='100%'
                />
              </div>
            </div>
          )}

          <div className='ml-auto'>
            <Button
              onClick={onShowSettings}
              variant='outline'
              size='sm'
              className='flex items-center gap-1 h-6 sm:h-7 px-2'
            >
              <Info className='h-3 w-3' />
              <span className='text-xs hidden sm:inline'>Settings</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};