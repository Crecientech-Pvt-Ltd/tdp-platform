'use client';

import PCA from '@/components/pdcs/PCA';
import TranscriptExpression from '@/components/pdcs/TranscriptExpression';
import VolcanoPlot from '@/components/pdcs/VolcanoPlot';
import { Spinner } from '@/components/ui/spinner';
import { DEFAULT_EDGE_COLOR } from '@/lib/data';
import '@react-sigma/core/lib/style.css';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import React from 'react';

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

function PDCSNetworkTabs({ study }: { study: string }) {
  const tabNames = [
    { key: 'transcript', label: 'Transcript-level expression' },
    { key: 'pca', label: 'PCA analysis' },
    { key: 'de', label: 'Differential expression analysis' },
  ];
  const [activeTab, setActiveTab] = React.useState(tabNames[0].key);

  return (
    <div className='w-full h-full flex flex-col'>
      <div className='flex border-b w-full'>
        {tabNames.map(tab => (
          <button
            key={tab.key}
            className={`flex-1 px-6 py-3 font-semibold text-center transition-colors duration-150
              ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary text-primary bg-primary/10'
                  : 'text-muted-foreground hover:bg-muted/50'
              }
            `}
            onClick={() => setActiveTab(tab.key)}
            style={{ minWidth: 0 }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className='flex-1 p-6'>
        <div>
          <b>PDCS Study:</b> {study}
        </div>
        <div className='mt-4'>
          {activeTab === 'transcript' && <TranscriptExpression></TranscriptExpression>}
          {activeTab === 'pca' && <PCA></PCA>}
          {activeTab === 'de' && <VolcanoPlot></VolcanoPlot>}
        </div>
      </div>
    </div>
  );
}

export default function NetworkPage() {
  const searchParams = useSearchParams();
  const isPDCS = searchParams?.get('pdcs') === '1';
  const study = searchParams?.get('study') || '';

  if (isPDCS) {
    return <PDCSNetworkTabs study={study} />;
  }
  return (
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
      }}
    />
  );
}
