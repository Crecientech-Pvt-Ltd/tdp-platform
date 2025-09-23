import Papa from 'papaparse';
import type { GenericRow, Point, Bounds } from './types';

/**
 * Calculate plot bounds based on data points
 */
export const calculateBounds = (points: Point[], useLog: boolean): Bounds => {
  if (points.length === 0) return { xMin: -1, xMax: 1, yMin: 0, yMax: 5 };
  
  const xVals = points.map(p => p.x).filter(x => isFinite(x));
  const yVals = points.map(p => p.y).filter(y => isFinite(y));
  
  if (xVals.length === 0 || yVals.length === 0) {
    return { xMin: -1, xMax: 1, yMin: 0, yMax: 5 };
  }
  
  const maxAbsX = Math.max(...xVals.map(Math.abs)) + 0.5;

  if (useLog) {
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

/**
 * Find column names for log fold change and p-values
 */
export const findColumnKeys = (headers: string[]) => {
  const logFCKey =
    headers.find(h => h && /^log[ _-]?2?[ _-]?(?:fc|foldchange)$/i.test(h)) ||
    headers.find(h => h && /log/i.test(h));
    
  const pvalKey =
    headers.find(h => h && /^(?:adj|adjusted)[ _-]?p[ _-]?(?:val|value|values)$/i.test(h)) ||
    headers.find(h => h && /^p[ _-]?(?:adj|adjusted)(?:[ _-]?(?:val|value|values))?$/i.test(h)) ||
    headers.find(h => h && /^p[ _-]?(?:val|value|values)$/i.test(h)) ||
    headers.find(h => h && /^(?:f[ _-]?d[ _-]?r|false[ _-]?discovery[ _-]?rate)$/i.test(h));

  return { logFCKey, pvalKey };
};

/**
 * Get CSV content for a specific contrast file
 */
export const getContrastCsvText = (
  contrast: string,
  deFiles: Record<string, string>
): string => {
  const deFileKeys = Object.keys(deFiles);
  const lowerKeyMap = Object.fromEntries(deFileKeys.map(original => [original.toLowerCase(), original]));

  if (
    contrast === 'default' &&
    (lowerKeyMap['differentialexpression.csv'] ||
      lowerKeyMap['differentialexpression.tsv'] ||
      lowerKeyMap['differentialexpression.txt'])
  ) {
    return (
      deFiles[lowerKeyMap['differentialexpression.csv']] ||
      deFiles[lowerKeyMap['differentialexpression.tsv']] ||
      deFiles[lowerKeyMap['differentialexpression.txt']]
    );
  } else {
    const extensions = ['csv', 'tsv', 'txt'];
    for (const ext of extensions) {
      const key1 = `differentialexpression_${contrast}.${ext}`.toLowerCase();
      const key2 = `differentialexpression-${contrast}.${ext}`.toLowerCase();
      const matchedKey = lowerKeyMap[key1] || lowerKeyMap[key2];
      if (matchedKey) {
        return deFiles[matchedKey];
      }
    }
  }
  return '';
};

/**
 * Extract contrast names from file names
 */
export const parseContrastNames = (deFiles: Record<string, string>): string[] => {
  return Object.keys(deFiles).map(filename => {
    const lowerCaseFileName = filename.toLowerCase();
    if (
      lowerCaseFileName === 'differentialexpression.csv' ||
      lowerCaseFileName === 'differentialexpression.tsv' ||
      lowerCaseFileName === 'differentialexpression.txt'
    ) {
      return 'default';
    }
    const match = lowerCaseFileName.match(/^differentialexpression[-_](.+)\.(csv|tsv|txt)$/);
    return match ? match[1] : filename;
  });
};

/**
 * Determine point color based on thresholds
 */
export const getPointColor = (
  xValue: number,
  pValue: number,
  xThreshold: number,
  yThreshold: number,
  useLog: boolean,
  geneId: string,
  selectedGenes: Set<string>
): string => {
  if (selectedGenes.has(geneId)) {
    return 'orange';
  }

  if (useLog) {
    if (xValue >= xThreshold && pValue <= yThreshold) return 'red';
    else if (xValue <= -xThreshold && pValue <= yThreshold) return 'blue';
  } else {
    if (xValue >= xThreshold && pValue >= yThreshold) return 'red';
    else if (xValue <= -xThreshold && pValue >= yThreshold) return 'blue';
  }
  
  return 'gray';
};

/**
 * Process raw data into plot points
 */
export const processDataToPoints = (
  rawData: GenericRow[],
  xAxisColumn: string,
  yAxisColumn: string,
  useLog: boolean,
  xThreshold: number,
  yThreshold: number,
  selectedGenes: Set<string>,
  availableColumns: string[]
): Point[] => {
  const idKey = availableColumns[0] || 'id';

  return rawData
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
      const yValue = useLog ? -Math.log10(pValue) : pValue;
      const geneId = String(row[idKey] || row[''] || '');

      const color = getPointColor(xValue, pValue, xThreshold, yThreshold, useLog, geneId, selectedGenes);

      return {
        x: xValue,
        y: yValue,
        text: geneId,
        color,
      };
    });
};

/**
 * Parse CSV data using Papa Parse
 */
export const parseCsvData = (
  csvText: string,
  onComplete: (results: Papa.ParseResult<GenericRow>) => void
): void => {
  Papa.parse<GenericRow>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: onComplete,
  });
};