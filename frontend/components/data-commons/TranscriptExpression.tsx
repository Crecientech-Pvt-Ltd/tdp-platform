'use client';

import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';
import { VirtualizedCombobox } from '@/components/VirtualizedCombobox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type GeneRow = {
  [key: string]: string | number;
};

type SampleRow = {
  [key: string]: string;
};

type DataSource = 'gene' | 'transcript';

const GROUP_COLORS = ['#3182ce', '#e53e3e', '#38a169', '#d69e2e', '#805ad5', '#319795', '#dd6b20', '#718096'];

interface TranscriptExpressionProps {
  samplesheetUrl?: string;
  geneCountsUrl?: string;
  transcriptCountsUrl?: string;
}

export default function TranscriptExpression({
  samplesheetUrl,
  geneCountsUrl,
  transcriptCountsUrl,
}: TranscriptExpressionProps) {
  const [geneList, setGeneList] = useState<string[]>([]);
  const [selectedGenes, setSelectedGenes] = useState<Set<string>>(new Set());
  const [geneData, setGeneData] = useState<GeneRow[]>([]);
  const [transcriptData, setTranscriptData] = useState<GeneRow[]>([]);
  const [geneDataMap, setGeneDataMap] = useState<Record<string, { x: string[]; y: number[] }>>({});
  const [sampleToGroup, setSampleToGroup] = useState<Record<string, string>>({});
  const [groupToColor, setGroupToColor] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<DataSource>('gene');
  const [sampleDataExists, setSampleDataExists] = useState(false);

  function getIdColName(row: GeneRow): string {
    const keys = Object.keys(row);
    return keys.length > 0 ? keys[0] : '0';
  }

  function getSampleColNames(row: GeneRow): string[] {
    const keys = Object.keys(row).filter(k => k !== '' && k !== '0' && k !== 'undefined');
    return keys.length > 1 ? keys.slice(1) : [];
  }

  function normalizeSampleName(sample: string): string {
    if (!sample) return '';
    return String(sample)
      .trim()
      .toLowerCase()
      .replace(/^sample[-_]?/i, '')
      .replace(/[^a-z0-9]/g, '');
  }

  useEffect(() => {
    if (!samplesheetUrl) {
      setSampleDataExists(false);
      setSampleToGroup({});
      setGroupToColor({});
      return;
    }
    fetch(samplesheetUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error('Sample file not found');
        }
        return res.text();
      })
      .then(text => {
        const isTabDelimited = text.indexOf('\t') !== -1;

        Papa.parse<SampleRow>(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: isTabDelimited ? '\t' : undefined,
          complete: results => {
            const rows = results.data as SampleRow[];
            if (!rows.length) {
              setSampleDataExists(false);
              setSampleToGroup({});
              setGroupToColor({});
              return;
            }

            const sampleHeader = results.meta.fields ?? [];
            if (sampleHeader.length < 2) {
              setSampleDataExists(false);
              setSampleToGroup({});
              setGroupToColor({});
              return;
            }

            const nameKey = sampleHeader[0] === '' || sampleHeader[0] === undefined ? '0' : sampleHeader[0];
            const groupKey = sampleHeader[sampleHeader.length - 1] || String(sampleHeader.length - 1);

            const sampleGroup: Record<string, string> = {};
            const groupSet = new Set<string>();

            rows.forEach(row => {
              const sample = row[''] !== undefined ? row[''] : row[nameKey] !== undefined ? row[nameKey] : row['0'];
              const group = row[groupKey] !== undefined ? row[groupKey] : row[String(sampleHeader.length - 1)];

              if (sample && group) {
                const normalizedSample = normalizeSampleName(String(sample));
                sampleGroup[String(sample)] = String(group);

                if (normalizedSample) {
                  sampleGroup[normalizedSample] = String(group);
                }

                groupSet.add(String(group));
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
          },
        });
      })
      .catch(() => {
        setSampleDataExists(false);
        setSampleToGroup({});
        setGroupToColor({});
      });
  }, [samplesheetUrl]);

  useEffect(() => {
    setLoading(true);
    if (!geneCountsUrl) {
      setGeneData([]);
      setLoading(false);
      return;
    }
    fetch(geneCountsUrl)
      .then(res => res.text())
      .then(text => {
        const isTabDelimited = text.indexOf('\t') !== -1;

        Papa.parse<GeneRow>(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: isTabDelimited ? '\t' : undefined,
          complete: results => {
            const data = results.data as GeneRow[];
            setGeneData(data);
            setLoading(false);
          },
        });
      })
      .catch(() => setLoading(false));
  }, [geneCountsUrl]);

  useEffect(() => {
    setLoading(true);
    if (!transcriptCountsUrl) {
      setTranscriptData([]);
      setLoading(false);
      return;
    }

    fetch(transcriptCountsUrl)
      .then(res => res.text())
      .then(text => {
        const isTabDelimited = text.indexOf('\t') !== -1;

        Papa.parse<GeneRow>(text, {
          header: true,
          skipEmptyLines: true,
          delimiter: isTabDelimited ? '\t' : undefined,
          complete: results => {
            const data = results.data as GeneRow[];
            setTranscriptData(data);
            setLoading(false);
          },
        });
      })
      .catch(() => {
        setTranscriptData([]);
        setLoading(false);
      });
  }, [transcriptCountsUrl]);

  useEffect(() => {
    const currentData = dataSource === 'gene' ? geneData : transcriptData;
    if (currentData.length > 0) {
      const idCol = getIdColName(currentData[0]);
      const genes = currentData
        .map(row => {
          const id = row[idCol] !== undefined ? row[idCol] : row['0'];
          return id as string;
        })
        .filter(Boolean);
      genes.sort();
      setGeneList(genes);
      setSelectedGenes(new Set());
    }
  }, [dataSource, geneData, transcriptData]);

  useEffect(() => {
    const currentData = dataSource === 'gene' ? geneData : transcriptData;

    if (!currentData.length || selectedGenes.size === 0) {
      setGeneDataMap({});
      return;
    }

    const idCol = getIdColName(currentData[0]);
    const sampleCols = getSampleColNames(currentData[0]);
    const newGeneDataMap: Record<string, { x: string[]; y: number[] }> = {};

    selectedGenes.forEach(gene => {
      const row = currentData.find(r => {
        const rowId =
          r[idCol] !== undefined ? r[idCol] : r[''] !== undefined ? r[''] : r['0'] !== undefined ? r['0'] : r[0];

        return String(rowId).trim() === gene.trim();
      });

      if (row) {
        const x = sampleCols;
        const y = x.map(k => {
          const val = row[k] !== undefined ? row[k] : row[k.toString()] !== undefined ? row[k.toString()] : 0;

          return Number(val);
        });
        newGeneDataMap[gene] = { x, y };
      } else {
        newGeneDataMap[gene] = { x: [], y: [] };
      }
    });

    setGeneDataMap(newGeneDataMap);
  }, [selectedGenes, geneData, transcriptData, dataSource]);

  const selectedGenesArray = Array.from(selectedGenes).sort();

  function getBarColors(x: string[]) {
    if (!sampleDataExists) {
      return x.map(() => '#6b7280');
    }

    return x.map(sample => {
      let group = sampleToGroup[sample];

      if (!group) {
        const normalizedSample = normalizeSampleName(sample);
        group = sampleToGroup[normalizedSample];

        if (!group && sample.includes('.')) {
          const shortSample = sample.split('.').pop() || '';
          group = sampleToGroup[shortSample];

          if (!group) {
            group = sampleToGroup[normalizeSampleName(shortSample)];
          }
        }

        if (!group) {
          const matchingKey = Object.keys(sampleToGroup).find(key => normalizeSampleName(key) === normalizedSample);

          if (matchingKey) {
            group = sampleToGroup[matchingKey];
          }
        }

        if (!group && normalizedSample) {
          const partialMatchKey = Object.keys(sampleToGroup).find(key => {
            const normKey = normalizeSampleName(key);
            return normKey.includes(normalizedSample) || normalizedSample.includes(normKey);
          });

          if (partialMatchKey) {
            group = sampleToGroup[partialMatchKey];
          }
        }
      }

      return groupToColor[group] || '#3182ce';
    });
  }

  function calculateBottomMargin(labels: string[]) {
    if (!labels || labels.length === 0) return 120;
    const maxLabelLength = labels.reduce((max, l) => Math.max(max, String(l).length), 0);
    return Math.max(120, Math.min(80 + maxLabelLength * 6, 250));
  }

  function renderGroupLegend() {
    if (!sampleDataExists) return null;

    const groupNames = Object.keys(groupToColor).sort();
    if (groupNames.length === 0) return null;

    return (
      <div className='flex gap-4 mb-6 flex-wrap justify-center'>
        {groupNames.map(group => (
          <div key={group} className='flex items-center gap-2'>
            <span
              style={{
                display: 'inline-block',
                width: 16,
                height: 16,
                background: groupToColor[group],
                borderRadius: 4,
                border: '1px solid #ccc',
              }}
            />
            <span className='text-sm font-medium'>{group}</span>
          </div>
        ))}
      </div>
    );
  }

  const handleGeneSelection = (value: string | Set<string>) => {
    if (value instanceof Set) {
      const limitedSet = new Set(Array.from(value).slice(0, 4));
      setSelectedGenes(limitedSet);
    }
  };

  const hasGene = !!geneCountsUrl;
  const hasTranscript = !!transcriptCountsUrl;

  useEffect(() => {
    if (hasGene && !hasTranscript) setDataSource('gene');
    else if (!hasGene && hasTranscript) setDataSource('transcript');
    else if (hasGene && hasTranscript && !['gene', 'transcript'].includes(dataSource)) setDataSource('gene');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGene, hasTranscript]);

  const isLoading = loading;

  return (
    <div className='w-full px-4 sm:px-6 lg:px-8 max-w-[95vw] lg:max-w-[1500px] mx-auto'>
      {!hasGene && !hasTranscript ? (
        <div className='min-h-[60vh] flex items-center justify-center'>
          <div className='text-center text-gray-500 text-lg font-medium'>
            Kindly add CPM/TPM metric files to view plots.
          </div>
        </div>
      ) : isLoading ? (
        <div className='min-h-[60vh] flex items-center justify-center'>
          <div className='text-center text-gray-500'>
            <Spinner />
            <p className='mt-4'>Loading data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className='mb-8 min-h-[120px]'>
            <div className='max-w-4xl mx-auto mb-6'>
              <div className='flex items-center gap-6'>
                {hasGene && hasTranscript && (
                  <div className='flex items-center gap-3 min-w-fit'>
                    <Label htmlFor='data-source-toggle' className='text-sm font-medium whitespace-nowrap'>
                      Gene Data
                    </Label>
                    <Switch
                      id='data-source-toggle'
                      checked={dataSource === 'transcript'}
                      onCheckedChange={checked => setDataSource(checked ? 'transcript' : 'gene')}
                      disabled={isLoading}
                    />
                    <Label htmlFor='data-source-toggle' className='text-sm font-medium whitespace-nowrap'>
                      Transcript Data
                    </Label>
                  </div>
                )}
                <div className='flex-1 flex flex-col justify-center'>
                  <label className='block text-sm font-semibold text-gray-700'>
                    Select {dataSource === 'gene' ? 'Genes' : 'Transcripts'} (up to 4)
                  </label>
                  <VirtualizedCombobox
                    data={geneList}
                    value={selectedGenes}
                    onChange={handleGeneSelection}
                    placeholder={`Search and select ${dataSource === 'gene' ? 'genes' : 'transcripts'}...`}
                    loading={isLoading}
                    className='w-full'
                    multiselect={true}
                    showSelectedAsChip={true}
                  />
                  {selectedGenes.size > 0 && (
                    <p className='text-xs text-gray-500 mt-1'>
                      {selectedGenes.size} {dataSource === 'gene' ? 'gene' : 'transcript'}
                      {selectedGenes.size !== 1 ? 's' : ''} selected
                      {selectedGenes.size >= 4 && ' (maximum reached)'}
                    </p>
                  )}
                  {selectedGenes.size === 0 && <p className='text-xs text-transparent mt-1'>placeholder</p>}
                </div>
              </div>
            </div>

            <div className='min-h-[40px] flex items-center justify-center'>{renderGroupLegend()}</div>
          </div>

          <div className='min-h-[60vh]'>
            {selectedGenesArray.length > 0 && (
              <div className='w-full overflow-x-auto overflow-y-auto max-h-[90vh]'>
                {selectedGenesArray.length === 1 ? (
                  <div className='w-full min-h-[60vh] md:min-h-[65vh] xl:min-h-[70vh]'>
                    <Plot
                      data={[
                        {
                          x: geneDataMap[selectedGenesArray[0]]?.x || [],
                          y: geneDataMap[selectedGenesArray[0]]?.y || [],
                          type: 'bar',
                          marker: {
                            color: getBarColors(geneDataMap[selectedGenesArray[0]]?.x || []),
                          },
                        },
                      ]}
                      layout={{
                        title: {
                          text: `${dataSource === 'gene' ? 'Gene' : 'Transcript'} Expression - ${selectedGenesArray[0]}`,
                          font: { size: 18 },
                        },
                        xaxis: {
                          tickangle: 45,
                          automargin: true,
                          tickfont: { size: 12 },
                        },
                        yaxis: {
                          title: { text: 'Total read count (millions)', font: { size: 14 } },
                          tickfont: { size: 12 },
                        },
                        margin: {
                          t: 60,
                          l: 80,
                          r: 40,
                          b: calculateBottomMargin(geneDataMap[selectedGenesArray[0]]?.x || []) + 40,
                        },
                        autosize: true,
                        showlegend: false,
                      }}
                      useResizeHandler
                      style={{ width: '100%', height: '100%' }}
                      config={{ responsive: true, displayModeBar: false }}
                    />
                  </div>
                ) : selectedGenesArray.length >= 3 ? (
                  <div className='space-y-2'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      {selectedGenesArray.map(gene => {
                        const labels = geneDataMap[gene]?.x || [];
                        const bottomMargin = calculateBottomMargin(labels);

                        return (
                          <div key={gene} className='w-full h-[280px]'>
                            <Plot
                              data={[
                                {
                                  x: geneDataMap[gene]?.x || [],
                                  y: geneDataMap[gene]?.y || [],
                                  type: 'bar',
                                  marker: {
                                    color: getBarColors(geneDataMap[gene]?.x || []),
                                  },
                                },
                              ]}
                              layout={{
                                title: {
                                  text: gene,
                                  font: { size: 13 },
                                },
                                xaxis: {
                                  tickangle: 45,
                                  automargin: true,
                                  tickfont: { size: 9 },
                                },
                                yaxis: {
                                  title: {
                                    text: 'Total read count (millions)',
                                    font: { size: 10 },
                                  },
                                  tickfont: { size: 9 },
                                },
                                margin: {
                                  t: 30,
                                  l: 45,
                                  r: 20,
                                  b: bottomMargin,
                                },
                                autosize: true,
                                showlegend: false,
                              }}
                              useResizeHandler
                              style={{ width: '100%', height: '100%' }}
                              config={{ responsive: true, displayModeBar: false }}
                            />
                          </div>
                        );
                      })}
                      <div className='invisible w-full min-h-[320px]'></div>
                    </div>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    <div className='grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-2'>
                      {selectedGenesArray.slice(0, 4).map(gene => {
                        const labels = geneDataMap[gene]?.x || [];
                        const bottomMargin = calculateBottomMargin(labels);

                        return (
                          <div key={gene} className='w-full min-h-[400px] md:min-h-[450px] xl:min-h-[500px]'>
                            <Plot
                              data={[
                                {
                                  x: geneDataMap[gene]?.x || [],
                                  y: geneDataMap[gene]?.y || [],
                                  type: 'bar',
                                  marker: {
                                    color: getBarColors(geneDataMap[gene]?.x || []),
                                  },
                                },
                              ]}
                              layout={{
                                title: {
                                  text: gene,
                                  font: { size: 13 },
                                },
                                xaxis: {
                                  tickangle: 45,
                                  automargin: true,
                                  tickfont: { size: 9 },
                                },
                                yaxis: {
                                  title: {
                                    text: 'Total read count (millions)',
                                    font: { size: 10 },
                                  },
                                  tickfont: { size: 9 },
                                },
                                margin: {
                                  t: 30,
                                  l: 45,
                                  r: 20,
                                  b: bottomMargin,
                                },
                                autosize: true,
                                showlegend: false,
                              }}
                              useResizeHandler
                              style={{ width: '100%', height: '100%' }}
                              config={{ responsive: true, displayModeBar: false }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedGenesArray.length === 0 && !isLoading && (
              <div className='text-center py-12 min-h-[60vh] flex items-center justify-center'>
                <div>
                  <p className='text-gray-500 text-lg mb-4'>
                    Select {dataSource === 'gene' ? 'genes' : 'transcripts'} to view their expression data
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
