export type GenericRow = Record<string, string | number | null>;

export type Point = {
  x: number;
  y: number;
  text: string;
  color: string;
};

export type Bounds = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type ProcessedData = {
  points: Point[];
  bounds: Bounds;
};

export interface VolcanoPlotProps {
  deFiles?: Record<string, string>;
  group: string;
  program: string;
  project: string;
  loading?: boolean;
}

export interface ThresholdControls {
  xThreshold: number;
  yThreshold: number;
  xInput: string;
  yInput: string;
  updateXThreshold: (value: string) => void;
  updateYThreshold: (value: string) => void;
  resetXThreshold: () => void;
  resetYThreshold: () => void;
  setThresholdsFromPlot: (newX?: number, newY?: number) => void;
}

export interface ContrastData {
  contrastData: Record<string, GenericRow[]>;
  availableColumns: string[];
  availableGenes: string[];
  xAxisColumn: string;
  yAxisColumn: string;
  setXAxisColumn: (column: string) => void;
  setYAxisColumn: (column: string) => void;
}

export interface PlotSettings {
  xThreshold: number;
  yThreshold: number;
  useLog: boolean;
  xAxisColumn: string;
  yAxisColumn: string;
}

export interface SeeMoreDataItem {
  filename: string;
  description: string;
  xDescription: string;
  yDescription: string;
  columns: string[];
  [key: string]: string | string[];
}

export interface PointCounts {
  red: number;
  blue: number;
  gray: number;
  total: number;
}
