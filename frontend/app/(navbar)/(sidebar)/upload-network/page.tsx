'use client';
import { useLazyQuery } from '@apollo/client/react';
import { LoaderIcon } from 'lucide-react';
import Image from 'next/image';
import React, { useId } from 'react';
import { toast } from 'sonner';
import PopUpTable from '@/components/PopUpTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENE_VERIFICATION_QUERY } from '@/lib/gql';
import type { GeneVerificationData, GeneVerificationVariables } from '@/lib/interface';
import { distinct, openDB } from '@/lib/utils';

export default function UploadFile() {
  const [file, setFile] = React.useState<File | null>(null);
  const [fileType, setFileType] = React.useState<'csv' | 'json'>('csv');
  const [fetchData, { data, loading }] = useLazyQuery<GeneVerificationData, GeneVerificationVariables>(
    GENE_VERIFICATION_QUERY,
  );
  const [tableOpen, setTableOpen] = React.useState(false);
  const [geneIDs, setGeneIDs] = React.useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file?.name.split('.').pop() !== fileType) {
      toast.error('Invalid file type', {
        cancel: { label: 'Close', onClick() {} },
        description: `Please upload a ${fileType.toUpperCase()} file`,
      });
      return;
    }
    setFile(file);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please upload a file', {
        cancel: { label: 'Close', onClick() {} },
      });
      return;
    }
    let distinctSeedGenes: string[];
    if (fileType === 'json') {
      const data = JSON.parse(await file.text());
      distinctSeedGenes = distinct(
        data
          .flatMap((gene: Record<string, string | number>) => {
            return Object.values(gene).filter(val => Number.isNaN(Number(val)));
          })
          .map((gene: string) => gene.trim().toUpperCase()),
      );
    } else {
      const data = await file.text();
      distinctSeedGenes = distinct(
        data
          .split('\n')
          .slice(1)
          .flatMap(line => line.split(',').slice(0, 2))
          .map(gene => gene.trim().toUpperCase())
          .filter(Boolean),
      );
    }
    if (distinctSeedGenes.length < 2) {
      toast.error('Please provide at least 2 valid genes', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Seed genes should be either ENSG IDs or gene names',
      });
      return;
    }
    const { error } = await fetchData({
      variables: { geneIDs: distinctSeedGenes },
    });
    if (error) {
      console.error(error);
      toast.error('Error fetching data', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Server not available,Please try again later',
      });
      return;
    }
    setGeneIDs(distinctSeedGenes);
    setTableOpen(true);
  };

  const handleGenerateGraph = async () => {
    const store = await openDB('network', 'readwrite');
    if (!store) {
      toast.error('Failed to open IndexedDB database', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Please make sure you have enabled IndexedDB in your browser',
      });
      return;
    }
    store.put(file, file?.name);
    toast.success('File uploaded successfully', {
      cancel: { label: 'Close', onClick() {} },
    });
    window.open(`/network?file=${encodeURIComponent(file?.name as string)}`, '_blank', 'noopener,noreferrer');
  };

  const uploadFileId = useId();
  const fileTypeId = useId();

  return (
    <div className='mx-auto h-full rounded-lg border shadow-md'>
      <h2
        style={{
          background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
        }}
        className='mb-6 rounded-t-lg px-6 py-2 font-semibold text-2xl text-white'
      >
        Upload your Network
      </h2>
      <form action={handleSubmit}>
        <div className='space-y-4 px-8'>
          <div>
            <Label htmlFor={fileTypeId}>Select File Type</Label>
            <Select value={fileType} onValueChange={val => setFileType(val as 'csv' | 'json')}>
              <SelectTrigger id={fileTypeId}>
                <SelectValue placeholder='Select file type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='csv'>CSV</SelectItem>
                <SelectItem value='json'>JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className='flex items-center justify-between'>
              <Label htmlFor={uploadFileId}>Upload {fileType.toUpperCase()}</Label>
              <p className='text-xs text-zinc-500 sm:text-sm lg:text-base'>
                (1st & 2nd columns need to be ENSG IDs or Gene name,
                <br />
                while 3rd column should be interaction score; examples:{' '}
                <a href={'/example1.csv'} download className='underline'>
                  #1
                </a>{' '}
                <a href={'/example2.csv'} download className='underline'>
                  #2
                </a>
                )
              </p>
            </div>
            <Input
              id={uploadFileId}
              type='file'
              accept='.csv,.json'
              onChange={handleFileChange}
              required
              className='h-9 cursor-pointer border-2 hover:border-dashed'
            />
          </div>
          <Button
            style={{
              background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
            }}
            type='submit'
            className='w-full'
          >
            {loading && <LoaderIcon className='mr-2 animate-spin' size={20} />} Submit
          </Button>
        </div>
      </form>
      <PopUpTable
        geneIDs={geneIDs}
        tableOpen={tableOpen}
        setTableOpen={setTableOpen}
        data={data}
        handleGenerateGraph={handleGenerateGraph}
      />
      <div className='mt-6 px-8'>
        <h3 className='mb-2 font-semibold text-lg'>File Format</h3>
        <Image
          src={'/image/uploadFormat.png'}
          width={400}
          height={400}
          alt='CSV file format example'
          className='mx-auto w-full max-w-3xl mix-blend-multiply'
        />
      </div>
    </div>
  );
}
