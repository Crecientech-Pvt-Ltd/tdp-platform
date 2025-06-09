import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Papa from 'papaparse';
import { VirtualizedCombobox } from '@/components/VirtualizedCombobox';

type GeneRow = {
  [key: string]: string | number;
  'ENSCGRG-Id': string;
};

export default function TranscriptExpression() {
  const [selectedGene, setSelectedGene] = useState('');
  const [geneList, setGeneList] = useState<string[]>([]);
  const [geneData, setGeneData] = useState<GeneRow[]>([]);
  const [barData, setBarData] = useState<{ x: string[]; y: number[] }>({ x: [], y: [] });

  useEffect(() => {
    fetch('/bar.csv')
      .then(res => res.text())
      .then(text => {
        Papa.parse<GeneRow>(text, {
          header: true,
          skipEmptyLines: true,
          complete: results => {
            const data = results.data as GeneRow[];
            setGeneData(data);
            const genes = data.map(row => row['ENSCGRG-Id']);
            setGeneList(genes);
            if (genes.length > 0) setSelectedGene(genes[0]);
          },
        });
      });
  }, []);

  useEffect(() => {
    if (selectedGene && geneData.length > 0) {
      const row = geneData.find(row => row['ENSCGRG-Id'] === selectedGene);
      if (row) {
        const x = Object.keys(row).filter(k => k !== 'ENSCGRG-Id');
        const y = x.map(k => Number(row[k]));
        setBarData({ x, y });
      } else {
        setBarData({ x: [], y: [] });
      }
    } else {
      setBarData({ x: [], y: [] });
    }
  }, [selectedGene, geneData]);

  return (
    <div>
      <label className='block mb-2 font-semibold'>Select Gene</label>
      <div className='flex gap-2 mb-4'>
        <VirtualizedCombobox
          data={geneList}
          value={selectedGene}
          onChange={val => typeof val === 'string' && setSelectedGene(val)}
          placeholder='Search gene...'
          loading={geneList.length === 0}
          className='w-full'
        />
        <button
          className='bg-blue-600 text-white px-4 py-1 rounded'
          onClick={() => {
            if (geneList.length > 0 && !selectedGene) setSelectedGene(geneList[0]);
          }}
        >
          Go
        </button>
      </div>
      {selectedGene && barData.x.length > 0 && (
        <div className='flex justify-center mt-8 overflow-x-auto' style={{ width: '100%' }}>
          <div style={{ minWidth: 950, maxWidth: '100vw' }}>
            <Plot
              data={[
                {
                  x: barData.x,
                  y: barData.y,
                  type: 'bar',
                  marker: { color: '#3182ce' },
                },
              ]}
              layout={{
                width: 900,
                height: 600,
                title: { text: `Bar chart for ${selectedGene}` },
                xaxis: {
                  title: { text: 'Sample' },
                  tickangle: 45,
                  automargin: true,
                },
                yaxis: { title: { text: 'Value' } },
                margin: { t: 60, l: 60, r: 40, b: 120 },
              }}
              config={{ responsive: true }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
