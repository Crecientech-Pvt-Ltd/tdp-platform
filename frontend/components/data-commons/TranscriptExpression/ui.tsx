import { InfoIcon } from 'lucide-react';
import type React from 'react';
import { memo, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { VirtualizedCombobox } from '@/components/VirtualizedCombobox';

interface LoadingStateProps {
  children: React.ReactNode;
}

export function LoadingState({ children }: LoadingStateProps) {
  return (
    <div className='flex min-h-[60vh] items-center justify-center'>
      <div className='text-center text-gray-500'>
        <Spinner />
        <p className='mt-4'>{children}</p>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  children: React.ReactNode;
}

export function EmptyState({ children }: EmptyStateProps) {
  return (
    <div className='flex min-h-[60vh] items-center justify-center'>
      <div className='text-center font-medium text-gray-500 text-lg'>{children}</div>
    </div>
  );
}

interface GroupLegendProps {
  groupToColor: Record<string, string>;
  sampleDataExists: boolean;
}

export const GroupLegend = memo(function GroupLegend({ groupToColor, sampleDataExists }: GroupLegendProps) {
  if (!sampleDataExists) return null;

  const groupNames = Object.keys(groupToColor).sort();
  if (groupNames.length === 0) return null;

  return (
    <div className='flex flex-wrap justify-center gap-4'>
      {groupNames.map(group => (
        <div key={group} className='flex items-center gap-2'>
          <span
            style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              background: groupToColor[group],
              borderRadius: 4,
              border: '1px solid #ccc',
            }}
          />
          <span className='font-medium text-sm'>{group}</span>
        </div>
      ))}
    </div>
  );
});

interface ControlsProps {
  hasGene: boolean;
  hasTranscript: boolean;
  dataSource: 'gene' | 'transcript';
  onDataSourceChange: (checked: boolean) => void;
  geneList: string[];
  selectedGenes: Set<string>;
  onGeneSelection: (value: string | Set<string>) => void;
  onShowSeeMore: () => void;
  isLoading: boolean;
  groupToColor: Record<string, string>;
  sampleDataExists: boolean;
}

export function Controls({
  hasGene,
  hasTranscript,
  dataSource,
  onDataSourceChange,
  geneList,
  selectedGenes,
  onGeneSelection,
  onShowSeeMore,
  isLoading,
  groupToColor,
  sampleDataExists,
}: ControlsProps) {
  const dataSourceToggleId = useId();

  return (
    <div className='min-h-[120px]'>
      <div className='mx-auto mb-6 max-w-4xl'>
        <div className='flex w-full flex-nowrap items-center gap-4'>
          {hasGene && hasTranscript && (
            <div className='flex min-w-fit flex-shrink-0 items-center gap-3'>
              <Label htmlFor={dataSourceToggleId} className='whitespace-nowrap font-medium text-sm'>
                Gene Data
              </Label>
              <Switch
                id={dataSourceToggleId}
                checked={dataSource === 'transcript'}
                onCheckedChange={onDataSourceChange}
                disabled={isLoading}
              />
              <Label htmlFor={dataSourceToggleId} className='whitespace-nowrap font-medium text-sm'>
                Transcript Data
              </Label>
            </div>
          )}
          <div className='flex min-w-0 flex-1 items-center gap-3'>
            <Label className='sr-only'>Select {dataSource === 'gene' ? 'Genes' : 'Transcripts'} (up to 4)</Label>
            <VirtualizedCombobox
              data={geneList}
              value={selectedGenes}
              onChange={onGeneSelection}
              placeholder={`Search and select ${dataSource === 'gene' ? 'genes' : 'transcripts'}...`}
              loading={isLoading}
              className='w-full'
              multiselect={true}
              showSelectedAsChip={true}
              showClearAll={true}
              showSelectAll={false}
            />
          </div>
          <div className='min-w-fit flex-shrink-0'>
            <Button variant='outline' size='sm' onClick={onShowSeeMore} className='flex items-center gap-2'>
              <InfoIcon className='h-4 w-4' />
              Settings
            </Button>
          </div>
        </div>
      </div>

      <div className='flex min-h-[40px] items-center justify-center'>
        <GroupLegend groupToColor={groupToColor} sampleDataExists={sampleDataExists} />
      </div>
    </div>
  );
}

interface NoSelectionStateProps {
  dataSource: 'gene' | 'transcript';
  isLoading: boolean;
}

export function NoSelectionState({ dataSource, isLoading }: NoSelectionStateProps) {
  if (isLoading) return null;

  return (
    <div className='flex min-h-[60vh] items-center justify-center py-12 text-center'>
      <div>
        <p className='mb-4 text-gray-500 text-lg'>
          Select {dataSource === 'gene' ? 'genes' : 'transcripts'} to view their expression data
        </p>
      </div>
    </div>
  );
}
