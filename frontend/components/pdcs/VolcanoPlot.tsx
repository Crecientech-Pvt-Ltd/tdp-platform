'use client';

import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';

type Point = {
  x: number;
  y: number;
  text: string;
  color: string;
};

export default function VolcanoPlot() {
  const [dataPoints, setDataPoints] = useState<Point[]>([]);

  useEffect(() => {
    const loadCSV = async () => {
      const response = await fetch('/volcano.csv');
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: results => {
          const parsed = results.data as {
            'ENSCGRG-Id': string;
            logFC: number;
            PValue: number;
            FDR: number;
          }[];

          const formatted = parsed
            .filter(d => d.logFC !== undefined && d.PValue !== undefined)
            .map(d => {
              const logP = -Math.log10(d.PValue);
              let color = 'gray';

              if (d.logFC >= 1 && logP >= 2) {
                color = 'red';
              } else if (d.logFC <= -1 && logP >= 2) {
                color = 'blue';
              }

              return {
                x: d.logFC,
                y: logP,
                text: d['ENSCGRG-Id'],
                color,
              };
            });

          setDataPoints(formatted);
        },
      });
    };

    loadCSV();
  }, []);

  return (
    <div className='p-4'>
      {dataPoints.length > 0 ? (
        <div className='flex justify-center mt-8 overflow-x-auto' style={{ width: '100%' }}>
          <div style={{ minWidth: 900, maxWidth: '100vw', marginLeft: '80px' }}>
            <Plot
              data={[
                {
                  x: dataPoints.map(p => p.x),
                  y: dataPoints.map(p => p.y),
                  text: dataPoints.map(p => `ID: ${p.text}`),
                  type: 'scatter',
                  mode: 'markers',
                  marker: {
                    color: dataPoints.map(p => p.color),
                    size: 8,
                  },
                  hoverinfo: 'text',
                },
              ]}
              layout={{
                title: { text: 'Volcano Plot' },
                xaxis: { title: { text: 'logFC' } },
                yaxis: { title: { text: '-log10(PValue)' } },
                height: 600,
                width: 800,
              }}
            />
          </div>
        </div>
      ) : (
        <p>Loading volcano plot...</p>
      )}
    </div>
  );
}
