'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import Papa from 'papaparse';

interface FilePreviewModalProps {
  open: boolean;
  onClose: () => void;
  filename: string;
  group?: string;
  program?: string;
  project?: string;
  uploadedContent?: string;
  multiple?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  fileIndex?: number;
  fileCount?: number;
}

type ParsedTable = {
  headers: string[];
  data: Record<string, string>[];
};

export default function FilePreviewModal({
  open,
  onClose,
  filename,
  group,
  program,
  project,
  uploadedContent,
  multiple = false,
  onNext,
  onPrev,
  fileIndex = 0,
  fileCount = 1,
}: FilePreviewModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [table, setTable] = React.useState<ParsedTable | null>(null);
  const [rawContent, setRawContent] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !filename) return;

    setLoading(true);
    setError(null);
    setTable(null);
    setRawContent('');

    const parseConfig = {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      preview: 20, // Only parse first 20 rows for preview
      transformHeader: (header: string, index: number) => header?.trim() || `Column ${index + 1}`,
      complete: (results: Papa.ParseResult<Record<string, string>>) => {
        setLoading(false);

        if (results.errors?.length) {
          // If parsing failed, show as raw text
          setTable(null);
          return;
        }

        const headers = results.meta.fields || [];
        if (headers.length > 0 && results.data.length > 0) {
          setTable({
            headers,
            data: results.data,
          });
        }
      },
      error: (error: Error) => {
        setLoading(false);
        setError(error.message);
      },
    };

    if (uploadedContent) {
      // Parse uploaded content directly
      setRawContent(uploadedContent);
      Papa.parse(uploadedContent, parseConfig);
    } else if (group && program && project) {
      // Parse remote file using Papa Parse's download feature
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/data-commons/project/${encodeURIComponent(group)}/${encodeURIComponent(program)}/${encodeURIComponent(project)}/preview/${encodeURIComponent(filename)}`;

      Papa.parse(url, {
        ...parseConfig,
        download: true,
        beforeFirstChunk: (chunk: string) => {
          setRawContent(chunk);
          return chunk;
        },
      });
    } else {
      setError('Missing project information for server file preview');
      setLoading(false);
    }
  }, [open, filename, group, program, project, uploadedContent]);

  const showTable = !!table && table.data.length > 0;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className='flex flex-col max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0'>
        <div className='flex items-center justify-between p-4 border-b shrink-0'>
          <DialogTitle className='text-lg font-semibold pr-8 truncate'>Preview: {filename}</DialogTitle>
          <DialogClose asChild>
            <Button aria-label='Close preview' variant='ghost' size='icon' className='shrink-0' onClick={onClose}>
              <X className='h-5 w-5' />
              <span className='sr-only'>Close</span>
            </Button>
          </DialogClose>
        </div>
        <div className='flex-1 min-h-0 p-4'>
          <div className='h-full rounded border bg-background flex flex-col'>
            {loading && (
              <div className='p-4 border-b shrink-0' role='status' aria-live='polite'>
                <div className='flex items-center gap-2'>
                  <Spinner className='h-4 w-4' />
                  <span className='text-sm'>Loading preview...</span>
                </div>
              </div>
            )}
            {error && <div className='p-4 text-sm text-destructive'>Failed to load preview: {error}</div>}
            {!error && (loading || showTable) && (
              <div className='flex-1 min-h-0 overflow-hidden' aria-busy={loading}>
                <div className='h-full overflow-auto'>
                  <table className='w-full border-separate border-spacing-0'>
                    <thead className='sticky top-0 z-10 bg-background shadow-sm'>
                      <tr>
                        <th
                          scope='col'
                          className='sticky left-0 z-20 bg-background border px-3 py-2 text-left text-xs font-medium text-muted-foreground min-w-[3rem] w-[3rem]'
                        >
                          #
                        </th>
                        {(table?.headers || new Array(6).fill('')).map((h, i) => (
                          <th
                            key={`h-${i}`}
                            scope='col'
                            className='border px-3 py-3 text-left text-xs font-semibold text-foreground align-top whitespace-nowrap min-w-[10rem]'
                          >
                            {loading && !table ? (
                              <div className='h-4 w-24 rounded bg-muted animate-pulse' />
                            ) : (
                              <div className='break-words max-w-[12rem]'>{h}</div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='text-xs'>
                      {loading &&
                        !table &&
                        Array.from({ length: 10 }).map((_, r) => (
                          <tr key={`s-${r}`} className={r % 2 === 0 ? 'bg-muted/40' : ''}>
                            <td className='sticky left-0 z-10 bg-background border px-3 py-2 text-muted-foreground'>
                              {r + 1}
                            </td>
                            {Array.from({ length: 6 }).map((_, c) => (
                              <td key={`s-${r}-${c}`} className='border px-3 py-2'>
                                <div className='h-4 w-20 rounded bg-muted animate-pulse' />
                              </td>
                            ))}
                          </tr>
                        ))}
                      {!loading &&
                        showTable &&
                        table.data.map((row, rIdx) => (
                          <tr key={`r-${rIdx}`} className={rIdx % 2 === 0 ? 'bg-muted/30' : ''}>
                            <td className='sticky left-0 z-10 bg-background border px-3 py-2 text-muted-foreground'>
                              {rIdx + 1}
                            </td>
                            {table.headers.map((header, cIdx) => (
                              <td key={`c-${rIdx}-${cIdx}`} className='border px-3 py-2 align-top max-w-[12rem]'>
                                <div className='break-words whitespace-pre-wrap'>{row[header] || ''}</div>
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {!error && !loading && !showTable && (
              <div className='flex-1 min-h-0 overflow-auto'>
                <pre className='p-4 font-mono text-xs whitespace-pre-wrap break-words h-full'>{rawContent}</pre>
              </div>
            )}
          </div>
        </div>
        {multiple && (
          <div className='flex justify-between items-center p-4 border-t shrink-0'>
            <Button variant='outline' size='sm' onClick={onPrev} disabled={fileCount <= 1}>
              <ArrowLeft className='h-4 w-4 mr-1' /> Prev
            </Button>
            <span className='text-sm text-muted-foreground'>
              File {fileIndex + 1} of {fileCount}
            </span>
            <Button variant='outline' size='sm' onClick={onNext} disabled={fileCount <= 1}>
              Next <ArrowRight className='h-4 w-4 ml-1' />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
