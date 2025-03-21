export const PROPERTY_LABEL_TYPE_MAPPING = {
  LogFC: 'LogFC',
  GDA: 'GDA',
  Genetics: 'GWAS',
  Databases: 'Database',
  Pathways: 'Pathway',
  Druggability: 'Druggability',
  TE: 'TE',
  Custom: 'Custom_Color',
} as const;

export const PROPERTY_TYPE_LABEL_MAPPING = {
  LogFC: 'LogFC',
  GDA: 'GDA',
  GWAS: 'Genetics',
  Database: 'Databases',
  Pathway: 'Pathways',
  Druggability: 'Druggability',
  TE: 'TE',
  Custom_Color: 'Custom',
} as const;

export const DISEASE_DEPENDENT_PROPERTIES = ['LogFC', 'GDA', 'GWAS'] as const;
export const DISEASE_INDEPENDENT_PROPERTIES = ['Pathway', 'Druggability', 'TE', 'Custom_Color', 'Database'] as const;

export type DiseaseDependentProperties = (typeof DISEASE_DEPENDENT_PROPERTIES)[number];
export type DiseaseIndependentProperties = (typeof DISEASE_INDEPENDENT_PROPERTIES)[number];
export type GeneProperties = DiseaseDependentProperties | DiseaseIndependentProperties;

export const diseaseTooltip = {
  ALS: 'Amyotrophic Lateral Sclerosis',
  FTD: 'Frontotemporal Dementia',
  OI: 'Osteogenesis Imperfecta',
  PSP: 'Progressive Supranuclear Palsy',
};

export const graphConfig = [
  {
    name: 'Disease Map',
    id: 'diseaseMap',
    options: [
      {
        label: 'ALS',
        value: 'ALS',
      },
      {
        label: 'PSP',
        value: 'PSP',
      },
      {
        label: 'FTD',
        value: 'FTD',
      },
      {
        label: 'OI',
        value: 'OI',
      },
    ],
  },
  {
    name: 'Order',
    id: 'order',
    options: [
      {
        label: 'Zero',
        value: '0',
      },
      {
        label: 'First',
        value: '1',
      },
      {
        label: 'Second',
        value: '2',
      },
    ],
  },
  {
    name: 'Interaction Type',
    id: 'interactionType',
    options: [
      {
        label: 'PPI',
        value: 'PPI',
      },
      {
        label: 'FunPPI',
        value: 'FUN_PPI',
      },
    ],
  },
  {
    name: 'Min Interaction Score',
    id: 'minScore',
    options: [
      { label: 'Highest (0.9)', value: '0.9' },
      { label: 'High (0.7)', value: '0.7' },
      { label: 'Medium (0.4)', value: '0.4' },
      { label: 'Low (0.15)', value: '0.15' },
    ],
  },
] as const;

export type GeneInteractionType = (typeof graphConfig)[2]['options'][number]['value'];
export interface GraphConfig {
  geneIDs: string[];
  diseaseMap: string;
  order: string;
  interactionType: GeneInteractionType;
  minScore: string;
  graphName: string;
}
