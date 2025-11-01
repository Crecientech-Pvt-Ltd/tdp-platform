import Papa from 'papaparse';
import type { Bounds, GenericRow, Point } from './types';

/**
 * Calculate plot bounds based on data points
 */
export const calculateBounds = (points: Point[], useLog: boolean): Bounds => {
  if (points.length === 0) return { xMin: -1, xMax: 1, yMin: 0, yMax: 5 };

  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  for (const point of points) {
    const { x, y } = point;
    if (Number.isFinite(x)) {
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
    }
    if (Number.isFinite(y)) {
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }

  if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || !Number.isFinite(yMin) || !Number.isFinite(yMax)) {
    return { xMin: -1, xMax: 1, yMin: 0, yMax: 5 };
  }

  const maxAbsX = Math.max(Math.abs(xMin), Math.abs(xMax)) + 0.5;

  if (useLog) {
    return {
      xMin: -maxAbsX,
      xMax: maxAbsX,
      yMin: 0,
      yMax: yMax + Math.max(0.5, yMax * 0.1),
    };
  } else {
    return {
      xMin: -maxAbsX,
      xMax: maxAbsX,
      yMin: Math.min(0, yMin - 0.01),
      yMax: yMax + Math.max(0.01, Math.abs(yMax) * 0.1),
    };
  }
};

/**
 * Find column names for log fold change and p-values
 */
export const findColumnKeys = (headers: string[]) => {
  const logFCKey =
    headers.find(h => h && /^log[ _-]?2?[ _-]?(?:fc|foldchange)$/i.test(h)) || headers.find(h => h && /log/i.test(h));

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
export const getContrastCsvText = (contrast: string, deFiles: Record<string, string>): string => {
  const deFileKeys = Object.keys(deFiles);
  const lowerKeyMap = Object.fromEntries(deFileKeys.map(original => [original.toLowerCase(), original]));

  if (contrast === 'default') {
    const defaultKeys = ['differentialexpression.csv', 'differentialexpression.tsv', 'differentialexpression.txt'];

    for (const key of defaultKeys) {
      if (lowerKeyMap[key]) {
        return deFiles[lowerKeyMap[key]];
      }
    }
  } else {
    const extensions = ['csv', 'tsv', 'txt'];
    const separators = ['_', '-', ' '];
    const prefixes = ['differentialexpression', 'de'];

    for (const prefix of prefixes) {
      for (const separator of separators) {
        for (const ext of extensions) {
          const pattern = `${prefix}${separator}${contrast}.${ext}`.toLowerCase();
          if (lowerKeyMap[pattern]) {
            return deFiles[lowerKeyMap[pattern]];
          }
        }
      }
    }

    const fullFilenamePattern = contrast.toLowerCase();
    if (lowerKeyMap[fullFilenamePattern]) {
      return deFiles[lowerKeyMap[fullFilenamePattern]];
    }

    for (const ext of extensions) {
      const withExt = `${fullFilenamePattern}.${ext}`;
      if (lowerKeyMap[withExt]) {
        return deFiles[lowerKeyMap[withExt]];
      }
    }
  }

  return '';
};

/**
 * Extract contrast names from file names
 */
export const parseContrastNames = (deFiles: Record<string, string>): string[] => {
  const diffExpRegex =
    /^(?:.*)(?:(?:differential|diff)(?:[-_ ]?(?:expression|exp))?|(?:differential|de))(?:[-_ ]?)(.+?)\.(csv|tsv|xls|xlsx|txt)$/i;

  return Object.keys(deFiles).map(filename => {
    const match = filename.match(diffExpRegex);

    if (match?.[1]) {
      // Return the captured contrast name (group 1)
      return match[1];
    }

    // If no match, return 'default' or the filename without extension as fallback
    return filename.replace(/\.(csv|tsv|xls|xlsx|txt)$/i, '');
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
  selectedGenes: Set<string>,
): string => {
  if (selectedGenes.has(geneId)) {
    return 'orange';
  }

  const absX = Math.abs(xValue);

  if (useLog) {
    if (absX >= xThreshold && pValue <= yThreshold) {
      return xValue >= 0 ? 'red' : 'blue';
    }
  } else {
    if (absX >= xThreshold && pValue >= yThreshold) {
      return xValue >= 0 ? 'red' : 'blue';
    }
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
  availableColumns: string[],
  idKey?: string,
  minNonZeroReplacement: number = 1e-300,
): Point[] => {
  const contrastIdKey = idKey || availableColumns[0] || 'id';
  const points: Point[] = [];

  let minNonZero: number | null = null;

  if (useLog) {
    for (const row of rawData) {
      const pValue = row[yAxisColumn];

      if (typeof pValue === 'number' && !Number.isNaN(pValue) && pValue > 0) {
        if (minNonZero === null || pValue < minNonZero) {
          minNonZero = pValue;
        }
      }
    }

    if (minNonZero === null) {
      minNonZero = minNonZeroReplacement;
    }
  }

  for (const row of rawData) {
    const xValue = row[xAxisColumn];
    let pValue = row[yAxisColumn];
    const geneId = String(row[contrastIdKey] || row[''] || '');

    if (typeof xValue !== 'number' || typeof pValue !== 'number' || Number.isNaN(xValue) || Number.isNaN(pValue)) {
      continue;
    }

    if (useLog && pValue <= 0) {
      const replacementValue = minNonZero !== null ? minNonZero : minNonZeroReplacement;
      pValue = replacementValue;
    }

    const yValue = useLog ? -Math.log10(pValue) : pValue;
    const color = getPointColor(xValue, pValue, xThreshold, yThreshold, useLog, geneId, selectedGenes);

    points.push({
      x: xValue,
      y: yValue,
      text: geneId,
      color,
    });
  }

  return points;
};

/**
 * Parse CSV data using Papa Parse
 */
export const parseCsvData = (csvText: string, onComplete: (results: Papa.ParseResult<GenericRow>) => void): void => {
  Papa.parse<GenericRow>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: onComplete,
  });
};
