'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useStore } from '@/lib/hooks';
import { Input } from '../ui/input';

export const FileName = () => {
  const searchParams = useSearchParams();
  const projectTitle = useStore(state => state.projectTitle);

  useEffect(() => {
    const fileName = searchParams?.get('file') ?? 'Untitled';
    useStore.setState({ projectTitle: fileName });
  }, [searchParams]);

  return (
    <Input
      className='max-w-fit font-semibold text-gray-200 text-sm'
      value={projectTitle}
      onChange={e => useStore.setState({ projectTitle: e.target.value })}
    />
  );
};
