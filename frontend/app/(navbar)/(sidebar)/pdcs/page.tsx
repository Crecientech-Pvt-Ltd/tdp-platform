'use client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function PDCSPage() {
  const [selectedStudy, setSelectedStudy] = React.useState<string>('');

  const router = useRouter();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudy) {
      router.push(`/network?pdcs=1&study=${selectedStudy}`);
    }
  };

  return (
    <div className='w-full border rounded-lg shadow-md h-full'>
      <h2
        style={{
          background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
        }}
        className='text-2xl text-white rounded-t-lg font-semibold px-6 py-2 mb-6'
      >
        PDCS
      </h2>
      <div className='px-8 pt-4 pb-2 text-base text-gray-700'>
        <p>This section allows you to visualize transcriptomic data using three types of plots:</p>
        <ul className='list-disc pl-6 mt-2 space-y-1'>
          <li>
            <b>Transcript Expression Bar Plot:</b> Visualize the expression levels of a selected gene across different
            samples.
          </li>
          <li>
            <b>PCA Plot:</b> Explore the principal component analysis (PCA) of the dataset to observe clustering and
            variance among samples.
          </li>
          <li>
            <b>Volcano Plot:</b> Identify differentially expressed genes by plotting log fold change against statistical
            significance.
          </li>
        </ul>
      </div>
      {/* Description goes here */}
      <form onSubmit={handleSubmit} className='space-y-6 px-8 py-8'>
        <div>
          <Label htmlFor='study'>Select Study</Label>
          <Select value={selectedStudy} onValueChange={setSelectedStudy}>
            <SelectTrigger id='study'>
              <SelectValue placeholder='Select study' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='study1'>Study 1</SelectItem>
              <SelectItem value='study2'>Study 2</SelectItem>
              <SelectItem value='study3'>Study 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type='submit'
          className='w-full'
          style={{
            background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
          }}
        >
          Submit
        </Button>
      </form>
    </div>
  );
}
