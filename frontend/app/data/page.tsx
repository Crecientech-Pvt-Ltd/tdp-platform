'use client';

import '@react-sigma/core/lib/style.css';
import { useSearchParams, useRouter } from 'next/navigation';
import React from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
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
  const uploadMode = searchParams?.get('uploadMode');
  const group = searchParams?.get('group');
  const program = searchParams?.get('program');
  const project = searchParams?.get('project');
  const deFile = searchParams?.get('deFiles');
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const deFilesArray = deFile?.split(',');

  const getFileUrl = (filename: string) =>
    `${API_BASE}/data-commons/project/${encodeURIComponent(group ?? '')}/${encodeURIComponent(program ?? '')}/${encodeURIComponent(project ?? '')}/files/${encodeURIComponent(filename)}`;

  React.useEffect(() => {
    if (uploadMode === 'true') {
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    if (!group || !program || !project) {
      router.push('/data-commons');
      return;
    }

    const checkAuthentication = async () => {
      const authKey = `auth_${group}_${program}_${project}`;
      const isAuthenticated = sessionStorage.getItem(authKey) === 'authenticated';

      if (isAuthenticated) {
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/data-commons/project/${encodeURIComponent(group)}/${encodeURIComponent(program)}/${encodeURIComponent(project)}/password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: '' }),
          },
        );

        if (!response.ok) {
          console.error('Password check failed:', response.status);
          router.push('/data-commons');
          return;
        }

        const result = await response.json();

        if (result.hasPassword) {
          router.push('/data-commons');
        } else {
          sessionStorage.setItem(authKey, 'authenticated');
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Password check error:', error);
        router.push('/data-commons');
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [group, program, project, router, API_BASE]);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen'>
        <Spinner className='h-12 w-12' />
        <p className='mt-4 text-lg text-gray-600'>Checking project access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2 className='text-2xl font-semibold mb-2'>Access Required</h2>
          <p className='text-muted-foreground mb-4'>Redirecting to authentication...</p>
          <Spinner className='mx-auto' />
        </div>
      </div>
    );
  }

  return (
    <>
      <TabsContent value='transcript' className='flex-1 p-6 mt-0 h-full'>
        <div className='mt-4'>
          <TranscriptTab group={group ?? ''} program={program ?? ''} project={project ?? ''} />
        </div>
      </TabsContent>

      <TabsContent value='pca' className='flex-1 p-6 mt-0 h-full'>
        <div className='mt-4'>
          <PCATab group={group ?? ''} program={program ?? ''} project={project ?? ''} />
        </div>
      </TabsContent>

      <TabsContent value='de' className='flex-1 p-6 mt-0 h-full'>
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
    <div className='w-full h-full flex flex-col'>
      <Suspense
        fallback={
          <div className='flex flex-col items-center justify-center min-h-screen'>
            <Spinner className='h-12 w-12' />
            <p className='mt-4 text-lg text-gray-600'>Loading components...</p>
          </div>
        }
      >
        <PDCSNetworkTabs />
      </Suspense>
    </div>
  );
}
