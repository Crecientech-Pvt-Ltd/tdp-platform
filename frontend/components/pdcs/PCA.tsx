'use client';

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import Plot from 'react-plotly.js';

type PCARow = {
  'ENSCGRG-Id': string;
  PC1: number;
  PC2: number;
};

export default function PCA() {
  const [dataPoints, setDataPoints] = useState<{ x: number; y: number; text: string }[]>([]);

  useEffect(() => {
    fetch('/PCA.csv')
      .then(res => res.text())
      .then(csvText => {
        Papa.parse<PCARow>(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: results => {
            const parsed = results.data;
            const formatted = parsed.map(d => ({
              x: d.PC1,
              y: d.PC2,
              text: d['ENSCGRG-Id'],
            }));
            setDataPoints(formatted);
          },
        });
      });
  }, []);

  return (
    <div>
      <h2 className='text-xl font-semibold mb-4'>PCA Plot (PC1 vs PC2)</h2>
      <div className='flex justify-center mt-8 overflow-x-auto' style={{ width: '100%' }}>
        <div style={{ minWidth: 950, maxWidth: '100vw' }}>
          <Plot
            data={[
              {
                x: dataPoints.map(d => d.x),
                y: dataPoints.map(d => d.y),
                text: dataPoints.map(d => `ID: ${d.text}`),
                type: 'scatter',
                mode: 'markers',
                marker: { color: 'green', size: 6 },
                hoverinfo: 'text',
              },
            ]}
            layout={{
              width: 900,
              height: 650,
              title: { text: 'PCA Plot' },
              xaxis: { title: { text: 'PC1' }, automargin: true, tickangle: 0 },
              yaxis: { title: { text: 'PC2' } },
              margin: { t: 60, l: 60, r: 40, b: 100 },
            }}
          />
        </div>
      </div>
    </div>
  );
}
