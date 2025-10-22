import type { PlotData } from 'plotly.js';

export const COLORS = [
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

export type PCADataRow = {
  [key: string]: string | number | undefined;
};

export function createGroupColorMapping(groupSet: Set<string>): Record<string, string> {
  const groupArr = Array.from(groupSet).sort();
  const groupColor: Record<string, string> = {};
  groupArr.forEach((g, i) => {
    groupColor[g] = COLORS[i % COLORS.length];
  });
  return groupColor;
}

export function parseIdToGroupMapping(
  sampleData: PCADataRow[],
  sampleColumn: string,
  groupColumn: string,
): { idToGroup: Record<string, string>; groupSet: Set<string> } {
  const idToGroup: Record<string, string> = {};
  const groupSet = new Set<string>();

  const getColumnValue = (row: PCADataRow, column: string) => {
    if (column.startsWith('col_')) {
      const index = Number.parseInt(column.split('_')[1], 10);
      const keys = Object.keys(row);
      return row[keys[index]];
    }
    return row[column];
  };

  sampleData.forEach((row: PCADataRow) => {
    const sampleId = getColumnValue(row, sampleColumn);
    const groupValue = getColumnValue(row, groupColumn);

    if (sampleId !== undefined && groupValue !== undefined) {
      idToGroup[String(sampleId)] = String(groupValue);
      groupSet.add(String(groupValue));
    }
  });

  return { idToGroup, groupSet };
}

export function createPCATraces(
  pcaData: PCADataRow[],
  pcaHeader: string[],
  xAxisColumn: string,
  yAxisColumn: string,
  idToGroup: Record<string, string>,
  groupColor: Record<string, string>,
  hasSampleData: boolean,
): Partial<PlotData>[] {
  const getIdValue = (row: PCADataRow, header: string[]) => {
    const idKey = header[0] === '' || header[0] === undefined ? '0' : header[0];
    return row[''] !== undefined ? row[''] : row[idKey] !== undefined ? row[idKey] : row['0'];
  };

  const xKey =
    xAxisColumn === 'Sample_ID'
      ? ''
      : xAxisColumn.startsWith('Column_')
        ? Object.keys(pcaData[0] || {})[parseInt(xAxisColumn.split('_')[1], 10)]
        : xAxisColumn;
  const yKey =
    yAxisColumn === 'Sample_ID'
      ? ''
      : yAxisColumn.startsWith('Column_')
        ? Object.keys(pcaData[0] || {})[parseInt(yAxisColumn.split('_')[1], 10)]
        : yAxisColumn;

  if (!hasSampleData) {
    const allData: { x: number[]; y: number[]; text: string[] } = { x: [], y: [], text: [] };

    for (const row of pcaData) {
      const id = getIdValue(row, pcaHeader);
      const xVal = row[xKey] as number;
      const yVal = row[yKey] as number;

      if (typeof xVal === 'number' && typeof yVal === 'number' && id !== undefined) {
        allData.x.push(xVal);
        allData.y.push(yVal);
        allData.text.push(String(id));
      }
    }

    return [
      {
        x: allData.x,
        y: allData.y,
        text: allData.text.map(id => `ID: ${id}`),
        type: 'scatter',
        mode: 'markers',
        name: 'Data Points',
        marker: { color: '#6b7280', size: 14 },
        hovertemplate: '%{text}<extra></extra>',
      },
    ];
  }

  const grouped: Record<string, { x: number[]; y: number[]; text: string[] }> = {};

  for (const row of pcaData) {
    const id = getIdValue(row, pcaHeader);
    const xVal = row[xKey] as number;
    const yVal = row[yKey] as number;
    const group = id !== undefined && idToGroup[String(id)] ? idToGroup[String(id)] : 'Unknown';

    if (typeof xVal === 'number' && typeof yVal === 'number' && id !== undefined) {
      if (!grouped[group]) grouped[group] = { x: [], y: [], text: [] };
      grouped[group].x.push(xVal);
      grouped[group].y.push(yVal);
      grouped[group].text.push(String(id));
    }
  }

  return Object.entries(grouped).map(([group, data], idx) => ({
    x: data.x,
    y: data.y,
    text: data.text.map(id => `ID: ${id}<br>Group: ${group}`),
    type: 'scatter',
    mode: 'markers',
    name: group,
    marker: { color: groupColor[group] || COLORS[idx % COLORS.length], size: 9 },
    hovertemplate: '%{text}<extra></extra>',
  }));
}

export function getColumnName(header: string[], index: number): string {
  return header[index] === '' || header[index] === undefined ? `col_${index}` : header[index];
}

export function getDefaultSampleColumn(header: string[]): string {
  return getColumnName(header, 0);
}

export function getDefaultGroupColumn(header: string[]): string {
  const lastIndex = header.length - 1;
  return getColumnName(header, lastIndex);
}
