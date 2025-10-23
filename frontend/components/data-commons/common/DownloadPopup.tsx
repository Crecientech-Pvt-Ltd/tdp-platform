'use client';

import { strToU8, zipSync } from 'fflate';
import { DownloadIcon, Loader2Icon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export type DownloadFile = {
  url?: string;
  fileName?: string;
  name?: string;
  description?: string;
  content?: string;
};

export type DownloadFileSpec = DownloadFile;

function getDisplayName(f: DownloadFile): string | undefined {
  return f.fileName ?? f.name;
}

interface DownloadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  files: DownloadFile[];
  metadata?: Record<string, unknown>;
  zipName?: string;
}

export default function DownloadPopup({
  isOpen,
  onClose,
  files,
  metadata,
  zipName = 'data-download.zip',
}: DownloadPopupProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const selectableFiles = useMemo(() => {
    return files.filter(f => !!getDisplayName(f));
  }, [files]);

  useEffect(() => {
    if (isOpen) {
      setSelectedFiles(selectableFiles.filter(f => !!(f.url || f.content)).map(f => getDisplayName(f)!));
    } else {
      setSelectedFiles([]);
      setIsDownloading(false);
    }
  }, [isOpen, selectableFiles]);

  const handleFileChange = useCallback((fileName: string, checked: boolean) => {
    setSelectedFiles(prev => (checked ? [...prev, fileName] : prev.filter(f => f !== fileName)));
  }, []);

  const handleDownload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to download.');
      return;
    }

    setIsDownloading(true);
    try {
      const zipFiles: Record<string, Uint8Array> = {};

      for (const f of files) {
        const displayName = getDisplayName(f);
        if (!displayName || !selectedFiles.includes(displayName)) continue;

        try {
          const content = f.content ?? (f.url ? await (await fetch(f.url)).text() : '');
          if (!content) continue;

          zipFiles[displayName] = strToU8(content);
        } catch (err) {
          console.warn(`Failed to process ${displayName}:`, err);
        }
      }

      if (metadata) {
        zipFiles['metadata.json'] = strToU8(JSON.stringify(metadata, null, 2));
      }

      const zipData = zipSync(zipFiles);
      const zippedArrayBuffer = zipData.buffer instanceof ArrayBuffer ? zipData.buffer : zipData.slice().buffer; // fallback, but zipSync should return ArrayBuffer-backed Uint8Array

      const blob = new Blob([zippedArrayBuffer], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const aElement = document.createElement('a');
      aElement.href = url;
      aElement.download = zipName;
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
  }, [files, selectedFiles, metadata, zipName, onClose]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  return (
    <Dialog open={isOpen}>
      <DialogContent className='flex max-h-[90vh] w-[95vw] max-w-2xl flex-col'>
        <DialogTitle className='font-semibold text-xl'>Download Data</DialogTitle>

        <div className='grow overflow-y-auto px-1 py-4'>
          {isDownloading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center text-gray-500'>
                <Spinner className='mx-auto mb-4' />
                Creating download package...
              </div>
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='rounded-lg border bg-muted/30 p-6'>
                <div className='space-y-4'>
                  <Label className='font-semibold text-base'>Available Files</Label>

                  {selectableFiles.length === 0 ? (
                    <p className='text-muted-foreground text-sm'>No files available for download.</p>
                  ) : (
                    <div className='space-y-3'>
                      {selectableFiles.map(file => {
                        const displayName = getDisplayName(file)!;
                        const disabled = !(file.url || file.content);
                        const checked = selectedFiles.includes(displayName);

                        return (
                          <div
                            key={displayName}
                            className='flex items-center space-x-3 rounded-md border bg-background p-3'
                          >
                            <Checkbox
                              id={displayName}
                              checked={checked}
                              onCheckedChange={val => handleFileChange(displayName, Boolean(val))}
                              disabled={disabled}
                            />
                            <div className='flex-1'>
                              <Label htmlFor={displayName} className='cursor-pointer font-medium text-sm'>
                                {displayName}
                              </Label>
                              {file.description && (
                                <p className='mt-1 text-muted-foreground text-xs'>{file.description}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='flex-col justify-end gap-2 border-t pt-4 sm:flex-row'>
          <DialogClose asChild>
            <Button onClick={handleClose} variant='secondary' disabled={isDownloading} className='w-full sm:w-auto'>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleDownload}
            disabled={selectedFiles.length === 0 || isDownloading}
            className='flex w-full items-center gap-2 sm:w-auto'
          >
            {isDownloading ? (
              <>
                <Loader2Icon className='h-4 w-4 animate-spin' />
                Creating ZIP...
              </>
            ) : (
              <>
                <DownloadIcon className='h-4 w-4' />
                Download ({selectedFiles.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
