'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multiselect';
import { Download, Loader2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import JSZip from 'jszip';
import FlexibleLabelList from '@/components/RenderLabel';

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
    cutoff: number;
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

export default function DownloadPopup({
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
      { label: 'Red Points', value: 'red' },
      { label: 'Blue Points', value: 'blue' },
      { label: 'Gray Points', value: 'gray' },
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
      const zip = new JSZip();

      for (const fileName of selectedFiles) {
        const contrast = getContrastFromFileName(fileName);
        const result = await processDataForDownload(contrast);

        if (!result) {
          console.warn(`No data found for file: ${fileName}`);
          continue;
        }

        const { rawData, points } = result;

        for (const dataType of selectedDataTypes) {
          let dataToDownload: GenericRow[] = [];
          let outputFileName = '';

          switch (dataType) {
            case 'red':
              const redIndices = points
                .map((point, index) => (point.color === 'red' ? index : -1))
                .filter(i => i !== -1);
              dataToDownload = redIndices.map(i => rawData[i]);
              outputFileName = `${fileName.replace('.csv', '')}_red_points.csv`;
              break;
            case 'blue':
              const blueIndices = points
                .map((point, index) => (point.color === 'blue' ? index : -1))
                .filter(i => i !== -1);
              dataToDownload = blueIndices.map(i => rawData[i]);
              outputFileName = `${fileName.replace('.csv', '')}_blue_points.csv`;
              break;
            case 'gray':
              const grayIndices = points
                .map((point, index) => (point.color === 'gray' ? index : -1))
                .filter(i => i !== -1);
              dataToDownload = grayIndices.map(i => rawData[i]);
              outputFileName = `${fileName.replace('.csv', '')}_gray_points.csv`;
              break;
            case 'all':
              dataToDownload = rawData;
              outputFileName = `${fileName.replace('.csv', '')}_all_points.csv`;
              break;
          }

          if (dataToDownload.length > 0) {
            zip.file(outputFileName, createCSVContent(dataToDownload));
          }
        }
      }

      const metadata = {
        selectedFiles: selectedFiles,
        dataTypes: selectedDataTypes,
        settings: currentSettings,
        generatedAt: new Date().toISOString(),
        totalFiles: selectedFiles.length * selectedDataTypes.length,
        group,
        program,
        project,
      };

      zip.file('download_metadata.json', JSON.stringify(metadata, null, 2));

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DE-${project}-data.zip`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

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

  return (
    <Dialog open={isOpen}>
      <DialogContent className='max-w-4xl w-[95vw] max-h-[90vh] flex flex-col'>
        <DialogTitle className='text-xl font-semibold'>Download Volcano Plot Data</DialogTitle>

        <div className='flex-grow overflow-y-auto px-1 py-4'>
          {isDownloading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center text-gray-500'>
                <Spinner className='mx-auto mb-4' />
                Creating download package...
              </div>
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='bg-muted/30 rounded-lg p-6 border'>
                <div className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-start'>
                    <div className='md:col-span-1 flex items-center justify-center min-h-[60px]'>
                      <Label className='text-base font-semibold'>Differential Expression Files</Label>
                    </div>
                    <div className='md:col-span-3 flex flex-col gap-3'>
                      <div className='flex flex-col gap-2'>
                        <span className='text-sm text-muted-foreground'>
                          <strong>{selectedFiles.length > 0 ? `${selectedFiles.length} files` : 'None'}</strong>
                        </span>
                        <FlexibleLabelList labels={selectedFiles} rowsToShow={availableFiles.length} truncateX={true} />
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
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-start'>
                    <div className='md:col-span-1 flex items-center justify-center min-h-[60px]'>
                      <Label className='text-base font-semibold'>Contrast Types</Label>
                    </div>
                    <div className='md:col-span-3 flex flex-col gap-3'>
                      <div className='flex flex-col gap-2'>
                        <span className='text-sm text-muted-foreground'>
                          <strong>{selectedDataTypes.length > 0 ? `${selectedDataTypes.length} types` : 'None'}</strong>
                        </span>
                        {selectedDataTypes.length > 0 && (
                          <div className='max-h-20 overflow-y-auto bg-muted/50 rounded-md p-2 border'>
                            <div className='flex flex-wrap gap-1'>
                              {selectedDataTypes.map((type, index) => (
                                <span
                                  key={index}
                                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                                    type === 'red'
                                      ? 'bg-red-100 text-red-700'
                                      : type === 'blue'
                                        ? 'bg-blue-100 text-blue-700'
                                        : type === 'gray'
                                          ? 'bg-gray-100 text-gray-700'
                                          : 'bg-gradient-to-r from-red-100 via-blue-100 to-gray-100 text-gray-700'
                                  }`}
                                >
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      type === 'red'
                                        ? 'bg-red-500'
                                        : type === 'blue'
                                          ? 'bg-blue-500'
                                          : type === 'gray'
                                            ? 'bg-gray-500'
                                            : 'bg-gradient-to-r from-red-500 via-blue-500 to-gray-500'
                                    }`}
                                  ></div>
                                  {type === 'red' ? 'Red' : type === 'blue' ? 'Blue' : type === 'gray' ? 'Gray' : 'All'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <MultiSelect
                          options={dataTypeOptions}
                          selectedValues={selectedDataTypes}
                          onChange={handleDataTypeChange}
                          placeholder='Select contrast types to download'
                          className='w-full'
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='gap-2 flex-col sm:flex-row justify-end border-t pt-4'>
          <DialogClose asChild>
            <Button onClick={handleClose} variant='secondary' disabled={isDownloading} className='w-full sm:w-auto'>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleDownload}
            disabled={selectedFiles.length === 0 || selectedDataTypes.length === 0 || isDownloading}
            className='w-full sm:w-auto flex items-center gap-2'
          >
            {isDownloading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Creating ZIP...
              </>
            ) : (
              <>
                <Download className='h-4 w-4' />
                Download ({selectedFiles.length * selectedDataTypes.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
