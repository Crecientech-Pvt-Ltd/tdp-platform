'use client';

import { Spinner } from '@/components/ui/spinner';
import { DEFAULT_EDGE_COLOR } from '@/lib/data';
import '@react-sigma/core/lib/style.css';
import dynamic from 'next/dynamic';

const SigmaContainer = dynamic(() => import('@/components/graph').then(module => module.SigmaContainer), {
  loading: () => (
    <div className='w-full h-full grid place-items-center'>
      <div className='flex flex-col items-center'>
        <Spinner />
        Loading...
      </div>
    </div>
  ),
  ssr: false,
});

export default function NetworkPage() {
  return (
    <div className='w-full h-screen'>
      <SigmaContainer
        className='w-full h-full'
        settings={{
          enableEdgeEvents: true,
          defaultNodeType: 'circle',
          labelRenderedSizeThreshold: 0.75,
          labelDensity: 0.2,
          defaultEdgeColor: DEFAULT_EDGE_COLOR,
          labelSize: 10,
          defaultNodeColor: 'skyblue',
          zoomingRatio: 1.2,
          zIndex: true,
          renderEdgeLabels: true,
          minCameraRatio: 0.1,
          maxCameraRatio: 10,
          hideEdgesOnMove: false,
          hideLabelsOnMove: false,
          webgl: {
            antialias: true,
            preserveDrawingBuffer: true,
          },
        }}
      />
    </div>
  );
}

