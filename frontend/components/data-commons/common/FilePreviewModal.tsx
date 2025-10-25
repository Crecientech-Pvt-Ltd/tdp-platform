'use client';

import { ArrowLeftIcon, ArrowRightIcon, XIcon } from 'lucide-react';
import Papa from 'papaparse';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

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

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

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
      const url = `${API_BASE}/data-commons/project/${encodeURIComponent(group)}/${encodeURIComponent(program)}/${encodeURIComponent(project)}/preview/${encodeURIComponent(filename)}`;

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
      <DialogContent className='flex h-[95vh] max-h-[95vh] w-[95vw] max-w-[95vw] flex-col p-0'>
        <div className='flex shrink-0 items-center justify-between border-b p-4'>
          <DialogTitle className='truncate pr-8 font-semibold text-lg'>Preview: {filename}</DialogTitle>
          <DialogClose asChild>
            <Button aria-label='Close preview' variant='ghost' size='icon' className='shrink-0' onClick={onClose}>
              <XIcon className='h-5 w-5' />
              <span className='sr-only'>Close</span>
            </Button>
          </DialogClose>
        </div>
        <div className='min-h-0 flex-1 p-4'>
          <div className='flex h-full flex-col rounded border bg-background'>
            {loading && (
              <div className='shrink-0 border-b p-4' aria-live='polite'>
                <div className='flex items-center gap-2'>
                  <Spinner className='h-4 w-4' />
                  <span className='text-sm'>Loading preview...</span>
                </div>
              </div>
            )}
            {error && <div className='p-4 text-destructive text-sm'>Failed to load preview: {error}</div>}
            {!error && (loading || showTable) && (
              <div className='min-h-0 flex-1 overflow-hidden' aria-busy={loading}>
                <div className='h-full overflow-auto'>
                  <table className='w-full border-separate border-spacing-0'>
                    <thead className='sticky top-0 z-10 bg-background shadow-sm'>
                      <tr>
                        <th
                          scope='col'
                          className='sticky left-0 z-20 w-[3rem] min-w-[3rem] border bg-background px-3 py-2 text-left font-medium text-muted-foreground text-xs'
                        >
                          #
                        </th>
                        {(table?.headers || new Array(6).fill('')).map((h, i) => (
                          <th
                            // biome-ignore lint/suspicious/noArrayIndexKey: Index is necessary here to replace skeleton
                            key={`h-${i}`}
                            scope='col'
                            className='min-w-[10rem] whitespace-nowrap border px-3 py-3 text-left align-top font-semibold text-foreground text-xs'
                          >
                            {loading && !table ? (
                              <div className='h-4 w-24 animate-pulse rounded bg-muted' />
                            ) : (
                              <div className='max-w-[12rem] break-words'>{h}</div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='text-xs'>
                      {loading &&
                        !table &&
                        Array.from({ length: 10 }).map((_, r) => (
                          // biome-ignore lint/suspicious/noArrayIndexKey: had to do for skeleton
                          <tr key={`s-${r}`} className={r % 2 === 0 ? 'bg-muted/40' : ''}>
                            <td className='sticky left-0 z-10 border bg-background px-3 py-2 text-muted-foreground'>
                              {r + 1}
                            </td>
                            {Array.from({ length: 6 }).map((_, c) => (
                              // biome-ignore lint/suspicious/noArrayIndexKey: had to do for skeleton
                              <td key={`s-${r}-${c}`} className='border px-3 py-2'>
                                <div className='h-4 w-20 animate-pulse rounded bg-muted' />
                              </td>
                            ))}
                          </tr>
                        ))}
                      {!loading &&
                        showTable &&
                        table.data.map((row, rIdx) => (
                          <tr key={Object.values(row)?.[0]} className={rIdx % 2 === 0 ? 'bg-muted/30' : ''}>
                            <td className='sticky left-0 z-10 border bg-background px-3 py-2 text-muted-foreground'>
                              {rIdx + 1}
                            </td>
                            {table.headers.map(header => (
                              <td key={header} className='max-w-[12rem] border px-3 py-2 align-top'>
                                <div className='whitespace-pre-wrap break-words'>{row[header] || ''}</div>
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
              <div className='min-h-0 flex-1 overflow-auto'>
                <pre className='h-full whitespace-pre-wrap break-words p-4 font-mono text-xs'>{rawContent}</pre>
              </div>
            )}
          </div>
        </div>
        {multiple && (
          <div className='flex shrink-0 items-center justify-between border-t p-4'>
            <Button variant='outline' size='sm' onClick={onPrev} disabled={fileCount <= 1}>
              <ArrowLeftIcon className='mr-1 h-4 w-4' /> Prev
            </Button>
            <span className='text-muted-foreground text-sm'>
              File {fileIndex + 1} of {fileCount}
            </span>
            <Button variant='outline' size='sm' onClick={onNext} disabled={fileCount <= 1}>
              Next <ArrowRightIcon className='ml-1 h-4 w-4' />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
