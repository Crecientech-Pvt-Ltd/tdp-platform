'use client';

import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import Plot from 'react-plotly.js';
import type { PlotData } from 'plotly.js';

type PCADataRow = {
  [key: string]: string | number | undefined;
};

const COLORS = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
];

interface PCAProps {
  samplesheetUrl?: string;
  pcaUrl?: string;
}

export default function PCA({ samplesheetUrl, pcaUrl }: PCAProps) {
  const [traces, setTraces] = useState<Partial<PlotData>[]>([]);
  const [groupToColor, setGroupToColor] = useState<Record<string, string>>({});
  const [sampleDataExists, setSampleDataExists] = useState(false);

  useEffect(() => {
    const loadPCAData = (
      idToGroup: Record<string, string>,
      groupColor: Record<string, string>,
      hasSampleData: boolean,
    ) => {
      if (!pcaUrl) {
        setTraces([]);
        return;
      }
      fetch(pcaUrl)
        .then(res => res.text())
        .then(pcaText => {
          Papa.parse<PCADataRow>(pcaText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: pcaResults => {
              const pcaHeader = pcaResults.meta.fields ?? [];
              if (pcaHeader.length < 3) {
                setTraces([]);
                return;
              }
              const idKey = pcaHeader[0] === '' || pcaHeader[0] === undefined ? '0' : pcaHeader[0];
              const pc1Key = pcaHeader[1] || '1';
              const pc2Key = pcaHeader[2] || '2';

              if (!hasSampleData) {
                const allData = {
                  x: [] as number[],
                  y: [] as number[],
                  text: [] as string[],
                };

                pcaResults.data.forEach(row => {
                  const id = row[''] !== undefined ? row[''] : row[idKey] !== undefined ? row[idKey] : row['0'];
                  const pc1 = (row[pc1Key] !== undefined ? row[pc1Key] : row['1']) as number;
                  const pc2 = (row[pc2Key] !== undefined ? row[pc2Key] : row['2']) as number;

                  if (typeof pc1 === 'number' && typeof pc2 === 'number' && id !== undefined) {
                    allData.x.push(pc1);
                    allData.y.push(pc2);
                    allData.text.push(String(id));
                  }
                });

                const traces: Partial<PlotData>[] = [
                  {
                    x: allData.x,
                    y: allData.y,
                    text: allData.text.map(id => `ID: ${id}`),
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Data Points',
                    marker: { color: '#6b7280', size: 7 },
                    hovertemplate: '%{text}<extra></extra>',
                  },
                ];
                setTraces(traces);
              } else {
                const grouped: Record<string, { x: number[]; y: number[]; text: string[] }> = {};
                pcaResults.data.forEach(row => {
                  const id = row[''] !== undefined ? row[''] : row[idKey] !== undefined ? row[idKey] : row['0'];
                  const pc1 = (row[pc1Key] !== undefined ? row[pc1Key] : row['1']) as number;
                  const pc2 = (row[pc2Key] !== undefined ? row[pc2Key] : row['2']) as number;

                  const group = id !== undefined && idToGroup[String(id)] ? idToGroup[String(id)] : 'Unknown';
                  if (typeof pc1 === 'number' && typeof pc2 === 'number' && id !== undefined) {
                    if (!grouped[group]) grouped[group] = { x: [], y: [], text: [] };
                    grouped[group].x.push(pc1);
                    grouped[group].y.push(pc2);
                    grouped[group].text.push(String(id));
                  }
                });

                const traces: Partial<PlotData>[] = Object.entries(grouped).map(([group, data], idx) => ({
                  x: data.x,
                  y: data.y,
                  text: data.text.map(id => `ID: ${id}<br>Group: ${group}`),
                  type: 'scatter',
                  mode: 'markers',
                  name: group,
                  marker: { color: groupColor[group] || COLORS[idx % COLORS.length], size: 7 },
                  hovertemplate: '%{text}<extra></extra>',
                }));
                setTraces(traces);
              }
            },
            error: () => {
              setTraces([]);
            },
          });
        })
        .catch(() => {
          setTraces([]);
        });
    };

    if (!samplesheetUrl) {
      setSampleDataExists(false);
      setGroupToColor({});
      loadPCAData({}, {}, false);
      return;
    }

    fetch(samplesheetUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error('Sample file not found');
        }
        return res.text();
      })
      .then(sampleText => {
        Papa.parse<PCADataRow>(sampleText, {
          header: true,
          skipEmptyLines: true,
          complete: sampleResults => {
            const sampleHeader = sampleResults.meta.fields ?? [];
            if (sampleHeader.length < 2) {
              setSampleDataExists(false);
              setGroupToColor({});
              loadPCAData({}, {}, false);
              return;
            }

            const nameKey = sampleHeader[0] === '' || sampleHeader[0] === undefined ? '0' : sampleHeader[0];
            const groupKey = sampleHeader[sampleHeader.length - 1] || String(sampleHeader.length - 1);

            const idToGroup: Record<string, string> = {};
            const groupSet = new Set<string>();
            sampleResults.data.forEach(row => {
              const name = row[''] !== undefined ? row[''] : row[nameKey] !== undefined ? row[nameKey] : row['0'];

              const group = row[groupKey] !== undefined ? row[groupKey] : row[String(sampleHeader.length - 1)];

              if (name !== undefined && group !== undefined) {
                idToGroup[String(name)] = String(group);
                groupSet.add(String(group));
              }
            });

            const groupArr = Array.from(groupSet).sort();
            const groupColor: Record<string, string> = {};
            groupArr.forEach((g, i) => {
              groupColor[g] = COLORS[i % COLORS.length];
            });
            setGroupToColor(groupColor);
            setSampleDataExists(true);
            loadPCAData(idToGroup, groupColor, true);
          },
          error: () => {
            setSampleDataExists(false);
            setGroupToColor({});
            loadPCAData({}, {}, false);
          },
        });
      })
      .catch(() => {
        setSampleDataExists(false);
        setGroupToColor({});
        loadPCAData({}, {}, false);
      });
  }, [samplesheetUrl, pcaUrl]);

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

  return (
    <div className='w-full px-4 sm:px-6 lg:px-8 max-w-[95vw] lg:max-w-[1400px] mx-auto'>
      {!pcaUrl ? (
        <div className='min-h-[60vh] flex items-center justify-center'>
          <div className='text-center text-gray-500 text-lg font-medium'>Kindly add PCA file to view the plot.</div>
        </div>
      ) : (
        <>
          <h2 className='text-xl sm:text-2xl font-semibold mb-6 text-center'>PCA Plot (PC1 vs PC2)</h2>
          <div className='min-h-[40px] flex items-center justify-center mb-6'>{renderGroupLegend()}</div>
          <div className='relative w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[750px] xl:min-h-[850px] 2xl:min-h-[950px]'>
            <Plot
              data={traces}
              layout={{
                title: { text: 'PCA Plot', font: { size: 18 } },
                xaxis: {
                  title: { text: 'PC1' },
                  automargin: true,
                  tickangle: 0,
                  tickfont: { size: 12 },
                },
                yaxis: {
                  title: { text: 'PC2' },
                  tickfont: { size: 12 },
                },
                margin: { t: 60, l: 60, r: 40, b: 80 },
                autosize: true,
                showlegend: false,
              }}
              useResizeHandler
              style={{ width: '100%', height: '100%' }}
              config={{ responsive: true, displayModeBar: false }}
            />
          </div>
        </>
      )}
    </div>
  );
}
