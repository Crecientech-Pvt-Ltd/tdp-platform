'use client';

import { DownloadIcon, EyeIcon } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DownloadPopup, { type DownloadFile } from './DownloadPopup';
import FilePreviewModal from './FilePreviewModal';

type AxisConfig = {
  enabled?: boolean;
  options?: string[];
  axisColumns?: string[];
  currentX?: string;
  currentY?: string;
  onAxisChange?: (xAxis: string, yAxis: string) => void;
  onChange?: (xAxis: string, yAxis: string) => void;
  xLabel?: string;
  yLabel?: string;
  title?: string;
};

type SampleMappingConfig = {
  enabled?: boolean;
  availableColumns?: string[];
  currentSampleColumn?: string;
  currentGroupColumn?: string;
  onColumnChange?: (sampleColumn: string, groupColumn: string) => void;
  onChange?: (sampleColumn: string, groupColumn: string) => void;
  title?: string;
  sampleHelpText?: string;
  groupHelpText?: string;
};

type DownloadConfig = {
  files: DownloadFile[];
  metadata?: Record<string, unknown>;
  zipName?: string;
  title?: string;
  buttonLabel?: string;
};

interface SeeMoreProps {
  isOpen: boolean;
  onClose: () => void;

  axis?: AxisConfig;
  mapping?: SampleMappingConfig;
  sampleMapping?: SampleMappingConfig;

  title?: string;

  download?: DownloadConfig;
  hideDownloadButton?: boolean;
}

type DownloadMetadata = {
  group?: string;
  program?: string;
  project?: string;
  [key: string]: unknown;
};

export default function SeeMore({
  isOpen,
  onClose,
  axis,
  mapping: mappingProp,
  sampleMapping: sampleMappingProp,
  title = 'Configuration & Data Information',
  download,
  hideDownloadButton = false,
}: SeeMoreProps) {
  const mapping = mappingProp ?? sampleMappingProp;

  const axisOptions = (axis?.options ?? axis?.axisColumns ?? []).filter(col => col && col.trim() !== '');
  const axisEnabled = !!axis?.enabled && axisOptions.length > 0;

  const mappingAvailableCols = (mapping?.availableColumns ?? []).filter(col => col !== undefined && col !== null);
  const mappingEnabled = !!mapping?.enabled || mappingAvailableCols.length > 0;

  const canDownload = !!download && !!download.files?.length;

  const [selectedXAxis, setSelectedXAxis] = React.useState(axis?.currentX ?? '');
  const [selectedYAxis, setSelectedYAxis] = React.useState(axis?.currentY ?? '');
  const [selectedSampleColumn, setSelectedSampleColumn] = React.useState(mapping?.currentSampleColumn ?? '');
  const [selectedGroupColumn, setSelectedGroupColumn] = React.useState(mapping?.currentGroupColumn ?? '');
  const [showDownloadPopup, setShowDownloadPopup] = React.useState(false);

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewFileIndex, setPreviewFileIndex] = React.useState(0);

  const previewableFiles = (download?.files ?? []).filter(
    (f: DownloadFile) =>
      typeof f.name === 'string' &&
      (typeof f.url === 'string' || typeof f.content === 'string') &&
      (f.name.toLowerCase().endsWith('.csv') ||
        f.name.toLowerCase().endsWith('.tsv') ||
        f.name.toLowerCase().endsWith('.txt')),
  );
  const metadata = (download?.metadata ?? {}) as DownloadMetadata;
  const group = typeof metadata.group === 'string' ? metadata.group : '';
  const program = typeof metadata.program === 'string' ? metadata.program : '';
  const project = typeof metadata.project === 'string' ? metadata.project : '';

  const handlePreviewFiles = () => {
    if (previewableFiles.length > 0) {
      setPreviewFileIndex(0);
      setPreviewOpen(true);
    }
  };

  const handleNextPreview = () => {
    setPreviewFileIndex(prev => (prev + 1) % previewableFiles.length);
  };

  const handlePrevPreview = () => {
    setPreviewFileIndex(prev => (prev - 1 + previewableFiles.length) % previewableFiles.length);
  };

  React.useEffect(() => {
    if (isOpen) {
      setSelectedXAxis(axis?.currentX ?? '');
      setSelectedYAxis(axis?.currentY ?? '');
      setSelectedSampleColumn(mapping?.currentSampleColumn ?? '');
      setSelectedGroupColumn(mapping?.currentGroupColumn ?? '');
    }
  }, [isOpen, axis?.currentX, axis?.currentY, mapping?.currentSampleColumn, mapping?.currentGroupColumn]);

  const handleApply = () => {
    if (mapping?.onChange || mapping?.onColumnChange) {
      (mapping.onChange ?? mapping.onColumnChange)?.(selectedSampleColumn, selectedGroupColumn);
    }
    if (axis?.onChange || axis?.onAxisChange) {
      (axis.onChange ?? axis.onAxisChange)?.(selectedXAxis, selectedYAxis);
    }
    onClose();
  };

  const handleCancel = () => {
    setSelectedXAxis(axis?.currentX ?? '');
    setSelectedYAxis(axis?.currentY ?? '');
    setSelectedSampleColumn(mapping?.currentSampleColumn ?? '');
    setSelectedGroupColumn(mapping?.currentGroupColumn ?? '');
    onClose();
  };

  const getColumnDisplayName = (column: string, index: number) => {
    if (!column || column.trim() === '') {
      return index === 0 ? 'First Column' : `Column ${index + 1}`;
    }
    return column;
  };

  const getColumnValue = (column: string, index: number) => {
    if (!column || column.trim() === '') {
      return `col_${index}`;
    }
    return column;
  };

  return (
    <>
      <Dialog open={isOpen}>
        <DialogContent className='flex max-h-[90vh] w-[95vw] max-w-4xl flex-col'>
          <DialogTitle className='font-semibold text-xl'>{title}</DialogTitle>

          <div className='grow overflow-y-auto px-1 py-4'>
            <div className='space-y-8'>
              {axisEnabled && (
                <div className='rounded-lg border bg-muted/30 p-6'>
                  <h3 className='mb-4 font-semibold text-lg text-primary'>{axis?.title ?? 'Axis Configuration'}</h3>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <div className='space-y-3'>
                      <Label className='font-medium text-base'>{axis?.xLabel ?? 'X-Axis Column'}</Label>
                      <Select value={selectedXAxis} onValueChange={setSelectedXAxis}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select X-axis column' />
                        </SelectTrigger>
                        <SelectContent>
                          {axisOptions.map((col, idx) => {
                            const columnValue = getColumnValue(col, idx);
                            return (
                              <SelectItem key={columnValue} value={columnValue}>
                                <span className='font-medium'>{col || `Column ${idx + 1}`}</span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {selectedXAxis && (
                        <p className='text-muted-foreground text-sm'>Currently mapping to: {selectedXAxis}</p>
                      )}
                    </div>

                    <div className='space-y-3'>
                      <Label className='font-medium text-base'>{axis?.yLabel ?? 'Y-Axis Column'}</Label>
                      <Select value={selectedYAxis} onValueChange={setSelectedYAxis}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select Y-axis column' />
                        </SelectTrigger>
                        <SelectContent>
                          {axisOptions.map((col, idx) => {
                            const columnValue = getColumnValue(col, idx);
                            return (
                              <SelectItem key={columnValue} value={columnValue}>
                                <span className='font-medium'>{col || `Column ${idx + 1}`}</span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {selectedYAxis && (
                        <p className='text-muted-foreground text-sm'>Currently mapping to: {selectedYAxis}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {mappingEnabled && (
                <div className='rounded-lg border bg-muted/30 p-6'>
                  <h3 className='mb-4 font-semibold text-lg text-primary'>
                    {mapping?.title ?? 'Sample to Group Mapping'}
                  </h3>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <div className='space-y-3'>
                      <Label className='font-medium text-base'>Sample Column</Label>
                      <Select value={selectedSampleColumn} onValueChange={setSelectedSampleColumn}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select sample column' />
                        </SelectTrigger>
                        <SelectContent>
                          {mappingAvailableCols.map((column, index) => {
                            const columnValue = getColumnValue(column, index);
                            return (
                              <SelectItem key={columnValue} value={columnValue}>
                                <span className='font-medium'>{getColumnDisplayName(column, index)}</span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <p className='text-muted-foreground text-sm'>
                        {mapping?.sampleHelpText ?? 'Column containing sample identifiers. Default: First column'}
                      </p>
                    </div>

                    <div className='space-y-3'>
                      <Label className='font-medium text-base'>Group Column</Label>
                      <Select value={selectedGroupColumn} onValueChange={setSelectedGroupColumn}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select group column' />
                        </SelectTrigger>
                        <SelectContent>
                          {mappingAvailableCols.map((column, index) => {
                            const columnValue = getColumnValue(column, index);
                            return (
                              <SelectItem key={columnValue} value={columnValue}>
                                <span className='font-medium'>{getColumnDisplayName(column, index)}</span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <p className='text-muted-foreground text-sm'>
                        {mapping?.groupHelpText ?? 'Column containing group assignments. Default: Last column'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className='flex-col justify-between gap-2 border-t pt-4 sm:flex-row'>
            <div className='order-1 flex w-full gap-2 sm:w-auto'>
              {canDownload && (
                <>
                  {!hideDownloadButton && (
                    <Button
                      onClick={() => setShowDownloadPopup(true)}
                      variant='outline'
                      className='flex items-center gap-2'
                    >
                      <DownloadIcon className='size-4' />
                      {download?.buttonLabel ?? 'Download Data'}
                    </Button>
                  )}
                  <Button
                    onClick={handlePreviewFiles}
                    variant='outline'
                    className='flex items-center gap-2'
                    disabled={previewableFiles.length === 0}
                  >
                    <EyeIcon className='size-4' />
                    Preview Files
                  </Button>
                </>
              )}
            </div>

            <div className='order-2 flex w-full gap-2 sm:w-auto'>
              <DialogClose asChild>
                <Button type='button' variant='secondary' onClick={handleCancel} className='w-full sm:w-auto'>
                  Cancel
                </Button>
              </DialogClose>
              <Button onClick={handleApply} className='w-full bg-primary text-white hover:bg-primary/90 sm:w-auto'>
                Apply Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {download && (
        <DownloadPopup
          isOpen={showDownloadPopup}
          onClose={() => setShowDownloadPopup(false)}
          files={download.files}
          metadata={download.metadata}
          zipName={download.zipName}
        />
      )}

      <FilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        filename={
          typeof previewableFiles[previewFileIndex]?.name === 'string' ? previewableFiles[previewFileIndex]?.name : ''
        }
        group={group}
        program={program}
        project={project}
        uploadedContent={
          previewableFiles[previewFileIndex] && 'content' in previewableFiles[previewFileIndex]
            ? (previewableFiles[previewFileIndex] as { content: string }).content
            : undefined
        }
        multiple={previewableFiles.length > 1}
        onNext={handleNextPreview}
        onPrev={handlePrevPreview}
        fileIndex={previewFileIndex}
        fileCount={previewableFiles.length}
      />
    </>
  );
}
