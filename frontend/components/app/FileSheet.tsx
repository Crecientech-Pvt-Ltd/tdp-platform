'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { DISEASE_DEPENDENT_PROPERTIES, DISEASE_INDEPENDENT_PROPERTIES } from '@/lib/data';
import { useStore } from '@/lib/hooks';
import type { RadioOptions, UniversalData } from '@/lib/interface';
import { P_VALUE_REGEX, formatBytes, initRadioOptions, openDB } from '@/lib/utils';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Trash2, Upload } from 'lucide-react';
import { Link } from 'next-view-transitions';
import Papa from 'papaparse';
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

export function FileSheet() {
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [checkedOptions, setCheckedOptions] = React.useState<Record<string, boolean>>({});
  const geneNameToID = useStore(state => state.geneNameToID);

  React.useEffect(() => {
    openDB('files', 'readonly').then(store => {
      if (!store) {
        toast.error('Failed to open IndexedDB database', {
          cancel: { label: 'Close', onClick() {} },
          description: 'Please make sure you have enabled IndexedDB in your browser',
        });
        return;
      }
      const request = store.getAll();
      request.onsuccess = () => {
        setUploadedFiles(request.result);
        const checkedOptions: Record<string, boolean> = {};
        for (const file of request.result) {
          checkedOptions[file.name] = false;
        }
        setCheckedOptions(checkedOptions);
      };
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles, fileRejections) => {
      const store = await openDB('files', 'readwrite');
      if (!store) {
        toast.error('Failed to open IndexedDB database', {
          cancel: { label: 'Close', onClick() {} },
          description: 'Please make sure you have enabled IndexedDB in your browser',
        });
        return;
      }
      const filesToAdd: File[] = [];
      const newCheckedOptions: Record<string, boolean> = {};

      for (const file of acceptedFiles) {
        const request = store.put(file, file.name);
        request.onerror = ev => console.error(ev);
        request.onsuccess = () => {
          filesToAdd.push(file);
          newCheckedOptions[file.name] = true;

          // Check if all files have been processed
          if (filesToAdd.length === acceptedFiles.length) {
            setUploadedFiles(prev => {
              const seen = new Set();
              return [...filesToAdd, ...prev].filter(file => {
                if (seen.has(file.name)) return false;
                seen.add(file.name);
                return true;
              });
            });
            setCheckedOptions(prev => ({ ...prev, ...newCheckedOptions }));
          }
        };
      }
      if (fileRejections.length > 0) {
        const rejectedFiles = fileRejections.map(r => r.file.name).join(', ');
        toast.error(`Files rejected: ${rejectedFiles}`, {
          cancel: { label: 'Close', onClick() {} },
          description: 'Please make sure files are in CSV format',
        });
      }
    },
    accept: { 'text/csv': ['.csv'] },
  });

  const handleCheckboxChange = (fileName: string) => {
    const updatedCheckedOptions = {
      ...checkedOptions,
      [fileName]: !checkedOptions[fileName],
    };
    setCheckedOptions(updatedCheckedOptions);
  };

  const removeFile = async (name?: string) => {
    setUploadedFiles(name ? uploadedFiles.filter(file => file.name !== name) : []);
    setShowConfirmDialog(false);
    const store = await openDB('files', 'readwrite');
    if (!store) {
      toast.error('Failed to open IndexedDB database', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Please make sure you have enabled IndexedDB in your browser',
      });
      return;
    }
    if (name) store.delete(name).onerror = ev => console.error(ev);
    else {
      store.clear().onerror = ev => console.error(ev);
    }
  };

  const handleConfirmDialogChange = (checked: CheckedState) => {
    sessionStorage.setItem('showConfirmDialog', JSON.stringify(!checked));
  };

  const handleUniversalUpdate = async () => {
    const universalData: UniversalData = useStore.getState().universalData;
    const radioOptions: RadioOptions = {
      database: useStore.getState().radioOptions.database,
      user: initRadioOptions(),
    };
    for (const file of uploadedFiles) {
      if (!checkedOptions[file.name]) continue;
      const store = await openDB('files', 'readonly');
      if (!store) {
        toast.error('Failed to open IndexedDB database', {
          cancel: { label: 'Close', onClick() {} },
          description: 'Please make sure you have enabled IndexedDB in your browser',
        });
        return;
      }
      const request = store.get(file.name);
      request.onsuccess = async () => {
        const data = await (request.result as File).text();
        const parsedData = Papa.parse<Record<string, string>>(data, {
          header: true,
          skipEmptyLines: true,
        });
        const IDHeaderName = parsedData.meta.fields?.[0];
        if (!IDHeaderName) {
          toast.error(`Invalid file: ${file.name}`, {
            cancel: { label: 'Close', onClick() {} },
            description: 'Please check the file and try again',
          });
          return;
        }
        try {
          for (const row of parsedData.data) {
            const firstValue = row[IDHeaderName];
            const geneID = firstValue.startsWith('ENSG') ? firstValue : geneNameToID.get(firstValue?.toUpperCase());
            if (!geneID || !universalData[geneID]) continue;
            for (const prop in row) {
              if (prop === IDHeaderName) continue;

              // GWAS alias of Genetics
              if (/^GWAS_/i.test(prop)) {
                universalData[geneID].user.Genetics[prop.replace(/^GWAS_/i, '')] = row[prop];
                continue;
              }

              // GDA alias of OpenTargets
              if (/^GDA_/i.test(prop)) {
                universalData[geneID].user.OpenTargets[prop.replace(/^GDA_/i, '')] = row[prop];
                continue;
              }

              // P_Val alias of DEG
              if (P_VALUE_REGEX.test(prop)) {
                universalData[geneID].user.LogFC[prop] = row[prop];
                continue;
              }

              for (const field of [...DISEASE_DEPENDENT_PROPERTIES, ...DISEASE_INDEPENDENT_PROPERTIES]) {
                const fieldRegex = new RegExp(`^${field}_`, 'i');
                if (fieldRegex.test(prop)) {
                  universalData[geneID].user[field][`[USER] ${prop.replace(fieldRegex, '')}`] = row[prop];
                  break;
                }
              }
            }
          }
          for (const prop of parsedData.meta.fields ?? []) {
            if (prop === IDHeaderName) continue;

            // GWAS alias of Genetics
            if (/^GWAS_/i.test(prop)) {
              radioOptions.user.Genetics.push(`[USER] ${prop.replace(/^GWAS_/i, '')}`);
              continue;
            }

            // GDA alias of OpenTargets
            if (/^GDA_/i.test(prop)) {
              radioOptions.user.OpenTargets.push(`[USER] ${prop.replace(/^GDA_/i, '')}`);
              continue;
            }

            // P_Val alias of DEG
            if (P_VALUE_REGEX.test(prop)) {
              radioOptions.user.LogFC.push(prop);
              continue;
            }

            for (const field of [...DISEASE_DEPENDENT_PROPERTIES, ...DISEASE_INDEPENDENT_PROPERTIES]) {
              const fieldRegex = new RegExp(`^${field}_`, 'i');
              if (fieldRegex.test(prop)) {
                radioOptions.user[field].push(`[USER] ${prop.replace(fieldRegex, '')}`);
                break;
              }
            }
          }
          useStore.setState({ universalData, radioOptions });
        } catch (error) {
          console.error(error);
          toast.error('Error updating universal data', {
            cancel: { label: 'Close', onClick() {} },
          });
          return;
        }
      };
    }
    if (uploadedFiles.length) {
      toast.success('Data updated successfully', {
        cancel: { label: 'Close', onClick() {} },
        description: 'You can now play your uploaded data!',
      });
    }
  };

  const handleReset = async () => {
    setCheckedOptions(value => {
      const updatedCheckedOptions = { ...value };
      for (const key in updatedCheckedOptions) {
        updatedCheckedOptions[key] = false;
      }
      return updatedCheckedOptions;
    });
    useStore.setState({
      radioOptions: {
        database: useStore.getState().radioOptions.database,
        user: initRadioOptions(),
      },
    });
    toast.info('Data reset successfully', {
      cancel: { label: 'Close', onClick() {} },
    });
  };

  return (
    <div>
      <div className='flex flex-col lg:flex-row gap-2 justify-between'>
        <Sheet>
          <SheetTrigger asChild>
            <Button size='sm' className='w-full'>
              <Upload className='h-3 w-3 mr-1' />
              Upload Files
            </Button>
          </SheetTrigger>
          <SheetContent side='bottom'>
            <SheetHeader>
              <SheetTitle>Uploaded Files</SheetTitle>
              <SheetDescription>
                Manage your uploaded files here. <br />
                To know more about the file format, click{' '}
                <Link
                  className='font-semibold underline'
                  href='/docs/network-visualization/left-panel#file-format'
                  target='_blank'
                >
                  here ↗
                </Link>
                .
              </SheetDescription>
            </SheetHeader>
            <div className='py-4'>
              <div
                className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-4 cursor-pointer'
                {...getRootProps()}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p>Drop the files here ...</p>
                ) : (
                  <p>Drag &apos;n&apos; drop some files here, or click to select files</p>
                )}
              </div>
              {uploadedFiles.length ? (
                <div className='flex flex-row-reverse'>
                  <Button size='sm' className='mb-2' variant='destructive' onClick={() => setShowConfirmDialog(true)}>
                    Delete All
                  </Button>
                </div>
              ) : null}
              <AlertDialog open={showConfirmDialog}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className='text-black'>
                      This action cannot be undone. This will permanently delete all the files.
                    </AlertDialogDescription>
                    <div className='flex items-center space-x-2 mt-4'>
                      <Checkbox id='terms' onCheckedChange={handleConfirmDialogChange} />
                      <Label
                        htmlFor='terms'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        Do not show again
                      </Label>
                    </div>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeFile()}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <ScrollArea className='h-[200px]'>
                {uploadedFiles.map(file => (
                  <div
                    key={file.name}
                    className='flex justify-between items-center mb-2 p-2 bg-white border shadow rounded'
                  >
                    <div>
                      <div className='text-sm font-medium flex gap-4'>
                        <Checkbox
                          id={file.name}
                          checked={checkedOptions[file.name] || false}
                          onCheckedChange={() => handleCheckboxChange(file.name)}
                        />
                        {file.name}
                      </div>
                      <span className='text-xs text-gray-500 ml-8'>
                        Date: {new Date(file.lastModified).toLocaleString()} | Size: {formatBytes(file.size)}
                      </span>
                    </div>
                    <Button variant='ghost' size='icon' onClick={() => removeFile(file.name)}>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </div>
            <SheetFooter>
              <SheetTrigger asChild>
                <Button onClick={handleUniversalUpdate} className='w-full'>
                  Submit
                </Button>
              </SheetTrigger>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Button variant={'default'} size={'sm'} className='w-full' onClick={handleReset}>
          Reset Uploads
        </Button>
      </div>
      <div className='text-xs text-primary italic mt-2'>
        <b>NOTE:</b> The uploaded files will be stored in your browser&apos;s local storage and is not shared with
        anyone.
      </div>
    </div>
  );
}
