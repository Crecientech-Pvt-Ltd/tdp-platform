'use client';

import { DownloadIcon } from 'lucide-react';
import Papa from 'papaparse';
import { useCallback, useEffect, useMemo, useState } from 'react';
import DownloadPopup, { type DownloadFileSpec } from '@/components/data-commons/common/DownloadPopup';
import SeeMore from '@/components/data-commons/common/SeeMore';
import type { FileSource } from '@/components/data-commons/upload/hooks/useDataFiles';
import { useFileData } from '@/components/data-commons/upload/hooks/useFileData';
import { usePCAColumns, usePCAData, useSampleColumns } from './hooks';
import { EmptyState, GroupLegend, LoadingState, PCAHeader, PCALayout, PCAPlot } from './PCAComponents';
import { getDefaultGroupColumn, getDefaultSampleColumn } from './utils';

interface PCAProps {
  sampleFile: FileSource | null;
  pcaFile: FileSource | null;
  group?: string;
  program?: string;
  project?: string;
}

export default function PCA({
  sampleFile,
  pcaFile,
  group = 'default',
  program = 'PCA',
  project = 'analysis',
}: PCAProps) {
  const [showSeeMore, setShowSeeMore] = useState(false);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);

  const { data: sampleData, loading: sampleLoading } = useFileData(sampleFile);
  const { data: pcaData, loading: pcaLoading } = useFileData(pcaFile);

  const { pcaColumns, setPcaColumns, xAxisColumn, setXAxisColumn, yAxisColumn, setYAxisColumn, handleAxisChange } =
    usePCAColumns();

  const {
    samplesheetColumns,
    setSamplesheetColumns,
    sampleColumn,
    setSampleColumn,
    groupColumn,
    setGroupColumn,
    handleColumnChange,
  } = useSampleColumns();

  const {
    traces,
    groupToColor,
    sampleDataExists,
    loading: pcaDataLoading,
  } = usePCAData(pcaData, sampleData, sampleColumn, groupColumn, xAxisColumn, yAxisColumn);

  const loading = sampleLoading || pcaLoading || pcaDataLoading;
  const hasPCAFile = !!(pcaFile && (pcaFile.url || pcaFile.content));

  const pcaHeaders = useMemo(() => {
    if (!pcaData) return [];

    const isTabDelimited = pcaData.indexOf('\t') !== -1;
    let headers: string[] = [];

    Papa.parse(pcaData, {
      header: true,
      preview: 1,
      delimiter: isTabDelimited ? '\t' : undefined,
      complete: results => {
        const header = results.meta.fields ?? [];
        headers = header.map((col, idx) => {
          if (!col || col.trim() === '') {
            return idx === 0 ? 'Sample_ID' : `Column_${idx}`;
          }
          return col;
        });
      },
    });

    return headers;
  }, [pcaData]);

  const sampleHeaders = useMemo(() => {
    if (!sampleData) return [];

    const isTabDelimited = sampleData.indexOf('\t') !== -1;
    let headers: string[] = [];

    Papa.parse(sampleData, {
      header: true,
      preview: 1,
      delimiter: isTabDelimited ? '\t' : undefined,
      complete: results => {
        headers = results.meta.fields ?? [];
      },
    });

    return headers;
  }, [sampleData]);

  useEffect(() => {
    if (pcaHeaders.length > 0) {
      setPcaColumns(pcaHeaders);

      if (!xAxisColumn && pcaHeaders.length > 1) {
        setXAxisColumn(pcaHeaders[1]);
      }
      if (!yAxisColumn && pcaHeaders.length > 2) {
        setYAxisColumn(pcaHeaders[2]);
      }
    }
  }, [pcaHeaders, xAxisColumn, yAxisColumn, setPcaColumns, setXAxisColumn, setYAxisColumn]);

  useEffect(() => {
    if (sampleHeaders.length > 0) {
      setSamplesheetColumns(sampleHeaders);

      if (!sampleColumn && sampleHeaders.length > 0) {
        setSampleColumn(getDefaultSampleColumn(sampleHeaders));
      }
      if (!groupColumn && sampleHeaders.length > 1) {
        setGroupColumn(getDefaultGroupColumn(sampleHeaders));
      }
    }
  }, [sampleHeaders, sampleColumn, groupColumn, setSamplesheetColumns, setSampleColumn, setGroupColumn]);

  const downloadFiles: DownloadFileSpec[] = useMemo(
    () => [
      ...(pcaFile?.filename
        ? [
            {
              name: pcaFile.filename,
              url: pcaFile.url || '',
              description: 'PCA results (coordinates)',
              ...(pcaFile.content && { content: pcaFile.content }),
            },
          ]
        : []),
      ...(sampleFile?.filename
        ? [
            {
              name: sampleFile.filename,
              url: sampleFile.url || '',
              description: 'Sample metadata with group assignments',
              ...(sampleFile.content && { content: sampleFile.content }),
            },
          ]
        : []),
    ],
    [pcaFile, sampleFile],
  );

  const metadata = useMemo(
    () => ({
      selectedFiles: downloadFiles.map(f => f.name),
      settings: {
        pca: {
          xAxisColumn,
          yAxisColumn,
        },
        mapping: {
          sampleColumn,
          groupColumn,
        },
      },
      group,
      program,
      project,
    }),
    [downloadFiles, xAxisColumn, yAxisColumn, sampleColumn, groupColumn, group, program, project],
  );

  const handleSeeMoreClick = useCallback(() => {
    setShowSeeMore(true);
  }, []);

  const handleSeeMoreClose = useCallback(() => {
    setShowSeeMore(false);
  }, []);

  return (
    <PCALayout>
      {downloadFiles.length > 0 && (
        <div className='mb-4 flex justify-start'>
          <Button
            onClick={() => setShowDownloadPopup(true)}
            variant='outline'
            size='sm'
            className='flex items-center gap-2'
          >
            <DownloadIcon className='size-4' />
            Download Data
          </Button>
        </div>
      )}

      {!hasPCAFile ? (
        <EmptyState>Kindly add PCA file to view the plot.</EmptyState>
      ) : loading ? (
        <LoadingState>Loading data...</LoadingState>
      ) : (
        <div className='flex min-h-0 flex-1 flex-col'>
          <PCAHeader xAxisColumn={xAxisColumn} yAxisColumn={yAxisColumn} onSeeMoreClick={handleSeeMoreClick} />

          <div className='mb-6 flex items-center justify-center'>
            <GroupLegend groupToColor={groupToColor} sampleDataExists={sampleDataExists} />
          </div>

          <PCAPlot traces={traces} xAxisColumn={xAxisColumn} yAxisColumn={yAxisColumn} />
        </div>
      )}

      <SeeMore
        isOpen={showSeeMore}
        onClose={handleSeeMoreClose}
        axis={{
          enabled: true,
          axisColumns: pcaColumns,
          currentX: xAxisColumn,
          currentY: yAxisColumn,
          onChange: handleAxisChange,
          title: 'Axis Configuration',
        }}
        mapping={{
          availableColumns: samplesheetColumns,
          currentSampleColumn: sampleColumn,
          currentGroupColumn: groupColumn,
          onChange: handleColumnChange,
          title: 'Sample to Group Mapping',
        }}
        download={{
          files: downloadFiles,
          zipName: `PCA-${project}.zip`,
          title: 'Download PCA Data',
          buttonLabel: 'Download Data',
          metadata,
        }}
        hideDownloadButton
        title='PCA Configuration & Data Information'
      />

      <DownloadPopup
        isOpen={showDownloadPopup}
        onClose={() => setShowDownloadPopup(false)}
        files={downloadFiles}
        metadata={metadata}
        zipName={`PCA-${project}.zip`}
      />
    </PCALayout>
  );
}
