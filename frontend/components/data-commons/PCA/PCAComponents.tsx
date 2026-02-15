import { InfoIcon } from 'lucide-react';
import type { PlotData } from 'plotly.js';
import type React from 'react';
import { memo } from 'react';
import Plot from 'react-plotly.js';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface GroupLegendProps {
  groupToColor: Record<string, string>;
  sampleDataExists: boolean;
}

export const GroupLegend = memo(function GroupLegend({ groupToColor, sampleDataExists }: GroupLegendProps) {
  if (!sampleDataExists) return null;

  const groupNames = Object.keys(groupToColor).sort();
  if (groupNames.length === 0) return null;

  return (
    <div className='mb-6 flex flex-wrap justify-center gap-4'>
      {groupNames.map(group => (
        <div key={group} className='flex items-center gap-2'>
          <span
            style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              background: groupToColor[group],
              borderRadius: 4,
              border: '1px solid #ccc',
            }}
          />
          <span className='font-medium text-sm'>{group}</span>
        </div>
      ))}
    </div>
  );
});

interface LoadingStateProps {
  children: React.ReactNode;
}

export function LoadingState({ children }: LoadingStateProps) {
  return (
    <div className='flex min-h-[60vh] items-center justify-center'>
      <div className='text-center text-gray-500'>
        <Spinner />
        <p className='mt-4'>{children}</p>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  children: React.ReactNode;
}

export function EmptyState({ children }: EmptyStateProps) {
  return (
    <div className='flex min-h-[60vh] items-center justify-center'>
      <div className='text-center font-medium text-gray-500 text-lg'>{children}</div>
    </div>
  );
}

interface PCAHeaderProps {
  xAxisColumn: string;
  yAxisColumn: string;
  onSeeMoreClick: () => void;
}

export const PCAHeader = memo(function PCAHeader({ xAxisColumn, yAxisColumn, onSeeMoreClick }: PCAHeaderProps) {
  return (
    <div className='mb-6 flex items-center justify-between'>
      <h2 className='flex-1 text-center font-semibold text-xl sm:text-2xl'>
        PCA Plot ({xAxisColumn} vs {yAxisColumn})
      </h2>
      <div className='flex gap-2'>
        <Button onClick={onSeeMoreClick} variant='outline' size='sm' className='flex items-center gap-2'>
          <InfoIcon className='size-4' />
          Settings
        </Button>
      </div>
    </div>
  );
});

interface PCAPlotProps {
  traces: Partial<PlotData>[];
  xAxisColumn: string;
  yAxisColumn: string;
}

export const PCAPlot = memo(function PCAPlot({ traces, xAxisColumn, yAxisColumn }: PCAPlotProps) {
  return (
    <div className='relative min-h-0 w-full flex-1'>
      <Plot
        data={traces}
        layout={{
          title: { text: 'PCA Plot', font: { size: 22 } },
          xaxis: {
            title: { text: xAxisColumn, font: { size: 18 } },
            automargin: true,
            tickangle: 0,
            tickfont: { size: 16 },
          },
          yaxis: {
            title: { text: yAxisColumn, font: { size: 18 } },
            tickfont: { size: 16 },
          },
          margin: { t: 60, l: 60, r: 40, b: 80 },
          autosize: true,
          showlegend: false,
        }}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
        config={{
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: [
            'pan2d',
            'select2d',
            'lasso2d',
            'resetScale2d',
            'zoomIn2d',
            'zoomOut2d',
            'autoScale2d',
            'zoom2d',
          ],
          displaylogo: false,
          toImageButtonOptions: {
            format: 'png',
            filename: `PCA_plot_${xAxisColumn}_vs_${yAxisColumn}`,
            height: 800,
            width: 1200,
            scale: 1,
          },
        }}
      />
    </div>
  );
});

interface PCALayoutProps {
  children: React.ReactNode;
}

export function PCALayout({ children }: PCALayoutProps) {
  return (
    <div className='mx-auto flex h-full min-h-0 w-full max-w-[95vw] flex-col px-4 sm:px-6 lg:max-w-[1400px] lg:px-8'>
      {children}
    </div>
  );
}
