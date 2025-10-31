'use client';

import { strToU8, zipSync } from 'fflate';
import { DownloadIcon, FileTextIcon, Loader2Icon, PaletteIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multiselect';

type Point = {
  x: number;
  y: number;
  text: string;
  color: string;
};

type GenericRow = Record<string, string | number | null>;

interface DownloadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  availableContrasts: string[];
  processDataForDownload: (contrastName: string) => Promise<{ rawData: GenericRow[]; points: Point[] } | null> | null;
  currentSettings: {
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
}

export default memo(function DownloadPopup({
  isOpen,
  onClose,
  availableContrasts,
  processDataForDownload,
  currentSettings,
  selectedContrasts = [],
  group,
  program,
  project,
}: DownloadPopupProps) {
  const [selectedDataTypes, setSelectedDataTypes] = useState<('red' | 'blue' | 'gray' | 'all')[]>(['all']);
  const [isDownloading, setIsDownloading] = useState(false);

  const availableFiles = useMemo(() => {
    return availableContrasts.map(contrast => {
      if (contrast === 'default') {
        return 'DifferentialExpression.csv';
      }
      return `DifferentialExpression-${contrast}.csv`;
    });
  }, [availableContrasts]);

  const [selectedFiles, setSelectedFiles] = useState<string[]>(availableFiles);

  const dataTypeOptions = useMemo(
    () => [
      { label: 'Red Points (Upregulated)', value: 'red' },
      { label: 'Blue Points (Downregulated)', value: 'blue' },
      { label: 'Gray Points (Non-significant)', value: 'gray' },
      { label: 'All Points', value: 'all' },
    ],
    [],
  );

  useEffect(() => {
    if (isOpen && selectedContrasts.length > 0) {
      const autoSelectedFiles = selectedContrasts.map(contrast => {
        if (contrast === 'default') {
          return 'DifferentialExpression.csv';
        }
        return `DifferentialExpression-${contrast}.csv`;
      });
      setSelectedFiles(autoSelectedFiles);
    } else if (isOpen) {
      setSelectedFiles(availableFiles);
    } else {
      setSelectedFiles([]);
      setSelectedDataTypes(['all']);
      setIsDownloading(false);
    }
  }, [isOpen, selectedContrasts, availableFiles]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
      setSelectedDataTypes(['all']);
      setIsDownloading(false);
    }
  }, [isOpen]);

  const getContrastFromFileName = useCallback((fileName: string): string => {
    if (fileName === 'DifferentialExpression.csv') {
      return 'default';
    }
    const match = fileName.match(/DifferentialExpression-(.+)\.csv/);
    return match ? match[1] : 'default';
  }, []);

  const createCSVContent = useCallback((data: GenericRow[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          })
          .join(','),
      ),
    ].join('\n');

    return csvContent;
  }, []);

  const handleFileChange = useCallback((files: string[]) => {
    setSelectedFiles(files);
  }, []);

  const handleDataTypeChange = useCallback((dataTypes: string[]) => {
    setSelectedDataTypes(dataTypes as ('red' | 'blue' | 'gray' | 'all')[]);
  }, []);

  const handleDownload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to download.');
      return;
    }

    if (selectedDataTypes.length === 0) {
      alert('Please select at least one contrast type to download.');
      return;
    }

    setIsDownloading(true);

    try {
      const files: Record<string, Uint8Array> = {};

      for (const fileName of selectedFiles) {
        const contrast = getContrastFromFileName(fileName);
        const result = await processDataForDownload(contrast);
        if (!result) {
          console.warn(`No data found for file: ${fileName}`);
          continue;
        }

        const { rawData, points } = result;
        const base = fileName.replace(/\.csv$/, '');

        for (const dataType of selectedDataTypes) {
          let rows: GenericRow[] = [];
          let suffix = '';

          if (dataType === 'all') {
            rows = rawData;
            suffix = 'all_points';
          } else {
            rows = rawData.filter((_, i) => points[i]?.color === dataType);
            if (rows.length === 0) continue;
            suffix = dataType === 'red' ? 'red_points' : dataType === 'blue' ? 'blue_points' : 'gray_points';
          }

          if (rows.length > 0) {
            const outName = `${base}_${suffix}.csv`;
            files[outName] = strToU8(createCSVContent(rows));
          }
        }
      }

      const metadata = {
        selectedFiles,
        dataTypes: selectedDataTypes,
        settings: currentSettings,
        totalFiles: selectedFiles.length * selectedDataTypes.length,
        group,
        program,
        project,
      };
      files['download_metadata.json'] = strToU8(JSON.stringify(metadata, null, 2));

      const zippedBuffer = zipSync(files);
      const zippedArrayBuffer =
        zippedBuffer.buffer instanceof ArrayBuffer ? zippedBuffer.buffer : zippedBuffer.slice().buffer; // fallback, but zipSync should return ArrayBuffer-backed Uint8Array
      const blob = new Blob([zippedArrayBuffer], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const aElement = document.createElement('a');
      aElement.href = url;
      aElement.download = `DE-${project}-data.zip`;
      aElement.click();
      URL.revokeObjectURL(url);
      aElement.remove();

      onClose();
    } catch (error) {
      console.error('Error creating download:', error);
      alert('Error creating download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [
    selectedFiles,
    selectedDataTypes,
    getContrastFromFileName,
    processDataForDownload,
    createCSVContent,
    currentSettings,
    onClose,
    group,
    program,
    project,
  ]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const totalFilesCount = selectedFiles.length * selectedDataTypes.length;

  return (
    <Dialog open={isOpen}>
      <DialogContent className='flex max-h-[90vh] w-[95vw] max-w-5xl flex-col shadow-2xl'>
        <div className='mb-1 border-b pb-4'>
          <DialogTitle className='mb-1 flex items-center gap-3 font-bold text-2xl'>
            <div className='rounded-lg bg-muted p-2'>
              <DownloadIcon className='size-6' />
            </div>
            Download Volcano Plot Data
          </DialogTitle>
          <p className='text-muted-foreground'>Export your differential expression analysis results</p>
        </div>

        <div className='grow overflow-y-auto px-1 py-1'>
          {isDownloading ? (
            <div className='flex items-center justify-center py-16'>
              <div className='text-center'>
                <div className='relative mb-4'>
                  <div className='mx-auto size-16 animate-spin rounded-full border-4 border-muted border-t-foreground'></div>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <DownloadIcon className='size-6' />
                  </div>
                </div>
                <h3 className='mb-1 font-semibold text-xl'>Creating Download Package</h3>
                <p className='text-muted-foreground'>Please wait while we prepare your files...</p>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='rounded-xl border bg-background shadow-sm'>
                <div className='rounded-t-xl border-b bg-muted/30 px-6 py-3'>
                  <div className='flex items-center gap-3'>
                    <div className='rounded-lg border bg-background p-2'>
                      <FileTextIcon className='size-5' />
                    </div>
                    <div>
                      <Label className='font-semibold text-lg'>Differential Expression Files</Label>
                    </div>
                  </div>
                </div>

                <div className='space-y-3 p-4'>
                  <div className='mb-2 flex items-center gap-2'>
                    <div className='size-3 rounded-full bg-foreground'></div>
                    <span className='font-medium text-sm'>
                      Selected: <span className='font-bold'>{selectedFiles.length}</span> of {availableFiles.length}{' '}
                      files
                    </span>
                  </div>
                  <MultiSelect
                    options={availableFiles.map(file => ({
                      label: file,
                      value: file,
                    }))}
                    selectedValues={selectedFiles}
                    onChange={handleFileChange}
                    placeholder='Select Differential Expression files'
                    className='w-full'
                  />
                </div>
              </div>

              <div className='rounded-xl border bg-background shadow-sm'>
                <div className='rounded-t-xl border-b bg-muted/30 px-6 py-3'>
                  <div className='flex items-center gap-3'>
                    <div className='rounded-lg border bg-background p-2'>
                      <PaletteIcon className='size-5' />
                    </div>
                    <div>
                      <Label className='font-semibold text-lg'>Data Categories</Label>
                    </div>
                  </div>
                </div>

                <div className='space-y-3 p-4'>
                  {selectedDataTypes.length > 0 && (
                    <div className='mb-3 rounded-lg border bg-muted/50 p-3'>
                      <div className='flex flex-wrap gap-2'>
                        {selectedDataTypes.map(type => (
                          <span
                            key={type}
                            className={`flex items-center gap-2 rounded-full border px-3 py-2 font-medium text-sm ${
                              type === 'red'
                                ? 'border-red-200 bg-red-50 text-red-700'
                                : type === 'blue'
                                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                                  : type === 'gray'
                                    ? 'border-gray-200 bg-gray-50 text-gray-700'
                                    : 'border-border bg-muted text-muted-foreground'
                            }`}
                          >
                            <div
                              className={`size-3 rounded-full ${
                                type === 'red'
                                  ? 'bg-red-500'
                                  : type === 'blue'
                                    ? 'bg-blue-500'
                                    : type === 'gray'
                                      ? 'bg-gray-500'
                                      : 'bg-foreground'
                              }`}
                            ></div>
                            {type === 'red'
                              ? 'Upregulated'
                              : type === 'blue'
                                ? 'Downregulated'
                                : type === 'gray'
                                  ? 'Non-significant'
                                  : 'All Points'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <MultiSelect
                    options={dataTypeOptions}
                    selectedValues={selectedDataTypes}
                    onChange={handleDataTypeChange}
                    placeholder='Select data categories to download'
                    className='w-full'
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='mt-2 flex-col justify-end gap-3 border-t pt-4 sm:flex-row'>
          <DialogClose asChild>
            <Button onClick={handleClose} variant='outline' disabled={isDownloading} className='w-full sm:w-auto'>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleDownload}
            disabled={selectedFiles.length === 0 || selectedDataTypes.length === 0 || isDownloading}
            className='w-full shadow-sm sm:w-auto'
          >
            {isDownloading ? (
              <>
                <Loader2Icon className='size-4 animate-spin' />
                Creating ZIP...
              </>
            ) : (
              <>
                <DownloadIcon className='size-4' />
                Download {totalFilesCount > 0 && `(${totalFilesCount} files)`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
