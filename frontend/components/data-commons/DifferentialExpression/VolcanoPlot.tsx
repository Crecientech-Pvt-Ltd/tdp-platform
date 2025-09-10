'use client';

import { useEffect, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';
import type { Shape } from 'plotly.js';
import { MultiSelect } from '@/components/ui/multiselect';
import { VirtualizedCombobox } from '@/components/VirtualizedCombobox';
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
  const [xThreshold, setXThreshold] = useState<number>(1);
  const [xThresholdInput, setXThresholdInput] = useState<string>('1');
  const [yThreshold, setYThreshold] = useState<number>(0.01);
  const [yThresholdInput, setYThresholdInput] = useState<string>('0.01');
  const [useLog, setUseLog] = useState<1 | 0>(1);
  const [showSeeMore, setShowSeeMore] = useState<boolean>(false);
  const [xAxisColumn, setXAxisColumn] = useState<string>('logFC');
  const [yAxisColumn, setYAxisColumn] = useState<string>('PValue');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [allDataLoaded, setAllDataLoaded] = useState<boolean>(false);
  const [selectedGenes, setSelectedGenes] = useState<Set<string>>(new Set());
  const [availableGenes, setAvailableGenes] = useState<string[]>([]);
  const [, setLayoutKey] = useState(0);
  const [, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [debouncedLayoutKey,] = useState(0);

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
    const allGenes = new Set<string>();

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

            const idKey = headers[0] || 'id';
            filtered.forEach(row => {
              const geneId = String(row[idKey] || row[''] || '');
              if (geneId.trim()) {
                allGenes.add(geneId);
              }
            });

            newData[contrast] = filtered;
          },
        });
      }
    });

    setContrastData(prev => ({ ...prev, ...newData }));
    setAvailableGenes(Array.from(allGenes).sort());
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
          const geneId = String(row[idKey] || row[''] || '');

          let color = 'gray';
          if (useLog === 1) {
            if (xValue >= xThreshold && pValue <= yThreshold) color = 'red';
            else if (xValue <= -xThreshold && pValue <= yThreshold) color = 'blue';
          } else {
            if (xValue >= xThreshold && pValue >= yThreshold) color = 'red';
            else if (xValue <= -xThreshold && pValue >= yThreshold) color = 'blue';
          }

          if (selectedGenes.has(geneId)) {
            color = 'orange';
          }

          return {
            x: xValue,
            y: yValue,
            text: geneId,
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
  }, [
    contrastData,
    debouncedContrasts,
    xThreshold,
    yThreshold,
    useLog,
    xAxisColumn,
    yAxisColumn,
    availableColumns,
    selectedGenes,
  ]);

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
    const clampedThresholdY = Math.max(bounds.yMin, Math.min(thresholdY, bounds.yMax));
    return [
      {
        type: 'line',
        x0: -xThreshold,
        x1: -xThreshold,
        y0: bounds.yMin,
        y1: bounds.yMax,
        xref: 'x',
        yref: 'y',
        line: { color: 'black', dash: 'dashdot', width: 2 },
      },
      {
        type: 'line',
        x0: xThreshold,
        x1: xThreshold,
        y0: bounds.yMin,
        y1: bounds.yMax,
        xref: 'x',
        yref: 'y',
        line: { color: 'black', dash: 'dashdot', width: 2 },
      },
      {
        type: 'line',
        y0: clampedThresholdY,
        y1: clampedThresholdY,
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
      const yMatch = key.match(/shapes\[2\]\.(y0|y1)/);
      if (yMatch) {
        const newValue = eventData[key];
        if (typeof newValue !== 'number') return;

        let newPValue: number;
        if (useLog === 1) {
          const logPValue = newValue;
          newPValue = Math.pow(10, -logPValue);
        } else {
          newPValue = newValue;
        }

        if (newPValue > 0 && newPValue <= 1) {
          setYThreshold(newPValue);
          setYThresholdInput(newPValue < 0.001 ? newPValue.toExponential(2) : newPValue.toFixed(4));
        }
      }

      const xMatch = key.match(/shapes\[([01])\]\.(x0|x1)/);
      if (xMatch) {
        const newValue = eventData[key];
        if (typeof newValue !== 'number') return;

        const newCutoff = Math.abs(newValue);
        if (newCutoff >= 0) {
          setXThreshold(newCutoff);
          setXThresholdInput(newCutoff.toFixed(2));
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

    const normalPoints = data.points.filter(p => p.color !== 'orange');
    const highlightedPoints = data.points.filter(p => p.color === 'orange');

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
      <div className='w-full h-full flex flex-col'>
        <div className='relative flex-grow'>
          <Plot
            key={`${contrast}-${debouncedLayoutKey}-${selectedGenes.size}`}
            data={plotData}
            layout={{
              xaxis: {
                title: { text: xAxisColumn, font: { size: 18 } },
                range: [data.bounds.xMin, data.bounds.xMax],
                tickfont: { size: 15 },
              },
              yaxis: {
                title: {
                  text: useLog === 1 ? `-log10(${yAxisColumn})` : `${yAxisColumn}`,
                  font: { size: 15 },
                },
                range: [data.bounds.yMin, data.bounds.yMax],
                tickfont: { size: 15 },
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
            onRelayout={eventData => {
              try {
                handlePlotRelayout(eventData);
              } catch (error) {
                console.warn('Plot relayout error:', error);
              }
            }}
          />
        </div>
        <div className='mt-2 p-2 border rounded-lg bg-gray-50 text-xs'>
          <div className='flex justify-center items-center gap-4'>
            <div className='flex items-center gap-1'>
              <div className='w-3 h-3 bg-red-500 rounded-full'></div>
              <span>Up: {counts?.red || 0}</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
              <span>Down: {counts?.blue || 0}</span>
            </div>
            <div className='flex items-center gap-1'>
              <div className='w-3 h-3 bg-gray-500 rounded-full'></div>
              <span>None: {counts?.gray || 0}</span>
            </div>
            {selectedGenes.size > 0 && (
              <div className='flex items-center gap-1'>
                <div className='w-3 h-3 bg-orange-500 rounded-full border-2 border-black'></div>
                <span>Selected: {selectedGenes.size}</span>
              </div>
            )}
            <div className='border-l pl-2 ml-2'>
              <span className='font-medium'>Total: {counts?.total || 0}</span>
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
      setLayoutKey(prev => prev + 1);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerDimensions({ width, height });
        // Debounce layout key changes
        setTimeout(() => {
          setLayoutKey(prev => prev + 1);
        }, 150);
      }
    });

    const container = document.querySelector('.resizable-panel-container');
    if (container) {
      resizeObserver.observe(container);
    }

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);

    const handleLayoutChange = () => {
      setTimeout(() => {
        setLayoutKey(prev => prev + 1);
      }, 300);
    };

    const observer = new MutationObserver(handleLayoutChange);
    const targetNode = document.body;
    observer.observe(targetNode, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['class', 'style'] 
    });

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      resizeObserver.disconnect();
      observer.disconnect();
    };
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
              typeof row[logFCKey] === 'number' &&
              typeof row[pvalKey] === 'number' &&
              (typeof idValue === 'string' || typeof idValue === 'number')
            );
          });

          const points: Point[] = filtered.map(row => {
            const logFC = row[logFCKey] as number;
            const pValue = row[pvalKey] as number;
            const yValue = useLog === 1 ? -Math.log10(pValue) : pValue;

            let color = 'gray';
            if (useLog === 1) {
              if (logFC >= xThreshold && pValue <= yThreshold) color = 'red';
              else if (logFC <= -xThreshold && pValue <= yThreshold) color = 'blue';
            } else {
              if (logFC >= xThreshold && pValue >= yThreshold) color = 'red';
              else if (logFC <= -xThreshold && pValue >= yThreshold) color = 'blue';
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
    <div className='w-full px-4 sm:px-6 lg:px-8 max-w-[95vw] lg:max-w-[1500px] mx-auto resizable-panel-container'>
      <div className='mb-1'>
        <div className='bg-gray-50 rounded-lg p-2 border'>
          <div className='flex flex-wrap items-center gap-2 sm:gap-3 text-sm'>
            {showDropdown && (
              <div className='flex items-center gap-1 sm:gap-2 min-w-0'>
                <label className='text-xs font-medium text-gray-700 whitespace-nowrap'>Contrasts:</label>
                <div className='w-40 sm:w-52 md:w-64 lg:w-80 xl:w-96 relative z-10 min-w-0'>
                  <MultiSelect
                    options={multiSelectOptions}
                    selectedValues={selectedContrasts}
                    onChange={handleContrastChange}
                    placeholder='Select...'
                    className='text-xs w-full'
                  />
                </div>
              </div>
            )}

            <div className='flex items-center gap-2 sm:gap-3'>
              <div className='flex items-center gap-1'>
                <label className='text-xs font-medium text-gray-700 whitespace-nowrap'>X:</label>
                <input
                  type='number'
                  value={xThresholdInput}
                  onChange={e => {
                    setXThresholdInput(e.target.value);
                    const val = Number.parseFloat(e.target.value);
                    if (!isNaN(val)) setXThreshold(Math.abs(val));
                  }}
                  onBlur={() => {
                    if (xThresholdInput.trim() === '') {
                      setXThreshold(1);
                      setXThresholdInput('1');
                    }
                  }}
                  className='border px-1 py-0.5 w-12 sm:w-16 text-center rounded text-xs'
                />
              </div>

              <div className='flex items-center gap-1'>
                <label className='text-xs font-medium text-gray-700 whitespace-nowrap'>Y:</label>
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
                  className='border px-1 py-0.5 w-12 sm:w-16 text-center rounded text-xs'
                />
              </div>
            </div>

            {availableGenes.length > 0 && (
              <div className='flex items-center gap-1 sm:gap-2 min-w-0 flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg'>
                <label className='text-xs font-medium text-gray-700 whitespace-nowrap'>Genes:</label>
                <div className='w-full relative z-10 min-w-0'>
                  <VirtualizedCombobox
                    data={availableGenes}
                    value={selectedGenes}
                    onChange={value => setSelectedGenes(value as Set<string>)}
                    placeholder='Search...'
                    multiselect={true}
                    showSelectedAsChip={true}
                    showSelectAll={false}
                    showClearAll={true}
                    className='text-xs w-full'
                    width='100%'
                  />
                </div>
              </div>
            )}

            <div className='ml-auto'>
              <Button
                onClick={() => setShowSeeMore(true)}
                variant='outline'
                size='sm'
                className='flex items-center gap-1 h-6 sm:h-7 px-2'
              >
                <Info className='h-3 w-3' />
                <span className='text-xs hidden sm:inline'>Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className='w-full overflow-x-auto overflow-y-auto' style={{ maxHeight: `${viewportHeight * 0.9}px` }}>
        {debouncedContrasts.length > 0 && (
          <div className='space-y-2 h-full'>
            {debouncedContrasts.length === 1 ? (
              <div className='w-full' style={{ height: `${viewportHeight * 0.8 - 16}px` }}>
                <h3 className='text-center font-semibold text-lg mb-2'>
                  {debouncedContrasts[0] === 'default'
                    ? 'Differential Expression'
                    : debouncedContrasts[0].toUpperCase()}
                </h3>
                <div className='w-full h-[calc(100%-2rem)]'>{renderPlot(debouncedContrasts[0])}</div>
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
                          ? `${viewportHeight * 0.4 - 16}px`
                          : debouncedContrasts.length === 2
                            ? `${viewportHeight * 0.75 - 32}px`
                            : `${viewportHeight * 0.8 - 48}px`,
                    }}
                  >
                    <div className='h-full'>
                      <h3
                        className={`text-center font-semibold ${debouncedContrasts.length >= 3 ? 'text-sm mb-1' : 'text-lg mb-2'}`}
                      >
                        {contrast === 'default' ? 'Differential Expression' : contrast.toUpperCase()}
                      </h3>
                      <div
                        className='w-full'
                        style={{
                          height:
                            debouncedContrasts.length >= 3
                              ? `${viewportHeight * 0.4 - 48}px`
                              : `${viewportHeight * 0.75 - 64}px`,
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
          xThreshold,
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