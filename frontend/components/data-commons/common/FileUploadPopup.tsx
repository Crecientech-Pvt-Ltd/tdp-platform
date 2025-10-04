'use client';

import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { X, Eye, Upload, Trash2 } from 'lucide-react';
import { indexedDBManager } from '@/components/data-commons/upload/utils/indexedDB';
import { fileUploadUtils, createUploadParams } from '@/components/data-commons/upload/utils/fileUploadUtils';
import FilePreviewModal from './FilePreviewModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  differentialexpression: UploadedFile[];
  samplesheet: UploadedFile | null;
}



export default function FileUploadPopup({ isOpen, onClose }: FileUploadPopupProps) {
  const [loadingProceed, setLoadingProceed] = React.useState(false);
  const [uploading, setUploading] = React.useState<string | null>(null);

  const [selections, setSelections] = React.useState<FileSelections>({
    gene: null,
    transcript: null,
    pca: null,
    differentialexpression: [],
    samplesheet: null,
  });

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewFile, setPreviewFile] = React.useState<{ file: UploadedFile; type: keyof FileSelections } | null>(null);
  const [previewFileList, setPreviewFileList] = React.useState<UploadedFile[]>([]);
  const [previewFileIndex, setPreviewFileIndex] = React.useState(0);

  const fileInputRefs = React.useRef<{
    gene: HTMLInputElement | null;
    transcript: HTMLInputElement | null;
    pca: HTMLInputElement | null;
    differentialexpression: HTMLInputElement | null;
    samplesheet: HTMLInputElement | null;
  }>({
    gene: null,
    transcript: null,
    pca: null,
    differentialexpression: null,
    samplesheet: null,
  });

  React.useEffect(() => {
    if (!isOpen) {
      setSelections({
        gene: null,
        transcript: null,
        pca: null,
        differentialexpression: [],
        samplesheet: null,
      });
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
        differentialexpression: [],
        samplesheet: null,
      });
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
      if (type === 'differentialexpression') {
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
          differentialexpression: [...prev.differentialexpression, ...uploadedFiles]
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
          [type]: uploadedFile
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
      if (type === 'differentialexpression' && fileId) {
        await indexedDBManager.deleteFile(fileId);
        setSelections(prev => ({
          ...prev,
          differentialexpression: prev.differentialexpression.filter(f => f.id !== fileId)
        }));
      } else if (type !== 'differentialexpression') {
        const file = selections[type] as UploadedFile | null;
        if (file) {
          await indexedDBManager.deleteFile(file.id);
          setSelections(prev => ({
            ...prev,
            [type]: null
          }));
        }
        if (fileInputRefs.current[type]) {
          fileInputRefs.current[type]!.value = '';
        }
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }
  };

  const handlePreview = (type: keyof FileSelections, fileId?: string) => {
    if (type === 'differentialexpression') {
      const files = selections.differentialexpression;
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
      setPreviewFile({ file: previewFileList[nextIdx], type: previewFile?.type || 'differentialexpression' });
    }
  };

  const handlePrevPreview = () => {
    if (previewFileList.length > 1) {
      const prevIdx = (previewFileIndex - 1 + previewFileList.length) % previewFileList.length;
      setPreviewFileIndex(prevIdx);
      setPreviewFile({ file: previewFileList[prevIdx], type: previewFile?.type || 'differentialexpression' });
    }
  };

  const canProceed = () => {
    return selections.gene || selections.transcript || selections.pca || 
           selections.differentialexpression.length > 0 || selections.samplesheet;
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

  const renderUploadRow = (label: string, type: keyof FileSelections, displayType: string) => {
    const isUploading = uploading === type;
    
    if (type === 'differentialexpression') {
      return (
                <div className='py-1.5 border-b last:border-b-0'>
          <div className='flex items-center gap-2 mb-1'>
            <Label className='text-xs font-medium'>{displayType}</Label>
            <span className='text-xs text-muted-foreground'>
              ({selections.differentialexpression.length} files uploaded)
            </span>
            {selections.differentialexpression.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-4 w-4 p-0'
                    onClick={() => handlePreview('differentialexpression')}
                  >
                    <Eye className='h-3 w-3' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Preview Files</TooltipContent>
              </Tooltip>
            )}
          </div>
          
          <div className='space-y-1'>
            <input
              ref={(el) => { fileInputRefs.current.differentialexpression = el; }}
              type='file'
              multiple
              accept='.csv,.tsv,.txt'
              onChange={(e) => handleFileUpload('differentialexpression', e.target.files)}
              className='hidden'
              id={`upload-${type}`}
            />
            
            <div className='border-2 border-dashed border-muted-foreground/25 rounded-md p-1.5 min-h-[35px] flex items-center'>
              {selections.differentialexpression.length === 0 ? (
                <label
                  htmlFor={`upload-${type}`}
                  className='flex items-center justify-center gap-1.5 w-full cursor-pointer hover:text-muted-foreground transition-colors'
                >
                  {isUploading ? (
                    <>
                      <Spinner className='h-3 w-3' />
                      <span className='text-xs text-muted-foreground'>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className='h-3 w-3' />
                      <span className='text-xs text-muted-foreground'>
                        Click to upload multiple differential expression files
                      </span>
                    </>
                  )}
                </label>
              ) : (
                <div className='w-full space-y-1'>
                  <label
                    htmlFor={`upload-${type}`}
                    className='flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors'
                  >
                    <Upload className='h-3 w-3' />
                    Add more files
                  </label>
                  <div className='flex flex-wrap gap-1'>
                    {selections.differentialexpression.map((file) => (
                      <div
                        key={file.id}
                        className='inline-flex items-center gap-1 bg-muted/80 rounded px-1.5 py-0.5 text-xs'
                        title={file.filename}
                      >
                        <span>{file.filename}</span>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-3 w-3 p-0 hover:bg-destructive/20'
                          onClick={() => handleRemoveFile('differentialexpression', file.id)}
                        >
                          <X className='h-2 w-2' />
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
    }

    const selectedFile = selections[type] as UploadedFile | null;

    return (
      <div className='py-3 border-b last:border-b-0'>
        <div className='flex items-center gap-2 mb-2'>
          <Label className='text-sm font-medium'>{displayType}</Label>
          {selectedFile && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6 p-0'
                  onClick={() => handlePreview(type)}
                >
                  <Eye className='h-4 w-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preview File</TooltipContent>
            </Tooltip>
          )}
        </div>
        
        <div className='space-y-2'>
          <input
            ref={(el) => { fileInputRefs.current[type] = el; }}
            type='file'
            accept='.csv,.tsv,.txt'
            onChange={(e) => handleFileUpload(type, e.target.files)}
            className='hidden'
            id={`upload-${type}`}
          />
          
          <div className='border-2 border-dashed border-muted-foreground/25 rounded-md p-2 min-h-[45px]'>
            {!selectedFile ? (
              <label
                htmlFor={`upload-${type}`}
                className='flex items-center justify-center gap-2 h-full cursor-pointer hover:text-muted-foreground transition-colors'
              >
                {isUploading ? (
                  <>
                    <Spinner className='h-3 w-3' />
                    <span className='text-xs text-muted-foreground'>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className='h-3 w-3' />
                    <span className='text-xs text-muted-foreground'>
                      Click to upload {type} file
                    </span>
                  </>
                )}
              </label>
            ) : (
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div
                    className='inline-flex items-center gap-1 bg-muted/80 rounded px-1.5 py-0.5 text-xs'
                    title={selectedFile.filename}
                  >
                    <span>{fileUploadUtils.truncateFilename(selectedFile.filename, 35)}</span>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-3 w-3 p-0 hover:bg-destructive/20'
                      onClick={() => handleRemoveFile(type)}
                    >
                      <X className='h-2 w-2' />
                    </Button>
                  </div>
                </div>
                <label
                  htmlFor={`upload-${type}`}
                  className='flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors'
                >
                  <Upload className='h-3 w-3' />
                  Replace
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className='max-w-3xl w-[95vw] max-h-[85vh] flex flex-col'>
        <DialogTitle className='text-lg font-semibold'>
          Upload Analysis Files
        </DialogTitle>

        <div className='flex-grow overflow-y-auto'>
          <div className='space-y-0'>
            {renderUploadRow('Gene File', 'gene', 'Gene File')}
            {renderUploadRow('Transcript File', 'transcript', 'Transcript File')}
            {renderUploadRow('Sample Sheet File', 'samplesheet', 'Sample Sheet File')}
            {renderUploadRow('PCA File', 'pca', 'PCA File')}
            {renderUploadRow('Differential Expression Files', 'differentialexpression', 'Differential Expression Files')}
          </div>
        </div>

        <DialogFooter className='gap-2 flex-col sm:flex-row justify-between border-t pt-4'>
          <div className='flex gap-2 flex-1'>
            <Button variant='outline' onClick={onClose} className='flex items-center gap-2'>
              <X className='h-4 w-4' />
              Cancel
            </Button>
            
            <Button
              variant='outline'
              onClick={clearAllSelections}
              disabled={uploading !== null}
              className='flex items-center gap-2'
            >
              <Trash2 className='h-4 w-4' />
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
                  <Spinner className='h-4 w-4' />
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