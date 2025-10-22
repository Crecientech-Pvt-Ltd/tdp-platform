import Papa from 'papaparse';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FileSource } from '@/components/data-commons/upload/hooks/useDataFiles';
import { useFileData } from '@/components/data-commons/upload/hooks/useFileData';
import { GROUP_COLORS } from './constants';
import { normalizeSampleName } from './utils';

type GeneRow = { [key: string]: string | number };
type SampleRow = { [key: string]: string };
type DataSource = 'gene' | 'transcript';

export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(800);

  useEffect(() => {
    const updateHeight = () => setViewportHeight(window.innerHeight);
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return viewportHeight;
}

export function useDataFiles(
  sampleFile: FileSource | null,
  geneFile: FileSource | null,
  transcriptFile: FileSource | null,
) {
  const { data: sampleData, loading: sampleLoading } = useFileData(sampleFile);
  const { data: geneData, loading: geneLoading } = useFileData(geneFile);
  const { data: transcriptData, loading: transcriptLoading } = useFileData(transcriptFile);

  const loading = sampleLoading || geneLoading || transcriptLoading;

  const hasGene = !!(geneFile && (geneFile.url || geneFile.content));
  const hasTranscript = !!(transcriptFile && (transcriptFile.url || transcriptFile.content));

  return {
    sampleData,
    geneData,
    transcriptData,
    loading,
    hasGene,
    hasTranscript,
  };
}

export function useDataSource(hasGene: boolean, hasTranscript: boolean) {
  const [dataSource, setDataSource] = useState<DataSource>('gene');

  useEffect(() => {
    if (hasGene && !hasTranscript) setDataSource('gene');
    else if (!hasGene && hasTranscript) setDataSource('transcript');
    else if (hasGene && hasTranscript && !['gene', 'transcript'].includes(dataSource)) setDataSource('gene');
  }, [hasGene, hasTranscript, dataSource]);

  return { dataSource, setDataSource };
}

export function useSampleMapping(sampleData: string | undefined) {
  const [availableSampleColumns, setAvailableSampleColumns] = useState<string[]>([]);
  const [sampleColumn, setSampleColumn] = useState<string>('');
  const [groupColumn, setGroupColumn] = useState<string>('');
  const [sampleToGroup, setSampleToGroup] = useState<Record<string, string>>({});
  const [groupToColor, setGroupToColor] = useState<Record<string, string>>({});
  const [sampleDataExists, setSampleDataExists] = useState(false);

  const parsedSampleData = useMemo((): { rows: SampleRow[]; fields: string[] } | null => {
    if (!sampleData) return null;

    const isTabDelimited = sampleData.indexOf('\t') !== -1;
    let result: { rows: SampleRow[]; fields: string[] } | null = null;

    Papa.parse<SampleRow>(sampleData, {
      header: true,
      skipEmptyLines: true,
      delimiter: isTabDelimited ? '\t' : undefined,
      complete: parseResult => {
        result = {
          rows: parseResult.data as SampleRow[],
          fields: parseResult.meta.fields ?? [],
        };
      },
    });

    return result;
  }, [sampleData]);

  const normalizedSampleCache = useMemo(() => new Map<string, string>(), []);

  const getCachedNormalizedSample = useCallback(
    (sample: string): string => {
      if (normalizedSampleCache.has(sample)) {
        return normalizedSampleCache.get(sample)!;
      }
      const normalized = normalizeSampleName(sample);
      normalizedSampleCache.set(sample, normalized);
      return normalized;
    },
    [normalizedSampleCache],
  );

  useEffect(() => {
    if (!parsedSampleData) {
      setSampleDataExists(false);
      setSampleToGroup({});
      setGroupToColor({});
      setAvailableSampleColumns([]);
      return;
    }

    const rows = parsedSampleData.rows;
    const fields = parsedSampleData.fields;
    setAvailableSampleColumns(fields);

    if (!rows.length || fields.length < 2) {
      setSampleDataExists(false);
      setSampleToGroup({});
      setGroupToColor({});
      return;
    }

    const nameKey = sampleColumn || (fields[0] === '' || fields[0] === undefined ? '0' : fields[0]);
    const groupKey = groupColumn || fields[fields.length - 1] || String(fields.length - 1);

    if (!sampleColumn) {
      setSampleColumn(fields[0] === '' || fields[0] === undefined ? 'col_0' : fields[0]);
    }
    if (!groupColumn) {
      setGroupColumn(
        fields[fields.length - 1] === '' || fields[fields.length - 1] === undefined
          ? `col_${fields.length - 1}`
          : fields[fields.length - 1],
      );
    }

    const sampleGroup: Record<string, string> = {};
    const groupSet = new Set<string>();

    rows.forEach((row: SampleRow) => {
      let sampleField = nameKey;
      let groupField = groupKey;

      if (sampleColumn?.startsWith('col_')) {
        const idx = Number.parseInt(sampleColumn.split('_')[1], 10);
        const keys = Object.keys(row);
        sampleField = keys[idx] ?? nameKey;
      }
      if (groupColumn?.startsWith('col_')) {
        const idx = Number.parseInt(groupColumn.split('_')[1], 10);
        const keys = Object.keys(row);
        groupField = keys[idx] ?? groupKey;
      }

      const sample = row[''] !== undefined ? row[''] : row[sampleField] !== undefined ? row[sampleField] : row['0'];
      const group = row[groupField] !== undefined ? row[groupField] : row[String(fields.length - 1)];

      if (sample && group) {
        const sampleStr = String(sample);
        const groupStr = String(group);
        const normalizedSample = getCachedNormalizedSample(sampleStr);

        sampleGroup[sampleStr] = groupStr;
        if (normalizedSample) sampleGroup[normalizedSample] = groupStr;
        groupSet.add(groupStr);
      }
    });

    const groupArr = Array.from(groupSet).sort();
    const groupColor: Record<string, string> = {};
    groupArr.forEach((g, i) => {
      groupColor[g] = GROUP_COLORS[i % GROUP_COLORS.length];
    });

    setSampleToGroup(sampleGroup);
    setGroupToColor(groupColor);
    setSampleDataExists(true);
  }, [parsedSampleData, sampleColumn, groupColumn, getCachedNormalizedSample]);

  const mappingChange = useCallback((newSampleCol: string, newGroupCol: string) => {
    setSampleColumn(newSampleCol);
    setGroupColumn(newGroupCol);
  }, []);

  return {
    availableSampleColumns,
    sampleColumn,
    groupColumn,
    sampleToGroup,
    groupToColor,
    sampleDataExists,
    mappingChange,
  };
}

export function useParsedData(geneData: string | undefined, transcriptData: string | undefined) {
  const parsedGeneData = useMemo(() => {
    if (!geneData) return [];

    const isTabDelimited = geneData.indexOf('\t') !== -1;
    let result: GeneRow[] = [];

    Papa.parse<GeneRow>(geneData, {
      header: true,
      skipEmptyLines: true,
      delimiter: isTabDelimited ? '\t' : undefined,
      complete: parseResult => {
        result = parseResult.data as GeneRow[];
      },
    });

    return result;
  }, [geneData]);

  const parsedTranscriptData = useMemo(() => {
    if (!transcriptData) return [];

    const isTabDelimited = transcriptData.indexOf('\t') !== -1;
    let result: GeneRow[] = [];

    Papa.parse<GeneRow>(transcriptData, {
      header: true,
      skipEmptyLines: true,
      delimiter: isTabDelimited ? '\t' : undefined,
      complete: parseResult => {
        result = parseResult.data as GeneRow[];
      },
    });

    return result;
  }, [transcriptData]);

  return { parsedGeneData, parsedTranscriptData };
}

export function useGeneSelection(dataSource: DataSource, parsedGeneData: GeneRow[], parsedTranscriptData: GeneRow[]) {
  const [geneList, setGeneList] = useState<string[]>([]);
  const [selectedGenes, setSelectedGenes] = useState<Set<string>>(new Set());

  const currentData = dataSource === 'gene' ? parsedGeneData : parsedTranscriptData;

  useEffect(() => {
    if (currentData.length > 0) {
      const keys = Object.keys(currentData[0]);
      const idCol = keys.length > 0 ? keys[0] : '0';

      const genes = currentData
        .map((row: GeneRow) => {
          const id = row[idCol] !== undefined ? row[idCol] : row['0'];
          return id as string;
        })
        .filter(Boolean);

      genes.sort();
      setGeneList(genes);
      setSelectedGenes(new Set());
    }
  }, [currentData]);

  const handleGeneSelection = useCallback((value: string | Set<string>) => {
    if (value instanceof Set) {
      const limitedSet = new Set(Array.from(value).slice(0, 4));
      setSelectedGenes(limitedSet);
    }
  }, []);

  return {
    geneList,
    selectedGenes,
    handleGeneSelection,
  };
}

export function useGeneDataMap(
  selectedGenes: Set<string>,
  parsedGeneData: GeneRow[],
  parsedTranscriptData: GeneRow[],
  dataSource: DataSource,
  sampleToGroup: Record<string, string>,
  groupToColor: Record<string, string>,
  sampleDataExists: boolean,
) {
  const [geneDataMap, setGeneDataMap] = useState<Record<string, { x: string[]; y: number[] }>>({});

  const currentData = dataSource === 'gene' ? parsedGeneData : parsedTranscriptData;

  const sampleGroupCache = useMemo(() => new Map<string, string>(), []);

  useEffect(() => {
    sampleGroupCache.clear();
  }, [sampleGroupCache]);

  const getSampleGroup = useCallback(
    (sample: string): string => {
      if (sampleGroupCache.has(sample)) {
        return sampleGroupCache.get(sample)!;
      }

      let group = sampleToGroup[sample];

      if (!group) {
        const lowerSample = sample.toLowerCase();
        const upperSample = sample.toUpperCase();

        for (const [key, value] of Object.entries(sampleToGroup)) {
          if (key.toLowerCase() === lowerSample || key.toUpperCase() === upperSample) {
            group = value;
            break;
          }
        }
      }

      if (!group) {
        const normalizedSample = normalizeSampleName(sample);
        group = sampleToGroup[normalizedSample];

        if (!group && normalizedSample) {
          for (const [key, value] of Object.entries(sampleToGroup)) {
            if (normalizeSampleName(key) === normalizedSample) {
              group = value;
              break;
            }
          }
        }
      }

      const result = group || 'Unknown';
      sampleGroupCache.set(sample, result);
      return result;
    },
    [sampleToGroup, sampleGroupCache],
  );

  const groupAndSortSamples = useCallback(
    (samples: string[]): { samples: string[]; groups: string[] } => {
      if (!sampleDataExists) {
        return { samples, groups: samples.map(() => 'Unknown') };
      }

      const sampleGroups = samples.map(sample => ({
        sample,
        group: getSampleGroup(sample),
      }));

      const uniqueGroups = Array.from(new Set(sampleGroups.map(sg => sg.group)));
      const groupOrder = uniqueGroups.sort((a, b) => {
        const colorA = groupToColor[a];
        const colorB = groupToColor[b];
        const indexA = GROUP_COLORS.indexOf(colorA);
        const indexB = GROUP_COLORS.indexOf(colorB);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }

        if (indexA === -1 && indexB !== -1) return 1;
        if (indexA !== -1 && indexB === -1) return -1;

        return a.localeCompare(b);
      });

      sampleGroups.sort((a, b) => {
        const groupIndexA = groupOrder.indexOf(a.group);
        const groupIndexB = groupOrder.indexOf(b.group);

        if (groupIndexA !== groupIndexB) {
          return (groupIndexA === -1 ? Infinity : groupIndexA) - (groupIndexB === -1 ? Infinity : groupIndexB);
        }

        return a.sample.localeCompare(b.sample);
      });

      return {
        samples: sampleGroups.map(sg => sg.sample),
        groups: sampleGroups.map(sg => sg.group),
      };
    },
    [sampleDataExists, getSampleGroup, groupToColor],
  );

  useEffect(() => {
    if (!currentData.length || selectedGenes.size === 0) {
      setGeneDataMap({});
      return;
    }

    const keys = Object.keys(currentData[0]);
    const idCol = keys.length > 0 ? keys[0] : '0';
    const sampleCols = keys.filter(k => k !== '' && k !== '0' && k !== 'undefined').slice(1);
    const newGeneDataMap: Record<string, { x: string[]; y: number[] }> = {};

    selectedGenes.forEach(gene => {
      const row = currentData.find((r: GeneRow) => {
        const rowId = r[idCol] !== undefined ? r[idCol] : r[''] !== undefined ? r[''] : r['0'];
        return String(rowId).trim() === gene.trim();
      });

      if (row) {
        const originalX = sampleCols;
        const originalY = originalX.map(k => {
          const val = row[k] !== undefined ? row[k] : 0;
          return Number(val);
        });

        const { samples: sortedSamples } = groupAndSortSamples(originalX);
        const sortedY = sortedSamples.map(sample => {
          const index = originalX.indexOf(sample);
          return index !== -1 ? originalY[index] : 0;
        });

        newGeneDataMap[gene] = { x: sortedSamples, y: sortedY };
      } else {
        newGeneDataMap[gene] = { x: [], y: [] };
      }
    });

    setGeneDataMap(newGeneDataMap);
  }, [selectedGenes, currentData, groupAndSortSamples]);

  const getBarColors = useCallback(
    (x: string[]) => {
      if (!sampleDataExists) {
        return x.map(() => '#6b7280');
      }

      return x.map(sample => {
        const group = getSampleGroup(sample);
        if (group === 'Unknown') {
          return '#6b7280';
        }
        return groupToColor[group] || '#6b7280';
      });
    },
    [sampleDataExists, getSampleGroup, groupToColor],
  );

  return {
    geneDataMap,
    getBarColors,
  };
}
