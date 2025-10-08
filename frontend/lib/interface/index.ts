export * from './api/index';
export * from './graph';
export * from './PopUpDataTableProps';
export * from './PopUpTableProps';
export * from './SelectedNodeProperty';

/**
 * GSEA data format
 * @interface Gsea
 */
export interface Gsea {
  Pathway: string;
  Overlap: string;
  'P-value': string;
  'Adjusted P-value': string;
  'Odds Ratio': string;
  'Combined Score': string;
  Genes: string;
}
