'use client';

import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multiselect';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, X, Eye } from 'lucide-react';
import JSZip from 'jszip';
import FlexibleLabelList from '@/components/RenderLabel';
import FilePreviewModal from './FilePreviewModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

interface FileSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroup: string;
  selectedProgram: string;
  selectedProject: string;
}

interface FileOptions {
  gene: string[];
  transcript: string[];
  pca: string[];
  differentialexpression: string[];
  samplesheet: string[];
}

const filterCsvTsv = (files: string[]) =>
  files.filter(
    f => f.toLowerCase().endsWith('.csv') || f.toLowerCase().endsWith('.tsv') || f.toLowerCase().endsWith('.txt'),
  );

const truncateFilename = (filename: string, maxLength = 50) => {
  if (filename.length <= maxLength) return filename;
  const extension = filename.split('.').pop();
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4) + '...';
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

  const [fileOptions, setFileOptions] = React.useState<FileOptions>({
    gene: [],
    transcript: [],
    pca: [],
    differentialexpression: [],
    samplesheet: [],
  });

  const [selections, setSelections] = React.useState({
    gene: '',
    transcript: '',
    pca: '',
    differentialexpression: [] as string[],
    samplesheet: '',
  });

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewFile, setPreviewFile] = React.useState<{ filename: string; type: keyof FileOptions } | null>(null);
  const [previewFileList, setPreviewFileList] = React.useState<string[]>([]);
  const [previewFileIndex, setPreviewFileIndex] = React.useState(0);

  const canProceed = !loading;

  const getFileUrl = (filename: string) =>
    `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/files/${encodeURIComponent(filename)}`;

  const getDeFileUrl = (filename: string) =>
    `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/deFile/${encodeURIComponent(filename)}`;

  const orderFiles = (files: string[], type: keyof FileOptions) => {
    const keyword = type.toLowerCase();
    const filtered = filterCsvTsv(files);
    const matching = filtered.filter(f => f.toLowerCase().includes(keyword));
    const others = filtered.filter(f => !f.toLowerCase().includes(keyword));
    return [...matching, ...others];
  };

  React.useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setShowDownloadCheckboxes(false);
      setDownloadSelections(new Set());
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && selectedGroup && selectedProgram && selectedProject) {
      setLoading(true);

      const keys: (keyof FileOptions)[] = ['gene', 'transcript', 'pca', 'differentialexpression', 'samplesheet'];

      const fetchFileList = async (key: keyof FileOptions) => {
        const url = `${API_BASE}/data-commons/project/${encodeURIComponent(
          selectedGroup,
        )}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(
          selectedProject,
        )}/files/keys/${encodeURIComponent(key)}`;
        try {
          const res = await fetch(url);
          const json = await res.json();
          return [key, json.allFiles ?? json.filesHavingSameKey ?? []] as [keyof FileOptions, string[]];
        } catch (error) {
          console.error(`Failed to fetch files for ${key}:`, error);
          return [key, []] as [keyof FileOptions, string[]];
        }
      };

      Promise.all(keys.map(fetchFileList)).then(results => {
        const options: FileOptions = {
          gene: [],
          transcript: [],
          pca: [],
          differentialexpression: [],
          samplesheet: [],
        };
        results.forEach(([key, files]) => {
          options[key] = filterCsvTsv(files);
        });
        setFileOptions(options);

        setSelections({
          gene: options.gene.find(f => f.toLowerCase().includes('gene')) || '',
          transcript: options.transcript.find(f => f.toLowerCase().includes('transcript')) || '',
          pca: options.pca.find(f => f.toLowerCase().includes('pca')) || '',
          samplesheet: options.samplesheet.find(f => f.toLowerCase().includes('sample')) || '',
          differentialexpression: options.differentialexpression.filter(f =>
            f.toLowerCase().includes('differentialexpression'),
          ),
        });

        setLoading(false);
      });
    }
  }, [isOpen, selectedGroup, selectedProgram, selectedProject]);

  const handleChange = (type: keyof FileOptions, value: string | string[]) => {
    setSelections(prev => ({
      ...prev,
      [type]: value === '__none__' ? '' : value,
    }));
  };

  const handleCloseButton = () => {
    if (showDownloadCheckboxes) setShowDownloadCheckboxes(false);
    else if (isEditing) setIsEditing(false);
    else onClose();
  };

  const confirmProceed = () => {
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

    setTimeout(() => {
      window.open(url, '_blank');
      setLoadingProceed(false);
      onClose();
    }, 600);
  };

  const toggleDownloadSelection = (type: string) => {
    const newSelections = new Set(downloadSelections);
    if (newSelections.has(type)) {
      newSelections.delete(type);
    } else {
      newSelections.add(type);
    }
    setDownloadSelections(newSelections);
  };

  const getFilesToDownload = () => {
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
  };

  const handleDownload = async () => {
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

        let blob;
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

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const zip = new JSZip();

        for (const file of allFiles) {
          const fileUrl =
            file.type === 'differentialexpression' ? getDeFileUrl(file.filename) : getFileUrl(file.filename);
          const response = await fetch(fileUrl);

          if (file.type === 'differentialexpression') {
            const text = await response.text();
            const colonIndex = text.indexOf(':');
            if (colonIndex !== -1) {
              const fileData = text.substring(colonIndex + 1).trim();
              zip.file(file.filename, fileData);
            } else {
              zip.file(file.filename, text);
            }
          } else {
            const blob = await response.blob();
            zip.file(file.filename, blob);
          }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedProject}_files.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      setShowDownloadCheckboxes(false);
      setDownloadSelections(new Set());
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download files. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = (type: keyof FileOptions, filename?: string) => {
    if (type === 'differentialexpression') {
      const files = selections.differentialexpression;
      if (!files.length) return;
      setPreviewFileList(files);
      setPreviewFileIndex(filename ? files.indexOf(filename) : 0);
      setPreviewFile({ filename: filename || files[0], type });
      setPreviewOpen(true);
    } else {
      const file = selections[type] as string;
      if (!file) return;
      setPreviewFileList([file]);
      setPreviewFileIndex(0);
      setPreviewFile({ filename: file, type });
      setPreviewOpen(true);
    }
  };

  const handleNextPreview = () => {
    if (previewFileList.length > 1) {
      const nextIdx = (previewFileIndex + 1) % previewFileList.length;
      setPreviewFileIndex(nextIdx);
      setPreviewFile({ filename: previewFileList[nextIdx], type: previewFile?.type || 'differentialexpression' });
    }
  };
  const handlePrevPreview = () => {
    if (previewFileList.length > 1) {
      const prevIdx = (previewFileIndex - 1 + previewFileList.length) % previewFileList.length;
      setPreviewFileIndex(prevIdx);
      setPreviewFile({ filename: previewFileList[prevIdx], type: previewFile?.type || 'differentialexpression' });
    }
  };

  const renderRow = (label: string, type: keyof FileOptions, displayType: string) => {
    if (type === 'differentialexpression') {
      return (
        <div className='flex items-start gap-4 py-3 border-b last:border-b-0'>
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
                  <Label className='text-sm font-medium'>{displayType}</Label>
                  <span className='text-sm text-muted-foreground'>
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
                          <Eye className='h-4 w-4' />
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
                    rowsToShow={
                      fileOptions.differentialexpression.filter(file =>
                        file.toLowerCase().includes('differentialexpression'),
                      ).length
                    }
                  />
                )}
                {loading ? (
                  <div className='flex items-center justify-center py-4 border rounded-md bg-muted/50'>
                    <Spinner className='h-4 w-4 mr-2' />
                    <span className='text-sm text-muted-foreground'>Loading files...</span>
                  </div>
                ) : (
                  <MultiSelect
                    options={orderFiles(fileOptions.differentialexpression, 'differentialexpression').map(file => ({
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
                <div className='flex items-center gap-2 mb-2'>
                  <Label className='text-sm font-medium'>{displayType}</Label>
                  <span className='text-sm text-muted-foreground'>
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
                          <Eye className='h-4 w-4' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Preview File</TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className='bg-muted/50 rounded-md p-2 max-h-32 overflow-y-auto'>
                  {selections.differentialexpression.length === 0 ? (
                    <span className='text-sm text-muted-foreground'>No files selected</span>
                  ) : (
                    <div className='space-y-1'>
                      {selections.differentialexpression.map((file, index) => (
                        <div key={index} className='text-sm' title={file}>
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

    const allFiles = orderFiles(fileOptions[type], type);
    const selectedFile = selections[type] as string;

    return (
      <div className='flex items-start gap-4 py-3 border-b last:border-b-0'>
        {showDownloadCheckboxes && (
          <Checkbox
            checked={downloadSelections.has(type)}
            onCheckedChange={() => toggleDownloadSelection(type)}
            disabled={!selectedFile}
            className='mt-1'
          />
        )}
        <div className='flex-1'>
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
          {loading ? (
            <div className='flex items-center gap-2 py-2'>
              <Spinner className='h-4 w-4' />
              <span className='text-sm text-muted-foreground'>Loading files...</span>
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
                  <span className='text-sm text-muted-foreground'>None</span>
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
            <div className='bg-muted/50 rounded-md p-2'>
              <span className='text-sm' title={selectedFile}>
                {selectedFile ? truncateFilename(selectedFile, 60) : 'No file selected'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const initializeDownloadSelections = () => {
    const initialSelections = new Set<string>();

    if (selections.gene) initialSelections.add('gene');
    if (selections.transcript) initialSelections.add('transcript');
    if (selections.pca) initialSelections.add('pca');
    if (selections.samplesheet) initialSelections.add('samplesheet');
    if (selections.differentialexpression.length > 0) initialSelections.add('differentialexpression');

    return initialSelections;
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className='max-w-3xl w-[95vw] max-h-[85vh] flex flex-col'>
        <DialogTitle className='text-lg font-semibold'>
          {isEditing ? 'Edit Analysis Files' : 'Confirm File Selection'}
        </DialogTitle>

        <div className='flex-grow overflow-y-auto'>
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

        <DialogFooter className='gap-2 flex-col sm:flex-row justify-between border-t pt-4'>
          <div className='flex gap-2 flex-1'>
            <Button variant='outline' onClick={handleCloseButton} className='flex items-center gap-2'>
              <X className='h-4 w-4' />
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
                <Download className='h-4 w-4' />
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
                ) : (
                  <></>
                )}
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
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          filename={previewFile?.filename || ''}
          group={selectedGroup}
          program={selectedProgram}
          project={selectedProject}
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
