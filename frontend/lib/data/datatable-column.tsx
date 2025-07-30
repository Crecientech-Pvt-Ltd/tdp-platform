import { Button } from '@/components/ui/button';
import type { Gsea, SelectedNodeProperty } from '@/lib/interface';
import type { Column, ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

function headerHelper<TData>(columnName: string) {
  // eslint-disable-next-line react/display-name
  return ({ column }: { column: Column<TData> }) => {
    return (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        {columnName}
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    );
  };
}
export const columnSelectedNodes: ColumnDef<SelectedNodeProperty>[] = [
  {
    accessorKey: 'Gene_Name',
    header: headerHelper('Gene Name'),
  },
  {
    accessorKey: 'ID',
    header: headerHelper('ENSG ID'),
  },
  {
    accessorKey: 'Description',
    header: headerHelper('Description'),
  },
];

export const columnGseaResults: ColumnDef<Gsea>[] = [
  {
    accessorKey: 'Pathway',
    header: headerHelper('Pathway'),
  },
  {
    accessorKey: 'Overlap',
    header: headerHelper('Overlap'),
  },
  {
    accessorKey: 'P-value',
    header: headerHelper('P-Value'),
    sortingFn: (a, b) => Number(a.original['P-value']) - Number(b.original['P-value']),
  },
  {
    accessorKey: 'Adjusted P-value',
    header: headerHelper('Adjusted P-Value'),
    sortingFn: (a, b) => Number(a.original['Adjusted P-value']) - Number(b.original['Adjusted P-value']),
  },
  {
    accessorKey: 'Odds Ratio',
    header: headerHelper('Odds Ratio'),
    sortingFn: (a, b) => Number(a.original['Odds Ratio']) - Number(b.original['Odds Ratio']),
  },
  {
    accessorKey: 'Combined Score',
    header: headerHelper('Combined Score'),
    sortingFn: (a, b) => Number(a.original['Combined Score']) - Number(b.original['Combined Score']),
  },
  {
    accessorKey: 'Genes',
    header: headerHelper('Genes'),
    meta: { wordBreak: 'break-word' },
  },
];

const prioritizationKeys = [
  'Target in clinic',
  'Membrane protein',
  'Secreted protein',
  'Ligand binder',
  'Small molecule binder',
  'Predicted pockets',
  'Mouse ortholog identity',
  'Chemical probes',
  'Genetic constraint',
  'Mouse models',
  'Gene essentiality',
  'Known safety events',
  'Cancer driver gene',
  'Paralogues',
  'Tissue specificity',
  'Tissue distribution',
];

const datasourceKeys = [
  'GWAS associations',
  'Gene Burden',
  'ClinVar',
  'GEL PanelApp',
  'Gene2phenotype',
  'UniProt literature',
  'UniProt curated variants',
  'Orphanet',
  'ClinGen',
  'Cancer Gene Census',
  'IntOGen',
  'ClinVar (somatic)',
  'Cancer Biomarkers',
  'ChEMBL',
  'CRISPR Screens',
  'Project Score',
  'SLAPenrich',
  'PROGENy',
  'Reactome',
  'Gene signatures',
  'Europe PMC',
  'Expression Atlas',
  'IMPC',
];

export type TargetDiseaseAssociationRow = {
  target: string;
  [key: string]: string | number;
};

// Association columns: Target, overall_score, all datasources
export const associationColumns: ColumnDef<TargetDiseaseAssociationRow, string | number | undefined>[] = [
  {
    accessorKey: 'target',
    header: 'Target',
    cell: info => <span className='font-semibold'>{info.getValue()}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'Association Score',
    header: 'Association Score',
    enableSorting: true,
  },
  ...datasourceKeys.map<ColumnDef<TargetDiseaseAssociationRow, string | number | undefined>>(key => ({
    accessorKey: key,
    header: key,
    enableSorting: true,
  })),
];

// Prioritization columns: Target, overall_score, all prioritization keys
export const prioritizationColumns: ColumnDef<TargetDiseaseAssociationRow, string | number | undefined>[] = [
  {
    accessorKey: 'target',
    header: 'Target',
    cell: info => <span className='font-semibold'>{info.getValue()}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'Association Score',
    header: 'Association Score',
    enableSorting: true,
  },
  ...prioritizationKeys.map<ColumnDef<TargetDiseaseAssociationRow, string | number | undefined>>(key => ({
    accessorKey: key,
    header: key,
    enableSorting: false,
  })),
]
