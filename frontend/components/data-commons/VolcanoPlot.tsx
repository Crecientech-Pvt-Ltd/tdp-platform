'use client';

import { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';
import type { Shape } from 'plotly.js';
import { MultiSelect } from '../ui/multiselect';
import { Spinner } from '@/components/ui/spinner';
type GenericRow = Record<string, string | number | null>;

type Point = {
  x: number;
  y: number;
  text: string;
  color: string;
};

type Bounds = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

type ProcessedData = {
  points: Point[];
  bounds: Bounds;
};

interface VolcanoPlotProps {
  contrastUrl?: string;
  deFiles?: Record<string, string>;
}

export default function VolcanoPlot({ deFiles }: VolcanoPlotProps) {
  const [availableContrasts, setAvailableContrasts] = useState<string[]>([]);
  const [selectedContrasts, setSelectedContrasts] = useState<string[]>([]);
  const [debouncedContrasts, setDebouncedContrasts] = useState<string[]>([]);
  const [contrastData, setContrastData] = useState<Record<string, { id: string; logFC: number; PValue: number }[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [cutoff, setCutoff] = useState<number>(1);
  const [cutoffInput, setCutoffInput] = useState<string>('1');
  const [yThreshold, setYThreshold] = useState<number>(0.01);
  const [yThresholdInput, setYThresholdInput] = useState<string>('0.01');

  useEffect(() => {
    if (!deFiles || Object.keys(deFiles).length === 0) {
      setAvailableContrasts([]);
      setSelectedContrasts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const contrastNames = Object.keys(deFiles).map(filename => {
      const lowerCaseFileName = filename.toLowerCase();
      if (
        lowerCaseFileName === 'differentialexpression.csv' ||
        lowerCaseFileName === 'differentialexpression.tsv' ||
        lowerCaseFileName === 'differentialexpression.txt'
      )
        return 'default';
      const match = lowerCaseFileName.match(/^differentialexpression[-_](.+)\.(csv|tsv|txt)$/);
      return match ? match[1] : filename;
    });
    setAvailableContrasts(contrastNames);
    setSelectedContrasts([contrastNames[0]]);
    setLoading(false);
  }, [deFiles]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedContrasts(selectedContrasts), 150);
    return () => clearTimeout(timer);
  }, [selectedContrasts]);

  useEffect(() => {
    if (!deFiles) return;
    const toFetch = debouncedContrasts.filter(c => !contrastData[c]);
    if (toFetch.length === 0) return;

    const newData: Record<string, { id: string; logFC: number; PValue: number }[]> = {};

    toFetch.forEach(contrast => {
      let csvText = '';
      const deFileKeys = Object.keys(deFiles);
      const lowerKeyMap = Object.fromEntries(deFileKeys.map(original => [original.toLowerCase(), original]));

      if (
        contrast === 'default' &&
        (lowerKeyMap['differentialexpression.csv'] ||
          lowerKeyMap['differentialexpression.tsv'] ||
          lowerKeyMap['differentialexpression.txt'])
      ) {
        csvText =
          deFiles[lowerKeyMap['differentialexpression.csv']] ||
          deFiles[lowerKeyMap['differentialexpression.tsv']] ||
          deFiles[lowerKeyMap['differentialexpression.txt']];
      } else {
        const extensions = ['csv', 'tsv', 'txt'];
        let matchedKey: string | undefined;

        for (const ext of extensions) {
          const key1 = `differentialexpression_${contrast}.${ext}`.toLowerCase();
          const key2 = `differentialexpression-${contrast}.${ext}`.toLowerCase();
          matchedKey = lowerKeyMap[key1] || lowerKeyMap[key2];
          if (matchedKey) break;
        }

        if (matchedKey) {
          csvText = deFiles[matchedKey];
        }
      }

      if (csvText) {
        Papa.parse<GenericRow>(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: results => {
            const headers = results.meta.fields ?? [];

            const idKey = headers[0] || 'id';
            const logFCKey =
              headers.find(h => h && h.toLowerCase() === 'logfc') || headers.find(h => h && /fc/i.test(h));
            const pvalKey =
              headers.find(h => h && h.toLowerCase() === 'pvalue') || headers.find(h => h && /p[\s\-]?val/i.test(h));

            if (!logFCKey || !pvalKey) {
              console.warn(`Skipping file ${contrast} due to missing logFC or PValue columns`);
              return;
            }

            const filtered = results.data.filter(row => {
              const idValue = idKey in row ? row[idKey] : row[''] || '';
              return (
                typeof row[logFCKey!] === 'number' &&
                typeof row[pvalKey!] === 'number' &&
                (typeof idValue === 'string' || typeof idValue === 'number')
              );
            });

            newData[contrast] = filtered.map(row => ({
              id: String(idKey in row ? row[idKey] : row[''] || ''),
              logFC: row[logFCKey!] as number,
              PValue: row[pvalKey!] as number,
            }));
            setContrastData(prev => ({ ...prev, ...newData }));
          },
        });
      }
    });
  }, [debouncedContrasts, deFiles, contrastData]);

  const allDataLoaded = debouncedContrasts.every(c => contrastData[c] && contrastData[c].length > 0);

  const calculateBounds = (points: Point[]): Bounds => {
    if (points.length === 0) return { xMin: -1, xMax: 1, yMin: 0, yMax: 5 };
    const xVals = points.map(p => p.x);
    const yVals = points.map(p => p.y);
    const maxAbsX = Math.max(...xVals.map(Math.abs)) + 0.5;
    const maxY = Math.max(...yVals) + 0.5;
    return {
      xMin: -maxAbsX,
      xMax: maxAbsX,
      yMin: 0,
      yMax: maxY,
    };
  };

  const processedData = useMemo<Record<string, ProcessedData>>(() => {
    const result: Record<string, ProcessedData> = {};
    debouncedContrasts.forEach(contrast => {
      const rawData = contrastData[contrast] || [];
      const points: Point[] = rawData.map(d => {
        const logP = -Math.log10(d.PValue);
        let color = 'gray';
        if (d.logFC >= cutoff && d.PValue <= yThreshold) color = 'red';
        else if (d.logFC <= -cutoff && d.PValue <= yThreshold) color = 'blue';
        return { x: d.logFC, y: logP, text: d.id, color };
      });
      result[contrast] = {
        points,
        bounds: calculateBounds(points),
      };
    });
    return result;
  }, [contrastData, debouncedContrasts, cutoff, yThreshold]);

  const createShapes = (bounds: Bounds): Partial<Shape>[] => [
    {
      type: 'line',
      x0: -cutoff,
      x1: -cutoff,
      y0: bounds.yMin,
      y1: bounds.yMax,
      xref: 'x',
      yref: 'y',
      line: { color: 'black', dash: 'dashdot', width: 2 },
    },
    {
      type: 'line',
      x0: cutoff,
      x1: cutoff,
      y0: bounds.yMin,
      y1: bounds.yMax,
      xref: 'x',
      yref: 'y',
      line: { color: 'black', dash: 'dashdot', width: 2 },
    },
    {
      type: 'line',
      y0: -Math.log10(yThreshold),
      y1: -Math.log10(yThreshold),
      x0: bounds.xMin,
      x1: bounds.xMax,
      xref: 'x',
      yref: 'y',
      line: { color: 'black', dash: 'dot', width: 2 },
    },
  ];

  const handlePlotRelayout = (eventData: Record<string, unknown> | undefined) => {
    if (!eventData) return;
    Object.keys(eventData).forEach(key => {
      const match = key.match(/shapes\[(\d+)\]\.(.+)/);
      if (!match) return;
      const shapeIndex = Number.parseInt(match[1]);
      const property = match[2];
      const newValue = eventData[key];
      if (
        (shapeIndex === 0 || shapeIndex === 1) &&
        (property === 'x0' || property === 'x1') &&
        typeof newValue === 'number'
      ) {
        const newCutoff = Math.abs(newValue);
        if (newCutoff !== cutoff && newCutoff >= 0) {
          setCutoff(newCutoff);
          setCutoffInput(newCutoff.toFixed(2));
        }
      } else if (shapeIndex === 2 && (property === 'y0' || property === 'y1') && typeof newValue === 'number') {
        const logPValue = newValue;
        const newPValue = Math.pow(10, -logPValue);
        if (newPValue > 0 && newPValue <= 1 && Math.abs(newPValue - yThreshold) > 1e-6) {
          setYThreshold(newPValue);
          setYThresholdInput(newPValue < 0.001 ? newPValue.toExponential(2) : newPValue.toFixed(4));
        }
      }
    });
  };

  const handleContrastChange = (values: string[]) => {
    if (values.length <= 4) setSelectedContrasts(values);
  };

  const multiSelectOptions = availableContrasts
    .filter(c => c !== 'default')
    .map(contrast => ({
      label: contrast.toUpperCase(),
      value: contrast,
    }));

  const renderPlot = (contrast: string) => {
    const data = processedData[contrast];
    if (!data || data.points.length === 0) return null;
    return (
      <Plot
        data={[
          {
            x: data.points.map(p => p.x),
            y: data.points.map(p => p.y),
            text: data.points.map(p => `ID: ${p.text}`),
            type: 'scattergl',
            mode: 'markers',
            marker: {
              color: data.points.map(p => p.color),
              size: 6,
            },
            hoverinfo: 'text',
          },
        ]}
        layout={{
          xaxis: {
            title: { text: 'logFC', font: { size: 10 } },
            range: [data.bounds.xMin, data.bounds.xMax],
            tickfont: { size: 9 },
          },
          yaxis: {
            title: { text: '-log10(PValue)', font: { size: 10 } },
            range: [data.bounds.yMin, data.bounds.yMax],
            tickfont: { size: 9 },
          },
          autosize: true,
          dragmode: 'pan',
          shapes: createShapes(data.bounds),
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
          modeBarButtons: [['toImage', 'zoom2d', 'pan2d', 'resetScale2d']],
          editable: true,
          edits: {
            titleText: false,
            annotationText: false,
            legendText: false,
          },
        }}
        onRelayout={handlePlotRelayout}
      />
    );
  };

  const showDropdown = availableContrasts.length > 1;

  if (!deFiles || Object.keys(deFiles).length === 0) {
    return (
      <div className='w-full px-4 sm:px-6 lg:px-8 max-w-[95vw] lg:max-w-[1500px] mx-auto'>
        <div className='min-h-[60vh] flex flex-col items-center justify-center'>
          <p className='text-gray-500 text-lg font-medium'>
            Kindly add Differential Expression files to view the plots.
          </p>
        </div>
      </div>
    );
  }

  if (loading || !allDataLoaded) {
    return (
      <div className='w-full px-4 sm:px-6 lg:px-8 max-w-[95vw] lg:max-w-[1500px] mx-auto'>
        <div className='min-h-[60vh] flex flex-col items-center justify-center'>
          <Spinner />
          <p className='text-gray-500 text-lg mt-4'>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full px-4 sm:px-6 lg:px-8 max-w-[95vw] lg:max-w-[1500px] mx-auto'>
      <div className='mb-8'>
        <div className='max-w-4xl mx-auto mb-6'>
          <div className='flex flex-col md:flex-row gap-4 items-start'>
            {showDropdown && (
              <div className='flex-1'>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Select Contrasts (up to 4):</label>
                <div className='max-w-[620px]'>
                  <MultiSelect
                    options={multiSelectOptions}
                    selectedValues={selectedContrasts}
                    onChange={handleContrastChange}
                    placeholder='Select contrasts...'
                    className='truncate'
                  />
                </div>
                {selectedContrasts.length > 0 && (
                  <p className='text-xs text-gray-500 mt-1'>
                    {selectedContrasts.length} contrast{selectedContrasts.length !== 1 ? 's' : ''} selected
                    {selectedContrasts.length >= 4 && ' (maximum reached)'}
                  </p>
                )}
              </div>
            )}

            <div className='flex gap-4 items-start pt-[5px]'>
              <div className='flex flex-col'>
                <label className='text-sm font-medium text-gray-700 mb-1'>logFC Cutoff:</label>
                <input
                  type='number'
                  value={cutoffInput}
                  onChange={e => {
                    setCutoffInput(e.target.value);
                    const val = Number.parseFloat(e.target.value);
                    if (!isNaN(val)) setCutoff(Math.abs(val));
                  }}
                  onBlur={() => {
                    if (cutoffInput.trim() === '') {
                      setCutoff(1);
                      setCutoffInput('1');
                    }
                  }}
                  className='border px-2 py-1 w-20 text-center rounded'
                />
              </div>

              <div className='flex flex-col'>
                <label className='text-sm font-medium text-gray-700 mb-1'>P-Value Threshold:</label>
                <input
                  type='number'
                  value={yThresholdInput}
                  onChange={e => {
                    setYThresholdInput(e.target.value);
                    const val = Number.parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0 && val <= 1) setYThreshold(val);
                  }}
                  onBlur={() => {
                    if (yThresholdInput.trim() === '') {
                      setYThreshold(0.01);
                      setYThresholdInput('0.01');
                    }
                  }}
                  className='border px-2 py-1 w-20 text-center rounded'
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {debouncedContrasts.length > 0 && (
        <div className='w-full overflow-x-auto overflow-y-auto max-h-[90vh]'>
          {debouncedContrasts.length === 1 ? (
            <div className='w-full min-h-[60vh] md:min-h-[65vh] xl:min-h-[70vh]'>
              <h3 className='text-center font-semibold text-lg mb-4'>
                {debouncedContrasts[0] === 'default' ? 'Differential Expression' : debouncedContrasts[0].toUpperCase()}
              </h3>
              <div className='w-full h-full'>{renderPlot(debouncedContrasts[0])}</div>
            </div>
          ) : (
            <div className='space-y-2'>
              <div
                className={`grid gap-3 ${debouncedContrasts.length >= 3 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2'}`}
              >
                {debouncedContrasts.map(contrast => (
                  <div
                    key={contrast}
                    className={`w-full ${debouncedContrasts.length >= 3 ? 'h-[280px]' : 'min-h-[400px] md:min-h-[450px] xl:min-h-[500px]'}`}
                  >
                    <div className='h-full'>
                      <h3
                        className={`text-center font-semibold ${debouncedContrasts.length >= 3 ? 'text-sm mb-1' : 'text-lg mb-4'}`}
                      >
                        {contrast === 'default' ? 'Differential Expression' : contrast.toUpperCase()}
                      </h3>
                      <div className={debouncedContrasts.length >= 3 ? 'h-[240px]' : 'w-full h-[calc(100%-3rem)]'}>
                        {renderPlot(contrast)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {debouncedContrasts.length === 0 && !loading && (
        <div className='text-center py-12'>
          <p className='text-gray-500 text-lg'>Select contrasts to view their volcano plots</p>
        </div>
      )}
    </div>
  );
}
