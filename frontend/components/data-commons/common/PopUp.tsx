'use client';

import { strToU8, zipSync } from 'fflate';
import { DownloadIcon, EyeIcon, XIcon } from 'lucide-react';
import React from 'react';
import FlexibleLabelList from '@/components/RenderLabel';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multiselect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import FilePreviewModal from './FilePreviewModal';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

interface FileSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: string;
  selectedProgram: string;
  selectedProject: string;
}

interface FileData {
  allFiles: string[];
  initializedFiles: {
    gene: string;
    transcript: string;
    pca: string;
    samplesheet: string;
    differentialexpression: string[];
    geneDiffExpFiles: string[];
    transcriptDiffExpFiles: string[];
  };
}

const truncateFilename = (filename: string, maxLength = 50) => {
  if (filename.length <= maxLength) return filename;
  const extension = filename.split('.').pop();
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const truncatedName = `${nameWithoutExt.substring(0, maxLength - extension!.length - 4)}...`;
  return `${truncatedName}.${extension}`;
};

export default function FileSelectionPopup({
  isOpen,
  onClose,
  selectedGroup,
  selectedProgram,
  selectedProject,
}: FileSelectionPopupProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [loadingProceed, setLoadingProceed] = React.useState(false);
  const [showDownloadCheckboxes, setShowDownloadCheckboxes] = React.useState(false);
  const [downloadSelections, setDownloadSelections] = React.useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = React.useState(false);

  const [allFiles, setAllFiles] = React.useState<string[]>([]);

  const [selections, setSelections] = React.useState({
    gene: '',
    transcript: '',
    pca: '',
    differentialexpression: [] as string[],
    samplesheet: '',
  });

  const [previewState, setPreviewState] = React.useState({
    open: false,
    file: null as {
      filename: string;
      type: 'gene' | 'transcript' | 'pca' | 'differentialexpression' | 'samplesheet';
    } | null,
    fileList: [] as string[],
    fileIndex: 0,
  });

  const canProceed = React.useMemo(() => !loading, [loading]);

  const getFileUrl = React.useCallback(
    (filename: string) =>
      `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/files/${encodeURIComponent(filename)}`,
    [selectedGroup, selectedProgram, selectedProject],
  );

  const getDeFileUrl = React.useCallback(
    (filename: string) =>
      `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/deFile/${encodeURIComponent(filename)}`,
    [selectedGroup, selectedProgram, selectedProject],
  );

  React.useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setShowDownloadCheckboxes(false);
      setDownloadSelections(new Set());
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen || !selectedGroup || !selectedProgram || !selectedProject) return;

    setLoading(true);
    let isCancelled = false;

    const fetchInitializedFiles = async () => {
      try {
        const url = `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/initializedFiles`;

        const res = await fetch(url);
        const json: FileData = await res.json();

        if (isCancelled) return;

        setAllFiles(json.allFiles || []);
        setSelections({
          gene: json.initializedFiles?.gene || '',
          transcript: json.initializedFiles?.transcript || '',
          pca: json.initializedFiles?.pca || '',
          samplesheet: json.initializedFiles?.samplesheet || '',
          differentialexpression: json.initializedFiles?.differentialexpression || [],
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to load initialized files:', error);
        if (!isCancelled) setLoading(false);
      }
    };

    fetchInitializedFiles();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedGroup, selectedProgram, selectedProject]);

  const handleChange = React.useCallback(
    (type: 'gene' | 'transcript' | 'pca' | 'differentialexpression' | 'samplesheet', value: string | string[]) => {
      setSelections(prev => ({
        ...prev,
        [type]: value === '__none__' ? '' : value,
      }));
    },
    [],
  );

  const handleCloseButton = React.useCallback(() => {
    if (showDownloadCheckboxes) setShowDownloadCheckboxes(false);
    else if (isEditing) setIsEditing(false);
    else onClose();
  }, [showDownloadCheckboxes, isEditing, onClose]);

  const confirmProceed = React.useCallback(() => {
    setLoadingProceed(true);

    const params = new URLSearchParams({
      group: selectedGroup,
      program: selectedProgram,
      project: selectedProject,
      geneFile: selections.gene,
      transcriptFile: selections.transcript,
      pcaFile: selections.pca,
      deFiles: selections.differentialexpression.join(','),
      sampleFile: selections.samplesheet,
    });

    const url = `/data?${params.toString()}`;

    window.open(url, '_blank');
    setLoadingProceed(false);
    onClose();
  }, [selectedGroup, selectedProgram, selectedProject, selections, onClose]);

  const toggleDownloadSelection = React.useCallback((type: string) => {
    setDownloadSelections(prev => {
      const newSelections = new Set(prev);
      if (newSelections.has(type)) {
        newSelections.delete(type);
      } else {
        newSelections.add(type);
      }
      return newSelections;
    });
  }, []);

  const getFilesToDownload = React.useCallback(() => {
    const files: {
      gene: string[];
      transcript: string[];
      pca: string[];
      samplesheet: string[];
      differentialexpression: string[];
    } = {
      gene: [],
      transcript: [],
      pca: [],
      samplesheet: [],
      differentialexpression: [],
    };

    if (downloadSelections.has('gene') && selections.gene) {
      files.gene.push(selections.gene);
    }
    if (downloadSelections.has('transcript') && selections.transcript) {
      files.transcript.push(selections.transcript);
    }
    if (downloadSelections.has('pca') && selections.pca) {
      files.pca.push(selections.pca);
    }
    if (downloadSelections.has('samplesheet') && selections.samplesheet) {
      files.samplesheet.push(selections.samplesheet);
    }
    if (downloadSelections.has('differentialexpression')) {
      files.differentialexpression.push(...selections.differentialexpression);
    }

    return files;
  }, [downloadSelections, selections]);

  const initializeDownloadSelections = React.useCallback(() => {
    const initialSelections = new Set<string>();

    if (selections.gene) initialSelections.add('gene');
    if (selections.transcript) initialSelections.add('transcript');
    if (selections.pca) initialSelections.add('pca');
    if (selections.samplesheet) initialSelections.add('samplesheet');
    if (selections.differentialexpression.length > 0) initialSelections.add('differentialexpression');

    return initialSelections;
  }, [selections]);

  const handleDownload = React.useCallback(async () => {
    const filesToDownload = getFilesToDownload();

    const allFiles: Array<{ filename: string; type: string }> = [];
    Object.entries(filesToDownload).forEach(([type, files]) => {
      files.forEach(filename => {
        allFiles.push({ filename, type });
      });
    });

    if (allFiles.length === 0) {
      alert('Please select at least one file to download');
      return;
    }

    setIsDownloading(true);

    try {
      if (allFiles.length === 1) {
        const file = allFiles[0];
        const fileUrl =
          file.type === 'differentialexpression' ? getDeFileUrl(file.filename) : getFileUrl(file.filename);
        const response = await fetch(fileUrl);

        let blob: Blob;
        if (file.type === 'differentialexpression') {
          const text = await response.text();
          const colonIndex = text.indexOf(':');
          if (colonIndex !== -1) {
            const fileData = text.substring(colonIndex + 1).trim();
            blob = new Blob([fileData], { type: 'text/plain' });
          } else {
            blob = new Blob([text], { type: 'text/plain' });
          }
        } else {
          blob = await response.blob();
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const files: Record<string, Uint8Array> = {};

        for (const file of allFiles) {
          const fileUrl =
            file.type === 'differentialexpression' ? getDeFileUrl(file.filename) : getFileUrl(file.filename);
          const response = await fetch(fileUrl);

          if (file.type === 'differentialexpression') {
            const text = await response.text();
            const colonIndex = text.indexOf(':');
            const fileData = colonIndex !== -1 ? text.substring(colonIndex + 1).trim() : text;
            files[file.filename] = strToU8(fileData);
          } else {
            const arrayBuffer = await response.arrayBuffer();
            files[file.filename] = new Uint8Array(arrayBuffer);
          }
        }

        const zipBuffer = zipSync(files);
        const zippedArrayBuffer = zipBuffer.buffer instanceof ArrayBuffer ? zipBuffer.buffer : zipBuffer.slice().buffer; // fallback, but zipSync should return ArrayBuffer-backed Uint8Array

        const blob = new Blob([zippedArrayBuffer], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const aElement = document.createElement('a');
        aElement.href = url;
        aElement.download = `${selectedProject}_files.zip`;
        aElement.click();
        URL.revokeObjectURL(url);
        aElement.remove();
      }

      setShowDownloadCheckboxes(false);
      setDownloadSelections(new Set());
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download files. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [getFilesToDownload, getDeFileUrl, getFileUrl, selectedProject]);

  const handlePreview = React.useCallback(
    (type: 'gene' | 'transcript' | 'pca' | 'differentialexpression' | 'samplesheet', filename?: string) => {
      if (type === 'differentialexpression') {
        const files = selections.differentialexpression;
        if (!files.length) return;
        setPreviewState({
          open: true,
          file: { filename: filename || files[0], type },
          fileList: files,
          fileIndex: filename ? files.indexOf(filename) : 0,
        });
      } else {
        const file = selections[type];
        if (!file) return;
        setPreviewState({
          open: true,
          file: { filename: file, type },
          fileList: [file],
          fileIndex: 0,
        });
      }
    },
    [selections],
  );

  const handleNextPreview = React.useCallback(() => {
    if (previewState.fileList.length > 1) {
      const nextIdx = (previewState.fileIndex + 1) % previewState.fileList.length;
      setPreviewState(prev => ({
        ...prev,
        fileIndex: nextIdx,
        file: { filename: prev.fileList[nextIdx], type: prev.file?.type || 'differentialexpression' },
      }));
    }
  }, [previewState.fileList, previewState.fileIndex]);

  const handlePrevPreview = React.useCallback(() => {
    if (previewState.fileList.length > 1) {
      const prevIdx = (previewState.fileIndex - 1 + previewState.fileList.length) % previewState.fileList.length;
      setPreviewState(prev => ({
        ...prev,
        fileIndex: prevIdx,
        file: { filename: prev.fileList[prevIdx], type: prev.file?.type || 'differentialexpression' },
      }));
    }
  }, [previewState.fileList, previewState.fileIndex]);

  const renderRow = (
    _label: string,
    type: 'gene' | 'transcript' | 'pca' | 'differentialexpression' | 'samplesheet',
    displayType: string,
  ) => {
    if (type === 'differentialexpression') {
      return (
        <div className='flex items-start gap-4 border-b py-3 last:border-b-0'>
          {showDownloadCheckboxes && (
            <Checkbox
              checked={downloadSelections.has(type)}
              onCheckedChange={() => toggleDownloadSelection(type)}
              className='mt-1'
            />
          )}
          <div className='flex-1 overflow-x-hidden'>
            {isEditing ? (
              <div className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <Label className='font-medium text-sm'>{displayType}</Label>
                  <span className='text-muted-foreground text-sm'>
                    {' '}
                    <strong>
                      {loading
                        ? 'Loading...'
                        : selections.differentialexpression.length > 0
                          ? `${selections.differentialexpression.length} files`
                          : 'None'}
                    </strong>
                  </span>
                  {selections.differentialexpression.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6 p-0'
                          onClick={() => handlePreview('differentialexpression')}
                        >
                          <EyeIcon className='h-4 w-4' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Preview File</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {!loading && selections.differentialexpression.length > 0 && (
                  <FlexibleLabelList
                    labels={selections.differentialexpression.map(
                      (file, index) => `${index + 1}. ${truncateFilename(file, 60)}`,
                    )}
                    bgColor='bg-white'
                    rowsToShow={selections.differentialexpression.length}
                  />
                )}
                {loading ? (
                  <div className='flex items-center justify-center rounded-md border bg-muted/50 py-4'>
                    <Spinner className='mr-2 h-4 w-4' />
                    <span className='text-muted-foreground text-sm'>Loading files...</span>
                  </div>
                ) : (
                  <MultiSelect
                    options={allFiles.map(file => ({
                      label: file,
                      value: file,
                    }))}
                    selectedValues={selections.differentialexpression}
                    onChange={v => handleChange('differentialexpression', v)}
                    placeholder='Select Differential Expression files'
                    className='w-full'
                  />
                )}
              </div>
            ) : (
              <>
                <div className='mb-2 flex items-center gap-2'>
                  <Label className='font-medium text-sm'>{displayType}</Label>
                  <span className='text-muted-foreground text-sm'>
                    ({selections.differentialexpression.length} files selected)
                  </span>
                  {selections.differentialexpression.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6 p-0'
                          onClick={() => handlePreview('differentialexpression')}
                        >
                          <EyeIcon className='h-4 w-4' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Preview File</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className='max-h-32 overflow-y-auto rounded-md bg-muted/50 p-2'>
                  {selections.differentialexpression.length === 0 ? (
                    <span className='text-muted-foreground text-sm'>No files selected</span>
                  ) : (
                    <div className='space-y-1'>
                      {selections.differentialexpression.map((file, index) => (
                        <div key={file} className='text-sm' title={file}>
                          {index + 1}. {truncateFilename(file, 60)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    const selectedFile = selections[type];

    return (
      <div className='flex items-start gap-4 border-b py-3 last:border-b-0'>
        {showDownloadCheckboxes && (
          <Checkbox
            checked={downloadSelections.has(type)}
            onCheckedChange={() => toggleDownloadSelection(type)}
            disabled={!selectedFile}
            className='mt-1'
          />
        )}
        <div className='flex-1'>
          <div className='mb-2 flex items-center gap-2'>
            <Label className='font-medium text-sm'>{displayType}</Label>
            {selectedFile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant='ghost' size='icon' className='h-6 w-6 p-0' onClick={() => handlePreview(type)}>
                    <EyeIcon className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Preview File</TooltipContent>
              </Tooltip>
            )}
          </div>
          {loading ? (
            <div className='flex items-center gap-2 py-2'>
              <Spinner className='h-4 w-4' />
              <span className='text-muted-foreground text-sm'>Loading files...</span>
            </div>
          ) : isEditing ? (
            <Select
              value={selectedFile || '__none__'}
              onValueChange={v => handleChange(type, v === '__none__' ? '' : v)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder={`Select ${type} file`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='__none__'>
                  <span className='text-muted-foreground text-sm'>None</span>
                </SelectItem>
                {allFiles.map(file => (
                  <SelectItem key={file} value={file}>
                    <span className='text-sm' title={file}>
                      {truncateFilename(file, 50)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className='rounded-md bg-muted/50 p-2'>
              <span className='text-sm' title={selectedFile}>
                {selectedFile ? truncateFilename(selectedFile, 60) : 'No file selected'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className='flex max-h-[85vh] w-[95vw] max-w-3xl flex-col'>
        <DialogTitle className='font-semibold text-lg'>
          {isEditing ? 'Edit Analysis Files' : 'Confirm File Selection'}
        </DialogTitle>

        <div className='grow overflow-y-auto'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <Spinner className='mx-auto mb-4' />
                <p className='text-muted-foreground'>Loading available files...</p>
              </div>
            </div>
          ) : (
            <div className='space-y-0'>
              {renderRow('Gene File', 'gene', 'Gene File')}
              {renderRow('Transcript File', 'transcript', 'Transcript File')}
              {renderRow('Sample Sheet File', 'samplesheet', 'Sample Sheet File')}
              {renderRow('PCA File', 'pca', 'PCA File')}
              {renderRow('Differential Expression Files', 'differentialexpression', 'Differential Expression Files')}
            </div>
          )}
        </div>

        <DialogFooter className='flex-col justify-between gap-2 border-t pt-4 sm:flex-row'>
          <div className='flex flex-1 gap-2'>
            <Button variant='outline' onClick={handleCloseButton} className='flex items-center gap-2'>
              <XIcon className='h-4 w-4' />
              Cancel
            </Button>

            {!isEditing && (
              <Button
                variant='outline'
                onClick={() => {
                  if (showDownloadCheckboxes) {
                    handleDownload();
                  } else {
                    setDownloadSelections(initializeDownloadSelections());
                    setShowDownloadCheckboxes(true);
                  }
                }}
                disabled={loading || isDownloading}
                className='flex items-center gap-2'
              >
                <DownloadIcon className='h-4 w-4' />
                {isDownloading ? 'Downloading...' : showDownloadCheckboxes ? 'Download Selected' : 'Download'}
              </Button>
            )}
          </div>

          <div className='flex gap-2'>
            {!isEditing ? (
              <>
                {!showDownloadCheckboxes ? (
                  <Button variant='secondary' onClick={() => setIsEditing(true)} disabled={loading}>
                    Edit File Selection
                  </Button>
                ) : null}
                <Button
                  onClick={confirmProceed}
                  disabled={!canProceed || loadingProceed || loading}
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
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(false)}
                disabled={!canProceed}
                className='bg-primary text-white hover:bg-primary/90'
              >
                Confirm Selection
              </Button>
            )}
          </div>
        </DialogFooter>

        <FilePreviewModal
          open={previewState.open}
          onClose={() => setPreviewState(prev => ({ ...prev, open: false }))}
          filename={previewState.file?.filename || ''}
          group={selectedGroup}
          program={selectedProgram}
          project={selectedProject}
          multiple={previewState.fileList.length > 1}
          onNext={handleNextPreview}
          onPrev={handlePrevPreview}
          fileIndex={previewState.fileIndex}
          fileCount={previewState.fileList.length}
        />
      </DialogContent>
    </Dialog>
  );
}
