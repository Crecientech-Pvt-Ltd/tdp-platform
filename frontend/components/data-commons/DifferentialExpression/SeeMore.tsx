'use client';

import React, { useState, memo, useMemo } from 'react';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download } from 'lucide-react';
import DownloadPopup from './DownloadPopup';
import FilePreviewModal from '../common/FilePreviewModal';
import { Eye } from 'lucide-react';

interface DataFile {
  filename: string;
  description: string;
  xDescription: string;
  yDescription: string;
  columns?: string[];
  [key: string]: string | string[] | undefined;
}

type Point = {
  x: number;
  y: number;
  text: string;
  color: string;
};

type GenericRow = Record<string, string | number | null>;

interface SeeMoreProps {
  isOpen: boolean;
  onClose: () => void;
  dataFiles: DataFile[];
  currentXColumn: string;
  currentYColumn: string;
  onColumnChange: (xColumn: string, yColumn: string) => void;
  changeUseOfLog: (logUsage: boolean) => void;
  isLogUsed: boolean;
  availableContrasts?: string[];
  processDataForDownload?: (contrastName: string) => Promise<{ rawData: GenericRow[]; points: Point[] } | null> | null;
  currentSettings?: {
    xThreshold: number;
    yThreshold: number;
    useLog: boolean;
    xAxisColumn: string;
    yAxisColumn: string;
  };
  selectedContrasts?: string[];
  group: string;
  program: string;
  project: string;
  deFiles?: Record<string, string>;
}

export default memo(function SeeMore({
  isOpen,
  onClose,
  dataFiles,
  currentXColumn,
  currentYColumn,
  onColumnChange,
  changeUseOfLog,
  isLogUsed,
  availableContrasts = [],
  processDataForDownload,
  currentSettings,
  selectedContrasts = [],
  group,
  program,
  project,
  deFiles,
}: SeeMoreProps) {
  const [selectedXColumn, setSelectedXColumn] = useState(currentXColumn);
  const [selectedYColumn, setSelectedYColumn] = useState(currentYColumn);
  const [logEnabled, setLogEnabled] = useState(isLogUsed);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFileIndex, setPreviewFileIndex] = useState(0);

  const allColumns = useMemo(() => {
    const columnSet = new Set<string>();
    for (const file of dataFiles) {
      if (file.columns) {
        for (const col of file.columns) {
          if (col.trim() !== '') {
            columnSet.add(col);
          }
        }
      }
    }
    return Array.from(columnSet).sort();
  }, [dataFiles]);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedXColumn(currentXColumn);
      setSelectedYColumn(currentYColumn);
      setLogEnabled(isLogUsed);
    }
  }, [isOpen, currentXColumn, currentYColumn, isLogUsed]);

  const handleApplyChanges = () => {
    onColumnChange(selectedXColumn, selectedYColumn);
    changeUseOfLog(logEnabled);
    onClose();
  };

  const handleCancel = () => {
    setSelectedXColumn(currentXColumn);
    setSelectedYColumn(currentYColumn);
    setLogEnabled(isLogUsed);
    onClose();
  };

  const handleLogChange = (checked: boolean) => {
    setLogEnabled(checked);
  };

  const previewableFiles = dataFiles.filter(f => f.filename);

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

  return (
    <>
      <Dialog open={isOpen}>
        <DialogContent className='max-w-4xl w-[95vw] max-h-[90vh] flex flex-col'>
          <DialogTitle className='text-xl font-semibold'>Plot Configuration & Data Information</DialogTitle>
          <div className='flex-grow overflow-y-auto px-1 py-4'>
            <div className='space-y-8'>
              <div className='bg-muted/30 rounded-lg p-6 border'>
                <h3 className='text-lg font-semibold mb-4 text-primary'>Axis Configuration</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-3'>
                    <Label className='text-base font-medium'>X-Axis Column</Label>
                    <Select value={selectedXColumn} onValueChange={setSelectedXColumn}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select X-axis column' />
                      </SelectTrigger>
                      <SelectContent>
                        {allColumns.map(column => (
                          <SelectItem key={column} value={column || 'default'}>
                            <span className='font-medium'>{column}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className='text-sm text-muted-foreground'>
                      Currently mapping to: <span className='font-medium'>{selectedXColumn}</span>
                    </p>
                  </div>

                  <div className='space-y-3'>
                    <Label className='text-base font-medium'>Y-Axis Column</Label>
                    <Select value={selectedYColumn} onValueChange={setSelectedYColumn}>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select Y-axis column' />
                      </SelectTrigger>
                      <SelectContent>
                        {allColumns.map(column => (
                          <SelectItem key={column} value={column || 'default'}>
                            <span className='font-medium'>{column}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className='text-sm text-muted-foreground'>
                      Currently mapping to: <span className='font-medium'>{selectedYColumn}</span>
                    </p>
                  </div>
                </div>

                <div className='mt-6 pt-4 border-t'>
                  <div className='flex items-center space-x-2'>
                    <Checkbox id='log-scale' checked={logEnabled} onCheckedChange={handleLogChange} />
                    <Label htmlFor='log-scale' className='text-base font-medium cursor-pointer'>
                      Use logarithmic scale
                    </Label>
                  </div>
                  <p className='text-sm text-muted-foreground mt-1 ml-6'>
                    Apply logarithmic transformation to the Y-Axis data for better visualization of exponential
                    relationships
                  </p>

                  {logEnabled && (
                    <div className='mt-4 ml-6 p-4 bg-muted/20 rounded-lg border'>
                      <Label className='text-sm font-medium'>Zero Value Handling (Log Scale)</Label>
                      <p className='text-xs text-muted-foreground mt-1'>
                        Zero and negative values in the Y-axis column are automatically replaced with the minimum
                        non-zero value from the dataset to ensure all points remain visible in log transformation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className='gap-2 flex-col sm:flex-row justify-between border-t pt-4'>
            <div className='flex gap-2 order-1 w-full sm:w-auto'>
              {availableContrasts.length > 0 && processDataForDownload && currentSettings && (
                <>
                  <Button
                    onClick={() => setShowDownloadPopup(true)}
                    variant='outline'
                    className='flex items-center gap-2'
                  >
                    <Download className='h-4 w-4' />
                    Download Data
                  </Button>
                  <Button
                    onClick={handlePreviewFiles}
                    variant='outline'
                    className='flex items-center gap-2'
                    disabled={previewableFiles.length === 0}
                  >
                    <Eye className='h-4 w-4' />
                    Preview Files
                  </Button>
                </>
              )}
            </div>

            <div className='flex gap-2 order-2 w-full sm:w-auto'>
              <DialogClose asChild>
                <Button type='button' variant='secondary' onClick={handleCancel} className='w-full sm:w-auto'>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleApplyChanges}
                className='bg-primary text-white hover:bg-primary/90 w-full sm:w-auto'
              >
                Apply Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {availableContrasts.length > 0 && processDataForDownload && currentSettings && (
        <DownloadPopup
          isOpen={showDownloadPopup}
          onClose={() => setShowDownloadPopup(false)}
          availableContrasts={availableContrasts}
          processDataForDownload={processDataForDownload}
          currentSettings={currentSettings}
          selectedContrasts={selectedContrasts}
          group={group}
          program={program}
          project={project}
        />
      )}

      <FilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        filename={previewableFiles[previewFileIndex]?.filename || ''}
        group={group}
        program={program}
        project={project}
        uploadedContent={
          previewableFiles[previewFileIndex]?.filename && deFiles
            ? deFiles[previewableFiles[previewFileIndex].filename]
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
});
