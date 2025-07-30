import { create } from 'zustand';
import type { GraphStore } from '../interface';
import { initRadioOptions } from '../utils';
import { OPENTARGETS_PROPERTY_MAPPING } from '../data';

export const useStore = create<GraphStore>(set => ({
  projectTitle: 'Untitled',
  nodeSearchQuery: '',
  nodeSuggestions: [],
  forceWorker: {
    start() {},
    stop() {},
  },
  defaultNodeColor: 'skyblue',
  // Select defaultValue best for viewing the graph
  forceSettings: {
    linkDistance: 30,
  },
  defaultNodeSize: 5,
  defaultLabelDensity: 3,
  defaultLabelSize: 8,
  selectedNodes: [],
  selectedRadioNodeColor: undefined,
  selectedRadioNodeSize: undefined,
  showEdgeColor: false,
  totalNodes: 0,
  totalEdges: 0,
  radialAnalysis: {
    edgeWeightCutOff: 0.4,
    nodeDegreeCutOff: 0,
    hubGeneEdgeCount: 0,
    nodeDegreeProperty: 'Gene Degree',
  },
  geneNames: [],
  diseaseName: '',
  universalData: {},
  radioOptions: {
    user: initRadioOptions(),
    database: {
      LogFC: [],
      OpenTargets: OPENTARGETS_PROPERTY_MAPPING,
      Genetics: [],
      Pathway: [],
      Druggability: [],
      TE: [],
      Custom_Color: [],
      OT_Prioritization: [],
    },
  },
  selectedNodeSizeProperty: '',
  selectedNodeColorProperty: '',
  geneNameToID: new Map(),
  graphConfig: null,
  edgeOpacity: 1,
  highlightNeighborNodes: false,

  activeTab: 'Network',
  setActiveTab: tab => set({ activeTab: tab }),

  heatmapPagination: { page: 1, limit: 25 },
  heatmapSortingColumn: 'Association Score',
  showOnlyVisible: false,
}));
