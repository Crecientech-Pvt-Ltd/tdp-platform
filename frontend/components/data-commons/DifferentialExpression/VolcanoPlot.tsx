'use client';

import { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';
import type { Shape } from 'plotly.js';
import { MultiSelect } from '@/components/ui/multiselect';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import SeeMore from './DESeeMore';

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
  group: string;
  program: string;
  project: string;
}

export default function VolcanoPlot({ deFiles, group, program, project }: VolcanoPlotProps) {
  const [availableContrasts, setAvailableContrasts] = useState<string[]>([]);
  const [selectedContrasts, setSelectedContrasts] = useState<string[]>([]);
  const [debouncedContrasts, setDebouncedContrasts] = useState<string[]>([]);
  const [contrastData, setContrastData] = useState<Record<string, GenericRow[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [cutoff, setCutoff] = useState<number>(1);
  const [cutoffInput, setCutoffInput] = useState<string>('1');
  const [yThreshold, setYThreshold] = useState<number>(0.01);
  const [yThresholdInput, setYThresholdInput] = useState<string>('0.01');
  const [useLog, setUseLog] = useState<1 | 0>(1);
  const [showSeeMore, setShowSeeMore] = useState<boolean>(false);
  const [xAxisColumn, setXAxisColumn] = useState<string>('logFC');
  const [yAxisColumn, setYAxisColumn] = useState<string>('PValue');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [allDataLoaded, setAllDataLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!deFiles || Object.keys(deFiles).length === 0) {
      setAvailableContrasts([]);
      setSelectedContrasts([]);
      setAllDataLoaded(false);
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
    setAllDataLoaded(true);
    setLoading(false);
  }, [deFiles]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedContrasts(selectedContrasts), 150);
    return () => clearTimeout(timer);
  }, [selectedContrasts]);

  useEffect(() => {
    if (!deFiles) return;

    const toFetch = debouncedContrasts.filter(c => !contrastData[c]);
    const shouldRefetchAll =
      Object.keys(contrastData).length > 0 &&
      debouncedContrasts.some(c => contrastData[c] && contrastData[c].length > 0);

    const contrastsToProcess = shouldRefetchAll ? debouncedContrasts : toFetch;
    if (contrastsToProcess.length === 0) return;

    const newData: Record<string, GenericRow[]> = {};

    contrastsToProcess.forEach(contrast => {
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

            setAvailableColumns(prev => {
              const newColumns = Array.from(new Set([...prev, ...headers]));
              return newColumns;
            });

            const logFCKey =
              headers.find(h => h && /^log[ _-]?2?[ _-]?(?:fc|foldchange)$/i.test(h)) ||
              headers.find(h => h && /log/i.test(h));
            const pvalKey =
              headers.find(h => h && /^(?:adj|adjusted)[ _-]?p[ _-]?(?:val|value|values)$/i.test(h)) ||
              headers.find(h => h && /^p[ _-]?(?:adj|adjusted)(?:[ _-]?(?:val|value|values))?$/i.test(h)) ||
              headers.find(h => h && /^p[ _-]?(?:val|value|values)$/i.test(h)) ||
              headers.find(h => h && /^(?:f[ _-]?d[ _-]?r|false[ _-]?discovery[ _-]?rate)$/i.test(h));

            if (!logFCKey || !pvalKey) {
              console.warn(`Skipping file ${contrast} due to missing logFC or PValue columns`);
              return;
            }

            setXAxisColumn(prev => (prev === 'logFC' ? logFCKey : prev));
            setYAxisColumn(prev => (prev === 'PValue' ? pvalKey : prev));

            const filtered = results.data.filter(row => {
              return Object.values(row).some(value => value !== null && value !== undefined && value !== '');
            });

            newData[contrast] = filtered;
          },
        });
      }
    });

    setContrastData(prev => ({ ...prev, ...newData }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContrasts, deFiles]);

  const calculateBounds = (points: Point[]): Bounds => {
    if (points.length === 0) return { xMin: -1, xMax: 1, yMin: 0, yMax: 5 };
    const xVals = points.map(p => p.x);
    const yVals = points.map(p => p.y);
    const maxAbsX = Math.max(...xVals.map(Math.abs)) + 0.5;

    if (useLog === 1) {
      const maxY = Math.max(...yVals) + 0.5;
      return {
        xMin: -maxAbsX,
        xMax: maxAbsX,
        yMin: 0,
        yMax: maxY,
      };
    } else {
      const minY = Math.min(0, Math.min(...yVals) - 0.01);
      const maxY = Math.max(...yVals) + 0.01;
      return {
        xMin: -maxAbsX,
        xMax: maxAbsX,
        yMin: minY,
        yMax: maxY,
      };
    }
  };

  const processedData = useMemo<Record<string, ProcessedData>>(() => {
    const result: Record<string, ProcessedData> = {};

    debouncedContrasts.forEach(contrast => {
      const rawData = contrastData[contrast] || [];

      const idKey = availableColumns[0] || 'id';

      const points: Point[] = rawData
        .filter(row => {
          return (
            typeof row[xAxisColumn] === 'number' &&
            typeof row[yAxisColumn] === 'number' &&
            !isNaN(row[xAxisColumn] as number) &&
            !isNaN(row[yAxisColumn] as number)
          );
        })
        .map(row => {
          const xValue = row[xAxisColumn] as number;
          const pValue = row[yAxisColumn] as number;
          const yValue = useLog === 1 ? -Math.log10(pValue) : pValue;

          let color = 'gray';
          if (useLog === 1) {
            if (xValue >= cutoff && pValue <= yThreshold) color = 'red';
            else if (xValue <= -cutoff && pValue <= yThreshold) color = 'blue';
          } else {
            if (xValue >= cutoff && pValue >= yThreshold) color = 'red';
            else if (xValue <= -cutoff && pValue >= yThreshold) color = 'blue';
          }

          return {
            x: xValue,
            y: yValue,
            text: String(row[idKey] || row[''] || ''),
            color,
          };
        });

      result[contrast] = {
        points,
        bounds: calculateBounds(points),
      };
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contrastData, debouncedContrasts, cutoff, yThreshold, useLog, xAxisColumn, yAxisColumn, availableColumns]);

  const pointCounts = useMemo(() => {
    const counts: Record<string, { red: number; blue: number; gray: number; total: number }> = {};
    
    debouncedContrasts.forEach(contrast => {
      const data = processedData[contrast];
      if (data) {
        const red = data.points.filter(p => p.color === 'red').length;
        const blue = data.points.filter(p => p.color === 'blue').length;
        const gray = data.points.filter(p => p.color === 'gray').length;
        const total = data.points.length;
        
        counts[contrast] = { red, blue, gray, total };
      }
    });
    
    return counts;
  }, [processedData, debouncedContrasts]);

  const createShapes = (bounds: Bounds): Partial<Shape>[] => {
    const thresholdY = useLog === 1 ? -Math.log10(yThreshold) : yThreshold;
    return [
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
        y0: thresholdY,
        y1: thresholdY,
        x0: bounds.xMin,
        x1: bounds.xMax,
        xref: 'x',
        yref: 'y',
        line: { color: 'black', dash: 'dot', width: 2 },
      },
    ];
  };

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
        let newPValue: number;

        if (useLog === 1) {
          const logPValue = newValue;
          newPValue = Math.pow(10, -logPValue);
        } else {
          newPValue = newValue;
        }

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

  const handleColumnChange = (newXColumn: string, newYColumn: string) => {
    setXAxisColumn(newXColumn);
    setYAxisColumn(newYColumn);
  };

  const handleLogUsageChange = (logUsage: boolean) => {
    logUsage === true ? setUseLog(1) : setUseLog(0);
  };

  const seeMoreData = useMemo(() => {
    if (!deFiles) return [];

    return Object.keys(deFiles).map(filename => ({
      filename,
      description: `Differential expression analysis results for ${filename.replace(/^differentialexpression[-_]?/i, '').replace(/\.(csv|tsv|txt)$/i, '') || 'default contrast'}`,
      xDescription: `Log fold change values representing the magnitude of expression difference between conditions. Positive values indicate upregulation, negative values indicate downregulation.`,
      yDescription: `Statistical significance values (p-values) from differential expression testing. Lower values indicate higher confidence in the observed differences.`,
      columns: availableColumns,
    }));
  }, [deFiles, availableColumns]);

  const multiSelectOptions = availableContrasts
    .filter(c => c !== 'default')
    .map(contrast => ({
      label: contrast.toUpperCase(),
      value: contrast,
    }));

  const renderPlot = (contrast: string) => {
    const data = processedData[contrast];
    const counts = pointCounts[contrast];
    if (!data || data.points.length === 0) return null;
    return (
      <div className='w-full h-full flex flex-col'>
        <div className='relative flex-grow'>
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
            title: { text: xAxisColumn, font: { size: 10 } },
            range: [data.bounds.xMin, data.bounds.xMax],
            tickfont: { size: 9 },
          },
          yaxis: {
            title: {
              text: useLog === 1 ? `-log10(${yAxisColumn})` : `${yAxisColumn}`,
              font: { size: 10 },
            },
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
      </div>
      <div className="mt-2 p-2 border rounded-lg bg-gray-50 text-xs">
            <div className="font-semibold text-gray-700 mb-2 text-center">Point Counts</div>
            <div className="flex justify-center items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Up: {counts?.red || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Down: {counts?.blue || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>NS: {counts?.gray || 0}</span>
              </div>
              <div className="border-l pl-2 ml-2">
                <span className="font-medium">Total: {counts?.total || 0}</span>
              </div>
            </div>
          </div>
      </div>
    );
  };

  const showDropdown = availableContrasts.length > 1;

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);

    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  const processDataForDownload = (contrastName: string) => {
    if (!deFiles) return null;

    const deFileKeys = Object.keys(deFiles);
    const lowerKeyMap = Object.fromEntries(deFileKeys.map(original => [original.toLowerCase(), original]));

    let csvText = '';
    if (
      contrastName === 'default' &&
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
        const key1 = `differentialexpression_${contrastName}.${ext}`.toLowerCase();
        const key2 = `differentialexpression-${contrastName}.${ext}`.toLowerCase();
        matchedKey = lowerKeyMap[key1] || lowerKeyMap[key2];
        if (matchedKey) break;
      }

      if (matchedKey) {
        csvText = deFiles[matchedKey];
      }
    }

    if (!csvText) return null;

    return new Promise<{ rawData: GenericRow[]; points: Point[] } | null>(resolve => {
      Papa.parse<GenericRow>(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: results => {
          const headers = results.meta.fields ?? [];
          const idKey = headers[0] || 'id';
          let logFCKey = xAxisColumn;
          let pvalKey = yAxisColumn;

          if (!headers.includes(logFCKey)) {
            logFCKey =
              headers.find(h => h && /^log[ _-]?2?[ _-]?(?:fc|foldchange)$/i.test(h)) ||
              headers.find(h => h && /log/i.test(h)) ||
              'logFC';
          }

          if (!headers.includes(pvalKey)) {
            pvalKey =
              headers.find(h => h && /^(?:adj|adjusted)[ _-]?p[ _-]?(?:val|value|values)$/i.test(h)) ||
              headers.find(h => h && /^p[ _-]?(?:adj|adjusted)(?:[ _-]?(?:val|value|values))?$/i.test(h)) ||
              headers.find(h => h && /^p[ _-]?(?:val|value|values)$/i.test(h)) ||
              headers.find(h => h && /^(?:f[ _-]?d[ _-]?r|false[ _-]?discovery[ _-]?rate)$/i.test(h)) ||
              'PValue';
          }

          const filtered = results.data.filter(row => {
            const idValue = idKey in row ? row[idKey] : row[''] || '';
            return (
              typeof row[logFCKey!] === 'number' &&
              typeof row[pvalKey!] === 'number' &&
              (typeof idValue === 'string' || typeof idValue === 'number')
            );
          });

          const points: Point[] = filtered.map(row => {
            const logFC = row[logFCKey!] as number;
            const pValue = row[pvalKey!] as number;
            const yValue = useLog === 1 ? -Math.log10(pValue) : pValue;

            let color = 'gray';
            if (useLog === 1) {
              if (logFC >= cutoff && pValue <= yThreshold) color = 'red';
              else if (logFC <= -cutoff && pValue <= yThreshold) color = 'blue';
            } else {
              if (logFC >= cutoff && pValue >= yThreshold) color = 'red';
              else if (logFC <= -cutoff && pValue >= yThreshold) color = 'blue';
            }

            return {
              x: logFC,
              y: yValue,
              text: String(idKey in row ? row[idKey] : row[''] || ''),
              color,
            };
          });

          resolve({ rawData: filtered, points });
        },
      });
    });
  };

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

  if ((!deFiles || Object.keys(deFiles).length === 0) && allDataLoaded) {
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

  return (
    <div className='w-full px-4 sm:px-6 lg:px-8 max-w-[95vw] lg:max-w-[1500px] mx-auto'>
      <div className='mb-8'>
        <div className='max-w-4xl mx-auto mb-6'>
          <div className='flex flex-wrap items-center gap-4'>
            {showDropdown && (
              <div className='flex-1 min-w-[300px]'>
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

            <div className='flex items-center gap-4 flex-shrink-0'>
              <div className='flex flex-col items-center'>
                <label className='text-sm font-medium text-gray-700 mb-1 whitespace-nowrap'>X-Axis Cutoff:</label>
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

              <div className='flex flex-col items-center'>
                <label className='text-sm font-medium text-gray-700 mb-1 whitespace-nowrap'>Y-Axis Threshold:</label>
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

              <div className='flex flex-col items-center'>
                <div className='h-[20px]'></div>
                <Button
                  onClick={() => setShowSeeMore(true)}
                  variant='outline'
                  size='sm'
                  className='flex items-center gap-2'
                >
                  <Info className='h-4 w-4' />
                  See More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='w-full overflow-x-auto overflow-y-auto' style={{ maxHeight: `${viewportHeight * 0.9}px` }}>
        {debouncedContrasts.length > 0 && (
          <div className='space-y-2 h-full'>
            {debouncedContrasts.length === 1 ? (
              <div className='w-full' style={{ height: `${viewportHeight * 0.8 - 64}px` }}>
                <h3 className='text-center font-semibold text-lg mb-4'>
                  {debouncedContrasts[0] === 'default'
                    ? 'Differential Expression'
                    : debouncedContrasts[0].toUpperCase()}
                </h3>
                <div className='w-full h-[75%]'>{renderPlot(debouncedContrasts[0])}</div>
              </div>
            ) : (
              <div
                className={`grid gap-3 h-full ${debouncedContrasts.length >= 3 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2'}`}
              >
                {debouncedContrasts.map(contrast => (
                  <div
                    key={contrast}
                    className='w-full'
                    style={{
                      height:
                        debouncedContrasts.length >= 3
                          ? `${viewportHeight * 0.4 - 64}px`
                          : debouncedContrasts.length === 2
                            ? `${viewportHeight * 0.75 - 96}px`
                            : `${viewportHeight * 0.8 - 128}px`,
                    }}
                  >
                    <div className='h-full'>
                      <h3
                        className={`text-center font-semibold ${debouncedContrasts.length >= 3 ? 'text-sm mb-1' : 'text-lg mb-4'}`}
                      >
                        {contrast === 'default' ? 'Differential Expression' : contrast.toUpperCase()}
                      </h3>
                      <div
                        className='w-full'
                        style={{
                          height:
                            debouncedContrasts.length >= 3
                              ? `${viewportHeight * 0.4 - 96}px`
                              : `${viewportHeight * 0.75 - 144}px`,
                        }}
                      >
                        {renderPlot(contrast)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {debouncedContrasts.length === 0 && !loading && (
        <div className='text-center py-12'>
          <p className='text-gray-500 text-lg'>Select contrasts to view their volcano plots</p>
        </div>
      )}

      <SeeMore
        isOpen={showSeeMore}
        onClose={() => setShowSeeMore(false)}
        dataFiles={seeMoreData}
        currentXColumn={xAxisColumn}
        currentYColumn={yAxisColumn}
        onColumnChange={handleColumnChange}
        changeUseOfLog={handleLogUsageChange}
        isLogUsed={useLog === 1 ? true : false}
        availableContrasts={availableContrasts}
        processDataForDownload={processDataForDownload}
        currentSettings={{
          cutoff,
          yThreshold,
          useLog: useLog === 1,
          xAxisColumn,
          yAxisColumn,
        }}
        selectedContrasts={selectedContrasts}
        group={group}
        program={program}
        project={project}
      />
    </div>
  );
}
