import type { Shape } from 'plotly.js';
import { memo } from 'react';
import Plot from 'react-plotly.js';
import type { PointCounts, ProcessedData, ThresholdControls } from './types';

interface VolcanoPlotRendererProps {
  contrast: string;
  data: ProcessedData;
  counts: PointCounts;
  selectedGenes: Set<string>;
  xAxisColumn: string;
  yAxisColumn: string;
  useLog: boolean;
  thresholds: ThresholdControls;
  onPlotRelayout: (eventData: Record<string, unknown> | undefined) => void;
}

export const VolcanoPlotRenderer = memo(
  ({
    contrast,
    data,
    counts,
    selectedGenes,
    xAxisColumn,
    yAxisColumn,
    useLog,
    thresholds,
    onPlotRelayout,
  }: VolcanoPlotRendererProps) => {
    if (!data || data.points.length === 0) return null;

    const normalPoints = data.points.filter(p => p.color !== 'orange');
    const highlightedPoints = data.points.filter(p => p.color === 'orange');

    const createShapes = (): Partial<Shape>[] => {
      const thresholdY = useLog ? -Math.log10(thresholds.yThreshold) : thresholds.yThreshold;

      const shapes: Partial<Shape>[] = [];

      const safeYMin = Number.isFinite(data.bounds.yMin) ? data.bounds.yMin : 0;
      const safeYMax = Number.isFinite(data.bounds.yMax) ? data.bounds.yMax : useLog ? 10 : 1;
      const safeXMin = Number.isFinite(data.bounds.xMin) ? data.bounds.xMin : -5;
      const safeXMax = Number.isFinite(data.bounds.xMax) ? data.bounds.xMax : 5;

      shapes.push({
        type: 'line',
        x0: -thresholds.xThreshold,
        x1: -thresholds.xThreshold,
        y0: safeYMin,
        y1: safeYMax,
        xref: 'x',
        yref: 'y',
        line: { color: 'black', dash: 'dashdot', width: 2 },
      });

      shapes.push({
        type: 'line',
        x0: thresholds.xThreshold,
        x1: thresholds.xThreshold,
        y0: safeYMin,
        y1: safeYMax,
        xref: 'x',
        yref: 'y',
        line: { color: 'black', dash: 'dashdot', width: 2 },
      });

      if (Number.isFinite(thresholdY) && thresholdY >= safeYMin && thresholdY <= safeYMax) {
        shapes.push({
          type: 'line',
          y0: thresholdY,
          y1: thresholdY,
          x0: safeXMin,
          x1: safeXMax,
          xref: 'x',
          yref: 'y',
          line: { color: 'black', dash: 'dot', width: 2 },
        });
      }

      return shapes;
    };

    const plotData = [
      {
        x: normalPoints.map(p => p.x),
        y: normalPoints.map(p => p.y),
        text: normalPoints.map(p => `ID: ${p.text}`),
        type: 'scattergl' as const,
        mode: 'markers' as const,
        marker: {
          color: normalPoints.map(p => p.color),
          size: 6,
        },
        hoverinfo: 'text' as const,
        name: 'genes',
        showlegend: false,
      },
      ...(highlightedPoints.length > 0
        ? [
            {
              x: highlightedPoints.map(p => p.x),
              y: highlightedPoints.map(p => p.y),
              text: highlightedPoints.map(p => `ID: ${p.text} (Selected)`),
              type: 'scattergl' as const,
              mode: 'markers' as const,
              marker: {
                color: 'orange',
                size: 10,
                line: {
                  color: 'black',
                  width: 2,
                },
              },
              hoverinfo: 'text' as const,
              name: 'selected',
              showlegend: false,
            },
          ]
        : []),
    ];

    return (
      <div className='flex h-full w-full flex-col'>
        <div className='relative grow'>
          <Plot
            key={`${contrast}-${selectedGenes.size}`}
            data={plotData}
            layout={{
              xaxis: {
                title: { text: xAxisColumn, font: { size: 18 } },
                range: [
                  Math.min(Number.isFinite(data.bounds.xMin) ? data.bounds.xMin : -5, -thresholds.xThreshold - 0.5),
                  Math.max(Number.isFinite(data.bounds.xMax) ? data.bounds.xMax : 5, thresholds.xThreshold + 0.5),
                ],
                tickfont: { size: 15 },
              },
              yaxis: {
                title: {
                  text: useLog ? `-log10(${yAxisColumn})` : `${yAxisColumn}`,
                  font: { size: 15 },
                },
                range: [
                  Math.min(
                    Number.isFinite(data.bounds.yMin) ? data.bounds.yMin : 0,
                    Number.isFinite(useLog ? -Math.log10(thresholds.yThreshold) : thresholds.yThreshold)
                      ? (useLog ? -Math.log10(thresholds.yThreshold) : thresholds.yThreshold) - 0.5
                      : 0,
                  ),
                  Math.max(
                    Number.isFinite(data.bounds.yMax) ? data.bounds.yMax : useLog ? 10 : 1,
                    Number.isFinite(useLog ? -Math.log10(thresholds.yThreshold) : thresholds.yThreshold)
                      ? (useLog ? -Math.log10(thresholds.yThreshold) : thresholds.yThreshold) + 0.5
                      : useLog
                        ? 10
                        : 1,
                  ),
                ],
                tickfont: { size: 15 },
              },
              autosize: true,
              dragmode: 'pan',
              shapes: createShapes(),
              margin: { l: 45, r: 20, t: 5, b: 40 },
              plot_bgcolor: 'white',
              paper_bgcolor: 'white',
              showlegend: false,
            }}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
            config={{
              responsive: true,
              displaylogo: false,
              modeBarButtonsToRemove: ['select2d', 'lasso2d', 'resetScale2d'],
              editable: true,
              edits: {
                titleText: false,
                annotationText: false,
                legendText: false,
              },
            }}
            onRelayout={eventData => {
              try {
                onPlotRelayout(eventData);
              } catch (error) {
                console.warn('Plot relayout error:', error);
              }
            }}
          />
        </div>

        <div className='mt-2 rounded-lg border bg-gray-50 p-2 text-xs'>
          <div className='flex items-center justify-center gap-4'>
            <div className='flex items-center gap-1'>
              <div className='size-3 rounded-full bg-red-500'></div>
              <span>Up: {counts?.red || 0}</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='size-3 rounded-full bg-blue-500'></div>
              <span>Down: {counts?.blue || 0}</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='size-3 rounded-full bg-gray-500'></div>
              <span>None: {counts?.gray || 0}</span>
            </div>
            {selectedGenes.size > 0 && (
              <div className='flex items-center gap-1'>
                <div className='size-3 rounded-full border-2 border-black bg-orange-500'></div>
                <span>Selected: {selectedGenes.size}</span>
              </div>
            )}
            <div className='ml-2 border-l pl-2'>
              <span className='font-medium'>Total: {counts?.total || 0}</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
