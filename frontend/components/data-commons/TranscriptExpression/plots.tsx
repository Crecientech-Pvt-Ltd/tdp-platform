import { memo, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { calculateBottomMargin } from './utils';

interface PlotLayoutProps {
  geneDataMap: Record<string, { x: string[]; y: number[] }>;
  selectedGenesArray: string[];
  dataSource: 'gene' | 'transcript';
  getBarColors: (x: string[]) => string[];
  viewportHeight: number;
}

export function PlotLayout({
  geneDataMap,
  selectedGenesArray,
  dataSource,
  getBarColors,
  viewportHeight,
}: PlotLayoutProps) {
  const selectedGenesArrayMemo = useMemo(() => selectedGenesArray, [selectedGenesArray]);

  if (selectedGenesArrayMemo.length === 0) return null;

  return (
    <div className='h-[80%] w-full overflow-x-hidden overflow-y-hidden'>
      <div className='max-h-[90vh] w-full overflow-x-hidden overflow-y-hidden'>
        {selectedGenesArrayMemo.length === 1 ? (
          <SinglePlot
            gene={selectedGenesArrayMemo[0]}
            geneData={geneDataMap[selectedGenesArrayMemo[0]]}
            dataSource={dataSource}
            getBarColors={getBarColors}
            viewportHeight={viewportHeight}
          />
        ) : selectedGenesArrayMemo.length >= 3 ? (
          <MultiPlotGrid
            genes={selectedGenesArrayMemo}
            geneDataMap={geneDataMap}
            getBarColors={getBarColors}
            viewportHeight={viewportHeight}
            dataSource={dataSource}
            compact={true}
          />
        ) : (
          <MultiPlotGrid
            genes={selectedGenesArrayMemo.slice(0, 4)}
            geneDataMap={geneDataMap}
            getBarColors={getBarColors}
            viewportHeight={viewportHeight}
            dataSource={dataSource}
            compact={false}
          />
        )}
      </div>
    </div>
  );
}

interface SinglePlotProps {
  gene: string;
  geneData: { x: string[]; y: number[] };
  dataSource: 'gene' | 'transcript';
  getBarColors: (x: string[]) => string[];
  viewportHeight: number;
}

const SinglePlot = memo(function SinglePlot({
  gene,
  geneData,
  dataSource,
  getBarColors,
  viewportHeight,
}: SinglePlotProps) {
  const data = geneData || { x: [], y: [] };

  return (
    <div className='w-full' style={{ height: `${viewportHeight * 0.8 - 64}px` }}>
      <Plot
        data={[
          {
            x: data.x,
            y: data.y,
            type: 'bar',
            marker: {
              color: getBarColors(data.x),
            },
          },
        ]}
        layout={{
          title: {
            text: `${dataSource === 'gene' ? 'Gene' : 'Transcript'} Expression - ${gene}`,
            font: { size: 20 },
          },
          xaxis: {
            tickangle: 45,
            automargin: true,
            tickfont: { size: 15 },
          },
          yaxis: {
            title: { text: 'Total read count(millions)', font: { size: 20 }, standoff: 10 },
            tickfont: { size: 15 },
          },
          margin: {
            t: 60,
            l: 100,
            r: 40,
            b: calculateBottomMargin(data.x),
          },
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
            filename: `${dataSource}_expression_${gene}`,
            height: 800,
            width: 1200,
            scale: 1,
          },
        }}
      />
    </div>
  );
});

interface MultiPlotGridProps {
  genes: string[];
  geneDataMap: Record<string, { x: string[]; y: number[] }>;
  getBarColors: (x: string[]) => string[];
  viewportHeight: number;
  dataSource: 'gene' | 'transcript';
  compact: boolean;
}

function MultiPlotGrid({ genes, geneDataMap, getBarColors, viewportHeight, dataSource, compact }: MultiPlotGridProps) {
  const heightFactor = compact ? 0.44 : 0.75;
  const heightOffset = compact ? 80 : 120;
  const titleSize = compact ? 16 : 16;
  const yAxisTitle = compact ? 'Total read count' : 'Total read count (millions)';
  const yAxisTitleSize = compact ? 13 : 14;

  return (
    <div className='space-y-2'>
      <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
        {genes.map(gene => {
          const data = geneDataMap[gene] || { x: [], y: [] };
          const bottomMargin = calculateBottomMargin(data.x);

          return (
            <div className='w-full' key={gene} style={{ height: `${viewportHeight * heightFactor - heightOffset}px` }}>
              <Plot
                data={[
                  {
                    x: data.x,
                    y: data.y,
                    type: 'bar',
                    marker: {
                      color: getBarColors(data.x),
                    },
                  },
                ]}
                layout={{
                  title: { text: gene, font: { size: titleSize } },
                  xaxis: {
                    tickangle: 45,
                    automargin: true,
                    tickfont: { size: 13 },
                  },
                  yaxis: {
                    title: {
                      text: yAxisTitle,
                      font: { size: yAxisTitleSize },
                      standoff: 10,
                    },
                    tickfont: { size: 13 },
                  },
                  margin: {
                    t: 30,
                    l: 80,
                    r: 20,
                    b: bottomMargin,
                  },
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
                    filename: `${dataSource}_expression_${gene}`,
                    height: 600,
                    width: 800,
                    scale: 1,
                  },
                }}
              />
            </div>
          );
        })}
        {compact && genes.length % 2 !== 0 && <div className='invisible w-full'></div>}
      </div>
    </div>
  );
}
