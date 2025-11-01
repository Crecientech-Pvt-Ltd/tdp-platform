import { useCallback, useEffect, useRef, useState } from 'react';
import type { GenericRow, ThresholdControls } from './types';
import { findColumnKeys, parseCsvData } from './utils';

/**
 * debounce hook for delaying value updates
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * hook to manage X and Y axis thresholds
 */
export const useThresholds = (initialX: number = 1, initialY: number = 0.01): ThresholdControls => {
  const [xThreshold, setXThreshold] = useState(initialX);
  const [yThreshold, setYThreshold] = useState(initialY);
  const [xInput, setXInput] = useState(initialX.toString());
  const [yInput, setYInput] = useState(initialY.toString());

  const updateXThreshold = useCallback((value: string) => {
    setXInput(value);
    const numVal = parseFloat(value);
    if (!Number.isNaN(numVal) && numVal >= 0) {
      setXThreshold(Math.abs(numVal));
    }
  }, []);

  const updateYThreshold = useCallback((value: string) => {
    setYInput(value);
    const numVal = parseFloat(value);
    if (!Number.isNaN(numVal) && numVal > 0 && numVal <= 1) {
      setYThreshold(numVal);
    }
  }, []);

  const resetXThreshold = useCallback(() => {
    if (xInput.trim() === '') {
      setXThreshold(initialX);
      setXInput(initialX.toString());
    }
  }, [xInput, initialX]);

  const resetYThreshold = useCallback(() => {
    if (yInput.trim() === '') {
      setYThreshold(initialY);
      setYInput(initialY.toString());
    }
  }, [yInput, initialY]);

  const setThresholdsFromPlot = useCallback((newX?: number, newY?: number) => {
    if (newX !== undefined && newX >= 0) {
      setXThreshold(newX);
      setXInput(newX.toFixed(2));
    }
    if (newY !== undefined && newY > 0 && newY <= 1) {
      setYThreshold(newY);
      setYInput(newY < 0.001 ? newY.toExponential(2) : newY.toFixed(4));
    }
  }, []);

  return {
    xThreshold,
    yThreshold,
    xInput,
    yInput,
    updateXThreshold,
    updateYThreshold,
    resetXThreshold,
    resetYThreshold,
    setThresholdsFromPlot,
  };
};

/**
 * Hook to manage viewport dimensions
 */
export const useViewportDimensions = () => {
  const [viewportHeight, setViewportHeight] = useState(0);
  const layoutKeyRef = useRef(0);

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
      layoutKeyRef.current += 1;
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  return { viewportHeight, layoutKey: layoutKeyRef.current };
};

/**
 * Hook for managing gene contrast data and csv parsing
 */
export const useGeneContrastData = (deFiles: Record<string, string> | undefined, debouncedContrasts: string[]) => {
  const [contrastData, setContrastData] = useState<Record<string, GenericRow[]>>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [availableGenes, setAvailableGenes] = useState<string[]>([]);
  const [xAxisColumn, setXAxisColumn] = useState('logFC');
  const [yAxisColumn, setYAxisColumn] = useState('PValue');
  const [idColumns, setIdColumns] = useState<Record<string, string>>({});

  const fetchedContrastsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!deFiles) return;

    const toFetch = debouncedContrasts.filter(c => !fetchedContrastsRef.current.has(c));
    if (toFetch.length === 0) return;

    const newData: Record<string, GenericRow[]> = {};
    const allGenes = new Set<string>();
    const newIdColumns: Record<string, string> = {};

    toFetch.forEach(contrast => {
      let csvText = '';
      if (contrast === 'default') {
        const defaultKeys = ['differentialexpression.csv', 'differentialexpression.tsv', 'differentialexpression.txt'];
        for (const key of defaultKeys) {
          const found = Object.keys(deFiles).find(f => f.toLowerCase() === key);
          if (found) {
            csvText = deFiles[found];
            break;
          }
        }
      } else {
        const found = Object.keys(deFiles).find(filename => {
          const lower = filename.toLowerCase();
          return lower.includes(contrast.toLowerCase()) || filename === contrast;
        });
        if (found) csvText = deFiles[found];
      }

      if (csvText) {
        parseCsvData(csvText, results => {
          const headers = results.meta.fields ?? [];
          const { logFCKey, pvalKey } = findColumnKeys(headers);

          if (!logFCKey || !pvalKey) {
            console.warn(`Skipping gene file ${contrast} due to missing logFC or PValue columns`);
            return;
          }

          const filtered = results.data.filter((row: GenericRow) => {
            return Object.values(row).some(value => value !== null && value !== undefined && value !== '');
          });

          const idKey = headers[0] || 'id';
          newIdColumns[contrast] = idKey;

          filtered.forEach((row: GenericRow) => {
            const geneId = String(row[idKey] || row[''] || '');
            if (geneId.trim()) {
              allGenes.add(geneId);
            }
          });

          newData[contrast] = filtered;
          setAvailableColumns(prev => Array.from(new Set([...prev, ...headers])));
        });
      }
    });

    if (Object.keys(newData).length > 0) {
      for (const fetched of toFetch) {
        fetchedContrastsRef.current.add(fetched);
      }

      setContrastData(prev => ({ ...prev, ...newData }));
      setAvailableGenes(prev => Array.from(new Set([...prev, ...allGenes])).sort());
      setIdColumns(prev => ({ ...prev, ...newIdColumns }));
    }
  }, [debouncedContrasts, deFiles]);

  const columnsInitializedRef = useRef(false);
  useEffect(() => {
    if (columnsInitializedRef.current) return;

    if (availableColumns.length > 0 && (xAxisColumn === 'logFC' || yAxisColumn === 'PValue')) {
      const { logFCKey, pvalKey } = findColumnKeys(availableColumns);

      if (xAxisColumn === 'logFC' && logFCKey) {
        setXAxisColumn(logFCKey);
      }
      if (yAxisColumn === 'PValue' && pvalKey) {
        setYAxisColumn(pvalKey);
      }

      columnsInitializedRef.current = true;
    }
  }, [availableColumns, xAxisColumn, yAxisColumn]);

  return {
    geneContrastData: contrastData,
    geneAvailableColumns: availableColumns,
    geneAvailableGenes: availableGenes,
    geneXAxisColumn: xAxisColumn,
    geneYAxisColumn: yAxisColumn,
    geneIdColumns: idColumns,
    setGeneXAxisColumn: setXAxisColumn,
    setGeneYAxisColumn: setYAxisColumn,
  };
};

/**
 * Hook for managing transcript contrast data and csv parsing
 */
export const useTranscriptContrastData = (
  deFiles: Record<string, string> | undefined,
  debouncedContrasts: string[],
) => {
  const [contrastData, setContrastData] = useState<Record<string, GenericRow[]>>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [availableGenes, setAvailableGenes] = useState<string[]>([]);
  const [xAxisColumn, setXAxisColumn] = useState('logFC');
  const [yAxisColumn, setYAxisColumn] = useState('PValue');
  const [idColumns, setIdColumns] = useState<Record<string, string>>({});

  const fetchedContrastsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!deFiles) return;

    const toFetch = debouncedContrasts.filter(c => !fetchedContrastsRef.current.has(c));
    if (toFetch.length === 0) return;

    const newData: Record<string, GenericRow[]> = {};
    const allTranscripts = new Set<string>();
    const newIdColumns: Record<string, string> = {};

    toFetch.forEach(contrast => {
      let csvText = '';
      if (contrast === 'default') {
        const defaultKeys = ['differentialexpression.csv', 'differentialexpression.tsv', 'differentialexpression.txt'];
        for (const key of defaultKeys) {
          const found = Object.keys(deFiles).find(f => f.toLowerCase() === key);
          if (found) {
            csvText = deFiles[found];
            break;
          }
        }
      } else {
        const found = Object.keys(deFiles).find(filename => {
          const lower = filename.toLowerCase();
          return lower.includes(contrast.toLowerCase()) || filename === contrast;
        });
        if (found) csvText = deFiles[found];
      }

      if (csvText) {
        parseCsvData(csvText, results => {
          const headers = results.meta.fields ?? [];
          const { logFCKey, pvalKey } = findColumnKeys(headers);

          if (!logFCKey || !pvalKey) {
            console.warn(`Skipping transcript file ${contrast} due to missing logFC or PValue columns`);
            return;
          }

          const filtered = results.data.filter((row: GenericRow) => {
            return Object.values(row).some(value => value !== null && value !== undefined && value !== '');
          });

          const idKey = headers[0] || 'id';
          newIdColumns[contrast] = idKey;

          filtered.forEach((row: GenericRow) => {
            const transcriptId = String(row[idKey] || row[''] || '');
            if (transcriptId.trim()) {
              allTranscripts.add(transcriptId);
            }
          });

          newData[contrast] = filtered;
          setAvailableColumns(prev => Array.from(new Set([...prev, ...headers])));
        });
      }
    });

    if (Object.keys(newData).length > 0) {
      for (const fetched of toFetch) {
        fetchedContrastsRef.current.add(fetched);
      }

      setContrastData(prev => ({ ...prev, ...newData }));
      setAvailableGenes(prev => Array.from(new Set([...prev, ...allTranscripts])).sort());
      setIdColumns(prev => ({ ...prev, ...newIdColumns }));
    }
  }, [debouncedContrasts, deFiles]);

  const columnsInitializedRef = useRef(false);
  useEffect(() => {
    if (columnsInitializedRef.current) return;

    if (availableColumns.length > 0 && (xAxisColumn === 'logFC' || yAxisColumn === 'PValue')) {
      const { logFCKey, pvalKey } = findColumnKeys(availableColumns);

      if (xAxisColumn === 'logFC' && logFCKey) {
        setXAxisColumn(logFCKey);
      }
      if (yAxisColumn === 'PValue' && pvalKey) {
        setYAxisColumn(pvalKey);
      }

      columnsInitializedRef.current = true;
    }
  }, [availableColumns, xAxisColumn, yAxisColumn]);

  return {
    transcriptContrastData: contrastData,
    transcriptAvailableColumns: availableColumns,
    transcriptAvailableGenes: availableGenes,
    transcriptXAxisColumn: xAxisColumn,
    transcriptYAxisColumn: yAxisColumn,
    transcriptIdColumns: idColumns,
    setTranscriptXAxisColumn: setXAxisColumn,
    setTranscriptYAxisColumn: setYAxisColumn,
  };
};
