'use client';

import Papa from 'papaparse';
import { useEffect, useMemo, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { VolcanoPlotControls } from './Controls';
import { useContrastData, useDebounce, useThresholds, useViewportDimensions } from './hooks';
import { VolcanoPlotRenderer } from './Renderer';
import SeeMore from './SeeMore';
import type { GenericRow, Point, PointCounts, ProcessedData, SeeMoreDataItem, VolcanoPlotProps } from './types';
import { calculateBounds, findColumnKeys, getContrastCsvText, parseContrastNames, processDataToPoints } from './utils';

export default function xVolcanoPlot({ deFiles, group, program, project, loading: externalLoading }: VolcanoPlotProps) {
  const [availableContrasts, setAvailableContrasts] = useState<string[]>([]);
  const [selectedContrasts, setSelectedContrasts] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [allDataLoaded, setAllDataLoaded] = useState<boolean>(false);
  const [useLog, setUseLog] = useState<1 | 0>(1);
  const [showSeeMore, setShowSeeMore] = useState<boolean>(false);
  const [selectedGenes, setSelectedGenes] = useState<Set<string>>(new Set());

  const debouncedContrasts = useDebounce(selectedContrasts, 150);
  const thresholds = useThresholds(1, 0.01);
  const { viewportHeight } = useViewportDimensions();
  const {
    contrastData,
    availableColumns,
    availableGenes,
    xAxisColumn,
    yAxisColumn,
    idColumns,
    setXAxisColumn,
    setYAxisColumn,
  } = useContrastData(deFiles, debouncedContrasts);

  useEffect(() => {
    if (externalLoading) {
      setLoading(true);
      setAllDataLoaded(false);
      return;
    }

    if (!deFiles || Object.keys(deFiles).length === 0) {
      setAvailableContrasts([]);
      setSelectedContrasts([]);
      setAllDataLoaded(true);
      setLoading(false);
      return;
    }

    setLoading(true);

    const contrastNames = parseContrastNames(deFiles);
    setAvailableContrasts(contrastNames);
    setSelectedContrasts([contrastNames[0]]);
    setAllDataLoaded(true);
    setLoading(false);
  }, [deFiles, externalLoading]);

  const processedData = useMemo<Record<string, ProcessedData>>(() => {
    const result: Record<string, ProcessedData> = {};

    debouncedContrasts.forEach(contrast => {
      const rawData = contrastData[contrast] || [];
      const idKey = idColumns[contrast];
      const points = processDataToPoints(
        rawData,
        xAxisColumn,
        yAxisColumn,
        useLog === 1,
        thresholds.xThreshold,
        thresholds.yThreshold,
        selectedGenes,
        availableColumns,
        idKey,
      );

      result[contrast] = {
        points,
        bounds: calculateBounds(points, useLog === 1),
      };
    });
    return result;
  }, [
    contrastData,
    debouncedContrasts,
    thresholds.xThreshold,
    thresholds.yThreshold,
    useLog,
    xAxisColumn,
    yAxisColumn,
    availableColumns,
    selectedGenes,
    idColumns,
  ]);

  const pointCounts = useMemo<Record<string, PointCounts>>(() => {
    const counts: Record<string, PointCounts> = {};

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
          newPValue = 10 ** -logPValue;
        } else {
          newPValue = newValue;
        }

        if (newPValue > 0 && newPValue <= 1) {
          thresholds.setThresholdsFromPlot(undefined, newPValue);
        }
      }

      const xMatch = key.match(/shapes\[([01])\]\.(x0|x1)/);
      if (xMatch) {
        const newValue = eventData[key];
        if (typeof newValue !== 'number') return;

        const newCutoff = Math.abs(newValue);
        if (newCutoff >= 0) {
          thresholds.setThresholdsFromPlot(newCutoff, undefined);
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
    setUseLog(logUsage ? 1 : 0);
  };

  const seeMoreData = useMemo<SeeMoreDataItem[]>(() => {
    if (!deFiles) return [];

    return Object.keys(deFiles).map(filename => ({
      filename,
      description: `Differential expression analysis results for ${filename.replace(/^differentialexpression[-_]?/i, '').replace(/\.(csv|tsv|txt)$/i, '') || 'default contrast'}`,
      xDescription: `Log fold change values representing the magnitude of expression difference between conditions. Positive values indicate upregulation, negative values indicate downregulation.`,
      yDescription: `Statistical significance values (p-values) from differential expression testing. Lower values indicate higher confidence in the observed differences.`,
      columns: availableColumns,
    }));
  }, [deFiles, availableColumns]);

  const renderPlot = (contrast: string) => {
    const data = processedData[contrast];
    const counts = pointCounts[contrast];
    if (!data) return null;

    return (
      <VolcanoPlotRenderer
        contrast={contrast}
        data={data}
        counts={counts}
        selectedGenes={selectedGenes}
        xAxisColumn={xAxisColumn}
        yAxisColumn={yAxisColumn}
        useLog={useLog === 1}
        thresholds={thresholds}
        onPlotRelayout={handlePlotRelayout}
      />
    );
  };

  const processDataForDownload = (contrastName: string) => {
    if (!deFiles) return null;

    const csvText = getContrastCsvText(contrastName, deFiles);
    if (!csvText) return null;

    return new Promise<{ rawData: GenericRow[]; points: Point[] } | null>(resolve => {
      Papa.parse<GenericRow>(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: results => {
          const headers = results.meta.fields ?? [];
          const idKey = headers[0] || 'id';
          const { logFCKey, pvalKey } = findColumnKeys(headers);

          let finalLogFCKey = xAxisColumn;
          let finalPvalKey = yAxisColumn;

          if (!headers.includes(finalLogFCKey)) {
            finalLogFCKey = logFCKey || 'logFC';
          }

          if (!headers.includes(finalPvalKey)) {
            finalPvalKey = pvalKey || 'PValue';
          }

          const filtered = results.data.filter(row => {
            const idValue = idKey in row ? row[idKey] : row[''] || '';
            return (
              typeof row[finalLogFCKey] === 'number' &&
              typeof row[finalPvalKey] === 'number' &&
              (typeof idValue === 'string' || typeof idValue === 'number')
            );
          });

          const points: Point[] = processDataToPoints(
            filtered,
            finalLogFCKey,
            finalPvalKey,
            useLog === 1,
            thresholds.xThreshold,
            thresholds.yThreshold,
            selectedGenes,
            headers,
            idKey,
          );

          resolve({ rawData: filtered, points });
        },
      });
    });
  };

  const showDropdown = availableContrasts.length > 1;

  if (loading || !allDataLoaded) {
    return (
      <div className='mx-auto w-full max-w-[95vw] px-4 sm:px-6 lg:max-w-[1500px] lg:px-8'>
        <div className='flex min-h-[60vh] flex-col items-center justify-center'>
          <Spinner />
          <p className='mt-4 text-gray-500 text-lg'>Loading data...</p>
        </div>
      </div>
    );
  }

  if ((!deFiles || Object.keys(deFiles).length === 0) && allDataLoaded) {
    return (
      <div className='mx-auto w-full max-w-[95vw] px-4 sm:px-6 lg:max-w-[1500px] lg:px-8'>
        <div className='flex min-h-[60vh] flex-col items-center justify-center'>
          <p className='font-medium text-gray-500 text-lg'>
            Kindly add Differential Expression files to view the plots.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='resizable-panel-container mx-auto w-full max-w-[95vw] px-4 sm:px-6 lg:max-w-[1500px] lg:px-8'>
      <VolcanoPlotControls
        showDropdown={showDropdown}
        availableContrasts={availableContrasts}
        selectedContrasts={selectedContrasts}
        onContrastChange={handleContrastChange}
        thresholds={thresholds}
        availableGenes={availableGenes}
        selectedGenes={selectedGenes}
        onGenesChange={setSelectedGenes}
        onShowSettings={() => setShowSeeMore(true)}
      />

      <div className='w-full' style={{ maxHeight: `${viewportHeight * 0.9}px` }}>
        {debouncedContrasts.length > 0 && (
          <div className='h-full space-y-2'>
            {debouncedContrasts.length === 1 ? (
              <div className='w-full' style={{ height: `${viewportHeight * 0.8 - 16}px` }}>
                <h3
                  className='mb-2 line-clamp-2 px-2 text-center font-semibold text-lg leading-tight'
                  title={
                    debouncedContrasts[0] === 'default'
                      ? 'Differential Expression'
                      : debouncedContrasts[0].toUpperCase()
                  }
                >
                  {debouncedContrasts[0] === 'default'
                    ? 'Differential Expression'
                    : debouncedContrasts[0].toUpperCase()}
                </h3>
                <div className='h-[calc(100%-4rem)] w-full'>{renderPlot(debouncedContrasts[0])}</div>
              </div>
            ) : (
              <div
                className={`grid h-full gap-3 ${debouncedContrasts.length >= 3 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2'}`}
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
                    <div className='flex h-full flex-col'>
                      <h3
                        className={`line-clamp-2 px-2 text-center font-semibold leading-tight ${debouncedContrasts.length >= 3 ? 'mb-1 h-10 text-xs' : 'mb-2 h-12 text-sm'}`}
                        title={contrast === 'default' ? 'Differential Expression' : contrast.toUpperCase()}
                      >
                        {contrast === 'default' ? 'Differential Expression' : contrast.toUpperCase()}
                      </h3>
                      <div className='w-full flex-1'>{renderPlot(contrast)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {debouncedContrasts.length === 0 && !loading && (
        <div className='py-12 text-center'>
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
        isLogUsed={useLog === 1}
        availableContrasts={availableContrasts}
        processDataForDownload={processDataForDownload}
        currentSettings={{
          xThreshold: thresholds.xThreshold,
          yThreshold: thresholds.yThreshold,
          useLog: useLog === 1,
          xAxisColumn,
          yAxisColumn,
        }}
        selectedContrasts={selectedContrasts}
        group={group}
        program={program}
        project={project}
        deFiles={deFiles}
      />
    </div>
  );
}
