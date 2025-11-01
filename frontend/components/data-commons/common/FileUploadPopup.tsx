'use client';

import { EyeIcon, Trash2Icon, UploadIcon, XIcon } from 'lucide-react';
import React from 'react';
import { createUploadParams, fileUploadUtils } from '@/components/data-commons/upload/utils/fileUploadUtils';
import { indexedDBManager } from '@/components/data-commons/upload/utils/indexedDB';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import FilePreviewModal from './FilePreviewModal';

interface FileUploadPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadedFile {
  id: string;
  filename: string;
  content: string;
}

interface FileSelections {
  gene: UploadedFile | null;
  transcript: UploadedFile | null;
  pca: UploadedFile | null;
  samplesheet: UploadedFile | null;
  geneDiffExpFiles: UploadedFile[];
  transcriptDiffExpFiles: UploadedFile[];
}

export default function FileUploadPopup({ isOpen, onClose }: FileUploadPopupProps) {
  const [loadingProceed, setLoadingProceed] = React.useState(false);
  const [uploading, setUploading] = React.useState<string | null>(null);
  const [hasStartedUploading, setHasStartedUploading] = React.useState(false);

  const [selections, setSelections] = React.useState<FileSelections>({
    gene: null,
    transcript: null,
    pca: null,
    samplesheet: null,
    geneDiffExpFiles: [],
    transcriptDiffExpFiles: [],
  });

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewFile, setPreviewFile] = React.useState<{ file: UploadedFile; type: keyof FileSelections } | null>(null);
  const [previewFileList, setPreviewFileList] = React.useState<UploadedFile[]>([]);
  const [previewFileIndex, setPreviewFileIndex] = React.useState(0);

  const fileInputRefs = React.useRef<{
    gene: HTMLInputElement | null;
    transcript: HTMLInputElement | null;
    pca: HTMLInputElement | null;
    samplesheet: HTMLInputElement | null;
    geneDiffExp: HTMLInputElement | null;
    transcriptDiffExp: HTMLInputElement | null;
  }>({
    gene: null,
    transcript: null,
    pca: null,
    samplesheet: null,
    geneDiffExp: null,
    transcriptDiffExp: null,
  });

  React.useEffect(() => {
    if (!isOpen) {
      setSelections({
        gene: null,
        transcript: null,
        pca: null,
        samplesheet: null,
        geneDiffExpFiles: [],
        transcriptDiffExpFiles: [],
      });
      setHasStartedUploading(false);
      Object.values(fileInputRefs.current).forEach(input => {
        if (input) input.value = '';
      });
    }
  }, [isOpen]);

  const clearAllSelections = async () => {
    try {
      await indexedDBManager.clearAll();
      setSelections({
        gene: null,
        transcript: null,
        pca: null,
        samplesheet: null,
        geneDiffExpFiles: [],
        transcriptDiffExpFiles: [],
      });
      setHasStartedUploading(false);
      Object.values(fileInputRefs.current).forEach(input => {
        if (input) input.value = '';
      });
    } catch (error) {
      console.error('Error clearing selections:', error);
    }
  };

  const handleFileUpload = async (type: keyof FileSelections, files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(type);
    try {
      if (!hasStartedUploading) {
        await indexedDBManager.clearAll();
        setHasStartedUploading(true);
      }

      if (type === 'geneDiffExpFiles' || type === 'transcriptDiffExpFiles') {
        const uploadedFiles: UploadedFile[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!fileUploadUtils.validateFileType(file)) {
            alert(`Invalid file type for ${file.name}. Please upload CSV, TSV, or TXT files only.`);
            continue;
          }

          const content = await fileUploadUtils.readFileAsText(file);
          const id = await fileUploadUtils.storeFile(file.name, content, type);
          uploadedFiles.push({ id, filename: file.name, content });
        }

        setSelections(prev => ({
          ...prev,
          [type]: [...prev[type], ...uploadedFiles],
        }));
      } else {
        const file = files[0];
        if (!fileUploadUtils.validateFileType(file)) {
          alert(`Invalid file type for ${file.name}. Please upload CSV, TSV, or TXT files only.`);
          return;
        }

        if (selections[type]) {
          await indexedDBManager.deleteFile((selections[type] as UploadedFile).id);
        }

        const content = await fileUploadUtils.readFileAsText(file);
        const id = await fileUploadUtils.storeFile(file.name, content, type);
        const uploadedFile = { id, filename: file.name, content };

        setSelections(prev => ({
          ...prev,
          [type]: uploadedFile,
        }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveFile = async (type: keyof FileSelections, fileId?: string) => {
    try {
      if ((type === 'geneDiffExpFiles' || type === 'transcriptDiffExpFiles') && fileId) {
        await indexedDBManager.deleteFile(fileId);
        setSelections(prev => ({
          ...prev,
          [type]: (prev[type] as UploadedFile[]).filter(f => f.id !== fileId),
        }));
      } else if (type !== 'geneDiffExpFiles' && type !== 'transcriptDiffExpFiles') {
        const file = selections[type] as UploadedFile | null;
        if (file) {
          await indexedDBManager.deleteFile(file.id);
          setSelections(prev => ({
            ...prev,
            [type]: null,
          }));
        }
        if (fileInputRefs.current[type as 'gene' | 'transcript' | 'pca' | 'samplesheet']) {
          fileInputRefs.current[type as 'gene' | 'transcript' | 'pca' | 'samplesheet']!.value = '';
        }
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const handlePreview = (type: keyof FileSelections, fileId?: string) => {
    if (type === 'geneDiffExpFiles' || type === 'transcriptDiffExpFiles') {
      const files = selections[type] as UploadedFile[];
      if (!files.length) return;
      const fileIndex = fileId ? files.findIndex(f => f.id === fileId) : 0;
      setPreviewFileList(files);
      setPreviewFileIndex(fileIndex >= 0 ? fileIndex : 0);
      setPreviewFile({ file: files[fileIndex >= 0 ? fileIndex : 0], type });
      setPreviewOpen(true);
    } else {
      const file = selections[type] as UploadedFile | null;
      if (!file) return;
      setPreviewFileList([file]);
      setPreviewFileIndex(0);
      setPreviewFile({ file, type });
      setPreviewOpen(true);
    }
  };

  const handleNextPreview = () => {
    if (previewFileList.length > 1) {
      const nextIdx = (previewFileIndex + 1) % previewFileList.length;
      setPreviewFileIndex(nextIdx);
      setPreviewFile({ file: previewFileList[nextIdx], type: previewFile?.type || 'geneDiffExpFiles' });
    }
  };

  const handlePrevPreview = () => {
    if (previewFileList.length > 1) {
      const prevIdx = (previewFileIndex - 1 + previewFileList.length) % previewFileList.length;
      setPreviewFileIndex(prevIdx);
      setPreviewFile({ file: previewFileList[prevIdx], type: previewFile?.type || 'geneDiffExpFiles' });
    }
  };

  const canProceed = () => {
    return (
      selections.gene ||
      selections.transcript ||
      selections.pca ||
      selections.geneDiffExpFiles.length > 0 ||
      selections.transcriptDiffExpFiles.length > 0 ||
      selections.samplesheet
    );
  };

  const confirmProceed = () => {
    setLoadingProceed(true);
    const params = createUploadParams(selections);
    const url = `/data?${params.toString()}`;

    setTimeout(() => {
      window.open(url, '_blank');
      setLoadingProceed(false);
      onClose();
    }, 600);
  };

  const renderUploadRow = (
    _label: string,
    type: 'gene' | 'transcript' | 'pca' | 'samplesheet',
    displayType: string,
  ) => {
    const isUploading = uploading === type;
    const selectedFile = selections[type] as UploadedFile | null;

    return (
      <div className='border-b py-3 last:border-b-0'>
        <div className='mb-2 flex items-center gap-2'>
          <Label className='font-medium text-sm'>{displayType}</Label>
          {selectedFile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='size-6 p-0' onClick={() => handlePreview(type)}>
                  <EyeIcon className='size-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preview File</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className='space-y-2'>
          <input
            ref={el => {
              fileInputRefs.current[type] = el;
            }}
            type='file'
            accept='.csv,.tsv,.txt'
            onChange={e => handleFileUpload(type, e.target.files)}
            className='hidden'
            id={`upload-${type}`}
          />

          <div className='min-h-[45px] rounded-md border-2 border-muted-foreground/25 border-dashed p-2'>
            {!selectedFile ? (
              <label
                htmlFor={`upload-${type}`}
                className='flex h-full cursor-pointer items-center justify-center gap-2 transition-colors hover:text-muted-foreground'
              >
                {isUploading ? (
                  <>
                    <Spinner className='size-3' />
                    <span className='text-muted-foreground text-xs'>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className='size-3' />
                    <span className='text-muted-foreground text-xs'>Click to upload {type} file</span>
                  </>
                )}
              </label>
            ) : (
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div
                    className='inline-flex items-center gap-1 rounded bg-muted/80 px-1.5 py-0.5 text-xs'
                    title={selectedFile.filename}
                  >
                    <span>{fileUploadUtils.truncateFilename(selectedFile.filename, 35)}</span>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-3 p-0 hover:bg-destructive/20'
                      onClick={() => handleRemoveFile(type)}
                    >
                      <XIcon className='size-2' />
                    </Button>
                  </div>
                </div>
                <label
                  htmlFor={`upload-${type}`}
                  className='flex cursor-pointer items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground'
                >
                  <UploadIcon className='size-3' />
                  Replace
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDiffExpUploadSection = (
    label: string,
    type: 'geneDiffExpFiles' | 'transcriptDiffExpFiles',
    refKey: 'geneDiffExp' | 'transcriptDiffExp',
  ) => {
    const files = selections[type];
    const isUploading = uploading === type;

    return (
      <div className='border-b py-1.5 last:border-b-0'>
        <div className='mb-1 flex items-center gap-2'>
          <Label className='font-medium text-xs'>{label}</Label>
          <span className='text-muted-foreground text-xs'>({files.length} files uploaded)</span>
          {files.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='size-4 p-0' onClick={() => handlePreview(type)}>
                  <EyeIcon className='size-3' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preview Files</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className='space-y-1'>
          <input
            ref={el => {
              fileInputRefs.current[refKey] = el;
            }}
            type='file'
            multiple
            accept='.csv,.tsv,.txt'
            onChange={e => handleFileUpload(type, e.target.files)}
            className='hidden'
            id={`upload-${type}`}
          />

          <div className='flex min-h-[35px] items-center rounded-md border-2 border-muted-foreground/25 border-dashed p-1.5'>
            {files.length === 0 ? (
              <label
                htmlFor={`upload-${type}`}
                className='flex w-full cursor-pointer items-center justify-center gap-1.5 transition-colors hover:text-muted-foreground'
              >
                {isUploading ? (
                  <>
                    <Spinner className='size-3' />
                    <span className='text-muted-foreground text-xs'>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className='size-3' />
                    <span className='text-muted-foreground text-xs'>Click to upload {label.toLowerCase()}</span>
                  </>
                )}
              </label>
            ) : (
              <div className='w-full space-y-1'>
                <label
                  htmlFor={`upload-${type}`}
                  className='flex cursor-pointer items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground'
                >
                  <UploadIcon className='size-3' />
                  Add more files
                </label>
                <div className='flex flex-wrap gap-1'>
                  {files.map(file => (
                    <div
                      key={file.id}
                      className='inline-flex items-center gap-1 rounded bg-muted/80 px-1.5 py-0.5 text-xs'
                      title={file.filename}
                    >
                      <span>{file.filename}</span>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-3 p-0 hover:bg-destructive/20'
                        onClick={() => handleRemoveFile(type, file.id)}
                      >
                        <XIcon className='size-2' />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className='flex max-h-[85vh] w-[95vw] max-w-3xl flex-col'>
        <DialogTitle className='font-semibold text-lg'>Upload Analysis Files</DialogTitle>

        <div className='grow overflow-y-auto'>
          <div className='space-y-0'>
            {renderUploadRow('Gene File', 'gene', 'Gene File')}
            {renderUploadRow('Transcript File', 'transcript', 'Transcript File')}
            {renderUploadRow('Sample Sheet File', 'samplesheet', 'Sample Sheet File')}
            {renderUploadRow('PCA File', 'pca', 'PCA File')}
            {renderDiffExpUploadSection('Gene Differential Expression Files', 'geneDiffExpFiles', 'geneDiffExp')}
            {renderDiffExpUploadSection(
              'Transcript Differential Expression Files',
              'transcriptDiffExpFiles',
              'transcriptDiffExp',
            )}
          </div>
        </div>

        <DialogFooter className='flex-col justify-between gap-2 border-t pt-4 sm:flex-row'>
          <div className='flex flex-1 gap-2'>
            <Button variant='outline' onClick={onClose} className='flex items-center gap-2'>
              <XIcon className='size-4' />
              Cancel
            </Button>

            <Button
              variant='outline'
              onClick={clearAllSelections}
              disabled={uploading !== null}
              className='flex items-center gap-2'
            >
              <Trash2Icon className='size-4' />
              Clear All
            </Button>
          </div>

          <div className='flex gap-2'>
            <Button
              onClick={confirmProceed}
              disabled={!canProceed() || loadingProceed || uploading !== null}
              className='bg-primary text-white hover:bg-primary/90'
            >
              {loadingProceed ? (
                <div className='flex items-center gap-2'>
                  <Spinner className='size-4' />
                  <span>Loading...</span>
                </div>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </DialogFooter>

        <FilePreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          filename={previewFile?.file.filename || ''}
          uploadedContent={previewFile?.file.content || ''}
          multiple={previewFileList.length > 1}
          onNext={handleNextPreview}
          onPrev={handlePrevPreview}
          fileIndex={previewFileIndex}
          fileCount={previewFileList.length}
        />
      </DialogContent>
    </Dialog>
  );
}
