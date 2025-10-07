'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multiselect';
import { Download, Loader2, FileText, Palette } from 'lucide-react';
import JSZip from 'jszip';

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

          if (dataType === 'all') {
            dataToDownload = rawData;
            outputFileName = `${fileName.replace('.csv', '')}_all_points.csv`;
          } else {
            const filteredData: GenericRow[] = [];
            for (let i = 0; i < points.length; i++) {
              if (points[i].color === dataType) {
                filteredData.push(rawData[i]);
              }
            }
            dataToDownload = filteredData;

            const colorSuffix = dataType === 'red' ? 'red_points' : dataType === 'blue' ? 'blue_points' : 'gray_points';
            outputFileName = `${fileName.replace('.csv', '')}_${colorSuffix}.csv`;
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

  const totalFilesCount = selectedFiles.length * selectedDataTypes.length;

  return (
    <Dialog open={isOpen}>
      <DialogContent className='max-w-5xl w-[95vw] max-h-[90vh] flex flex-col shadow-2xl'>
        <div className='border-b pb-4 mb-1'>
          <DialogTitle className='text-2xl font-bold flex items-center gap-3 mb-1'>
            <div className='p-2 bg-muted rounded-lg'>
              <Download className='h-6 w-6' />
            </div>
            Download Volcano Plot Data
          </DialogTitle>
          <p className='text-muted-foreground'>Export your differential expression analysis results</p>
        </div>

        <div className='flex-grow overflow-y-auto px-1 py-1'>
          {isDownloading ? (
            <div className='flex items-center justify-center py-16'>
              <div className='text-center'>
                <div className='relative mb-4'>
                  <div className='w-16 h-16 border-4 border-muted border-t-foreground rounded-full animate-spin mx-auto'></div>
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <Download className='h-6 w-6' />
                  </div>
                </div>
                <h3 className='text-xl font-semibold mb-1'>Creating Download Package</h3>
                <p className='text-muted-foreground'>Please wait while we prepare your files...</p>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='bg-background rounded-xl shadow-sm border'>
                <div className='bg-muted/30 border-b px-6 py-3 rounded-t-xl'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-background rounded-lg border'>
                      <FileText className='h-5 w-5' />
                    </div>
                    <div>
                      <Label className='text-lg font-semibold'>Differential Expression Files</Label>
                    </div>
                  </div>
                </div>

                <div className='p-4 space-y-3'>
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='w-3 h-3 bg-foreground rounded-full'></div>
                    <span className='text-sm font-medium'>
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

              <div className='bg-background rounded-xl shadow-sm border'>
                <div className='bg-muted/30 border-b px-6 py-3 rounded-t-xl'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 bg-background rounded-lg border'>
                      <Palette className='h-5 w-5' />
                    </div>
                    <div>
                      <Label className='text-lg font-semibold'>Data Categories</Label>
                    </div>
                  </div>
                </div>

                <div className='p-4 space-y-3'>
                  {selectedDataTypes.length > 0 && (
                    <div className='bg-muted/50 rounded-lg p-3 border mb-3'>
                      <div className='flex flex-wrap gap-2'>
                        {selectedDataTypes.map((type, index) => (
                          <span
                            key={index}
                            className={`px-3 py-2 rounded-full text-sm font-medium flex items-center gap-2 border ${
                              type === 'red'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : type === 'blue'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : type === 'gray'
                                    ? 'bg-gray-50 text-gray-700 border-gray-200'
                                    : 'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            <div
                              className={`w-3 h-3 rounded-full ${
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

        <DialogFooter className='gap-3 flex-col sm:flex-row justify-end border-t pt-4 mt-2'>
          <DialogClose asChild>
            <Button onClick={handleClose} variant='outline' disabled={isDownloading} className='w-full sm:w-auto'>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleDownload}
            disabled={selectedFiles.length === 0 || selectedDataTypes.length === 0 || isDownloading}
            className='w-full sm:w-auto shadow-sm'
          >
            {isDownloading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
                Creating ZIP...
              </>
            ) : (
              <>
                <Download className='h-4 w-4 mr-2' />
                Download {totalFilesCount > 0 && `(${totalFilesCount} files)`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
