'use client';
import React from 'react';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multiselect';
import { Spinner } from '@/components/ui/spinner';
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

  const canProceed = !loading;

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

  const renderRow = (label: string, type: keyof FileOptions) => {
    if (type === 'differentialexpression') {
      return (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-start'>
          <div className='md:col-span-1 flex items-center justify-center min-h-[60px]'>
            <Label className='text-base font-semibold'>{label}</Label>
          </div>
          <div className='md:col-span-3 flex flex-col gap-3'>
            <div className='flex flex-col gap-2'>
              <span className='text-sm text-muted-foreground'>
                {' '}
                <strong>
                  {selections.differentialexpression.length > 0
                    ? `${selections.differentialexpression.length} files`
                    : 'None'}
                </strong>
              </span>
              {selections.differentialexpression.length > 0 && (
                <div className='max-h-32 overflow-y-auto bg-muted/50 rounded-md p-3 border'>
                  <div className='space-y-2'>
                    {selections.differentialexpression.map((file, index) => (
                      <div key={index} className='text-sm break-words' title={file}>
                        {index + 1}. {truncateFilename(file, 60)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            </div>
          </div>
        </div>
      );
    }

    const allFiles = orderFiles(fileOptions[type], type);
    const selectedFile = selections[type] as string;

    return (
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-start'>
        <div className='md:col-span-1 flex items-center justify-center min-h-[60px]'>
          <Label className='text-base font-semibold'>{label}</Label>
        </div>
        <div className='md:col-span-3 flex flex-col gap-2'>
          <span className='text-sm text-muted-foreground'>
            {' '}
            <strong className='block truncate max-w-full' title={selectedFile}>
              {selectedFile ? truncateFilename(selectedFile, 60) : 'None'}
            </strong>
          </span>
          <Select value={selectedFile || '__none__'} onValueChange={v => handleChange(type, v === '__none__' ? '' : v)}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder={`Select ${type} file`} />
            </SelectTrigger>
            <SelectContent side='bottom' align='start' className='max-w-[400px]'>
              <SelectItem key='none' value='__none__'>
                <span className='text-sm text-muted-foreground'>None</span>
              </SelectItem>
              {allFiles.map(file => (
                <SelectItem key={file} value={file}>
                  <span className='text-sm break-words max-w-[350px] block' title={file}>
                    {truncateFilename(file, 50)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen}>
      {isEditing ? (
        <DialogContent className='max-w-4xl w-[95vw] max-h-[90vh] min-h-[60vh] flex flex-col'>
          <DialogTitle className='text-lg font-semibold'>Edit Analysis Files</DialogTitle>
          <div className='flex-grow overflow-y-auto px-1 py-2'>
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='text-center text-gray-500'>
                  <Spinner className='mx-auto mb-4' />
                  Loading available files...
                </div>
              </div>
            ) : (
              <div className='space-y-4 max-w-full'>
                <div className='grid gap-4'>
                  {renderRow('Gene File', 'gene')}
                  {renderRow('Transcript File', 'transcript')}
                  {renderRow('Sample Sheet File', 'samplesheet')}
                  {renderRow('PCA File', 'pca')}
                  {renderRow('Differential Expression Files', 'differentialexpression')}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className='gap-2 flex-col sm:flex-row justify-between border-t pt-4'>
            <DialogClose asChild>
              <Button
                type='button'
                variant='secondary'
                onClick={() => {
                  setIsEditing(false);
                  onClose();
                }}
                className='w-full sm:w-auto order-2 sm:order-1'
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={() => setIsEditing(false)}
              disabled={!canProceed}
              className='bg-primary text-white hover:bg-primary/90 w-full sm:w-auto order-1 sm:order-2'
            >
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className='max-w-3xl w-[95vw] max-h-[85vh] flex flex-col'>
          <DialogTitle className='text-lg font-semibold'>Confirm File Selection</DialogTitle>
          <div className='flex-grow overflow-y-auto px-1 py-2'>
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-start'>
                <div className='md:col-span-1 flex items-center justify-center min-h-[60px]'>
                  <p className='font-semibold text-base'>Gene File:</p>
                </div>
                <div className='md:col-span-3'>
                  <div className='bg-muted/50 rounded-md p-3 border'>
                    <div className='text-sm break-words' title={selections.gene}>
                      {selections.gene || 'No file selected'}
                    </div>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-start'>
                <div className='md:col-span-1 flex items-center justify-center min-h-[60px]'>
                  <p className='font-semibold text-base'>Transcript File:</p>
                </div>
                <div className='md:col-span-3'>
                  <div className='bg-muted/50 rounded-md p-3 border'>
                    <div className='text-sm break-words' title={selections.transcript}>
                      {selections.transcript || 'No file selected'}
                    </div>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-start'>
                <div className='md:col-span-1 flex items-center justify-center min-h-[60px]'>
                  <p className='font-semibold text-base'>Sample Sheet File:</p>
                </div>
                <div className='md:col-span-3'>
                  <div className='bg-muted/50 rounded-md p-3 border'>
                    <div className='text-sm break-words' title={selections.samplesheet}>
                      {selections.samplesheet || 'No file selected'}
                    </div>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-start'>
                <div className='md:col-span-1 flex items-center justify-center min-h-[60px]'>
                  <p className='font-semibold text-base'>PCA File:</p>
                </div>
                <div className='md:col-span-3'>
                  <div className='bg-muted/50 rounded-md p-3 border'>
                    <div className='text-sm break-words' title={selections.pca}>
                      {selections.pca || 'No file selected'}
                    </div>
                  </div>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-4 items-start'>
                <div className='md:col-span-1 flex items-center justify-center min-h-[100px]'>
                  <p className='font-semibold text-base'>
                    Differential Expression Files ({selections.differentialexpression.length}):
                  </p>
                </div>
                <div className='md:col-span-3'>
                  <div className='bg-muted/50 rounded-md p-3 border max-h-48 overflow-y-auto'>
                    {selections.differentialexpression.length === 0 ? (
                      <div className='text-sm text-muted-foreground'>No files selected</div>
                    ) : (
                      <div className='space-y-2'>
                        {selections.differentialexpression.map((file, index) => (
                          <div key={index} className='text-sm break-words' title={file}>
                            {index + 1}. {file}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className='gap-2 flex-col sm:flex-row justify-between border-t pt-4'>
            <DialogClose asChild>
              <Button type='button' variant='ghost' onClick={onClose} className='w-full sm:w-auto order-3 sm:order-1'>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type='button'
              variant='secondary'
              onClick={() => setIsEditing(true)}
              className='w-full sm:w-auto order-2'
            >
              Edit Selection
            </Button>
            <Button
              onClick={confirmProceed}
              className='bg-primary text-white hover:bg-primary/90 w-full sm:w-auto order-1 sm:order-3'
              disabled={!canProceed || loadingProceed}
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
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
