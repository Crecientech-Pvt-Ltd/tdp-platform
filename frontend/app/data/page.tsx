'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { TabsContent } from '@/components/ui/tabs';

const TranscriptTab = dynamic(
  () =>
    import('@/components/data-commons/TranscriptExpression/TranscriptTab').then(mod => ({
      default: mod.TranscriptTab,
    })),
  {
    ssr: false,
    loading: () => (
      <div className='flex items-center justify-center p-8'>
        <Spinner />
      </div>
    ),
  },
);

const PCATab = dynamic(() => import('@/components/data-commons/PCA/PCATab').then(mod => ({ default: mod.PCATab })), {
  ssr: false,
  loading: () => (
    <div className='flex items-center justify-center p-8'>
      <Spinner />
    </div>
  ),
});

const DETab = dynamic(
  () => import('@/components/data-commons/DifferentialExpression/DETab').then(mod => ({ default: mod.DETab })),
  {
    ssr: false,
    loading: () => (
      <div className='flex items-center justify-center p-8'>
        <Spinner />
      </div>
    ),
  },
);

function PDCSNetworkTabs() {
  const searchParams = useSearchParams();
  const group = searchParams?.get('group');
  const program = searchParams?.get('program');
  const project = searchParams?.get('project');
  const deFile = searchParams?.get('deFiles');
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const deFilesArray = deFile?.split(',');

  const getFileUrl = (filename: string) =>
    `${API_BASE}/data-commons/project/${encodeURIComponent(group ?? '')}/${encodeURIComponent(program ?? '')}/${encodeURIComponent(project ?? '')}/files/${encodeURIComponent(filename)}`;

  return (
    <>
      <TabsContent value='transcript' className='mt-0 h-full flex-1 p-6'>
        <div className='mt-4'>
          <TranscriptTab group={group ?? ''} program={program ?? ''} project={project ?? ''} />
        </div>
      </TabsContent>

      <TabsContent value='pca' className='mt-0 h-full flex-1 p-6'>
        <div className='mt-4'>
          <PCATab group={group ?? ''} program={program ?? ''} project={project ?? ''} />
        </div>
      </TabsContent>

      <TabsContent value='de' className='mt-0 h-full flex-1 p-6'>
        <div className='mt-4'>
          <DETab
            deFilesArray={deFilesArray}
            getFileUrl={getFileUrl}
            group={group ?? ''}
            program={program ?? ''}
            project={project ?? ''}
          />
        </div>
      </TabsContent>
    </>
  );
}

export default function NetworkPage() {
  return (
    <div className='flex h-full w-full flex-col'>
      <Suspense
        fallback={
          <div className='flex min-h-screen flex-col items-center justify-center'>
            <Spinner className='h-12 w-12' />
            <p className='mt-4 text-gray-600 text-lg'>Loading components...</p>
          </div>
        }
      >
        <PDCSNetworkTabs />
      </Suspense>
    </div>
  );
}
