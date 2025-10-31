'use client';

import { useMemo, useState } from 'react';
import SeeMore from '@/components/data-commons/common/SeeMore';
import type { FileSource } from '@/components/data-commons/upload/hooks/useDataFiles';
import {
  useDataFiles,
  useDataSource,
  useGeneDataMap,
  useGeneSelection,
  useParsedData,
  useSampleMapping,
  useViewportHeight,
} from './hooks';
import { PlotLayout } from './plots';
import { Controls, EmptyState, LoadingState, NoSelectionState } from './ui';
import { createDownloadFiles, createMetadata } from './utils';

interface TranscriptExpressionProps {
  sampleFile: FileSource | null;
  geneFile: FileSource | null;
  transcriptFile: FileSource | null;
  group?: string;
  program?: string;
  project?: string;
}

export default function TranscriptExpression({
  sampleFile,
  geneFile,
  transcriptFile,
  group,
  program,
  project,
}: TranscriptExpressionProps) {
  const [showSeeMore, setShowSeeMore] = useState(false);

  const viewportHeight = useViewportHeight();

  const { sampleData, geneData, transcriptData, loading, hasGene, hasTranscript } = useDataFiles(
    sampleFile,
    geneFile,
    transcriptFile,
  );

  const { dataSource, setDataSource } = useDataSource(hasGene, hasTranscript);

  const {
    availableSampleColumns,
    sampleColumn,
    groupColumn,
    sampleToGroup,
    groupToColor,
    sampleDataExists,
    mappingChange,
  } = useSampleMapping(sampleData);

  const { parsedGeneData, parsedTranscriptData } = useParsedData(geneData, transcriptData);

  const { geneList, selectedGenes, handleGeneSelection } = useGeneSelection(
    dataSource,
    parsedGeneData,
    parsedTranscriptData,
  );

  const { geneDataMap, getBarColors } = useGeneDataMap(
    selectedGenes,
    parsedGeneData,
    parsedTranscriptData,
    dataSource,
    sampleToGroup,
    groupToColor,
    sampleDataExists,
  );

  const selectedGenesArray = useMemo(() => Array.from(selectedGenes).sort(), [selectedGenes]);

  const downloadFiles = useMemo(
    () => createDownloadFiles(geneFile, transcriptFile, sampleFile),
    [geneFile, transcriptFile, sampleFile],
  );

  const metadata = useMemo(
    () => createMetadata(downloadFiles, sampleColumn, groupColumn, group, program, project),
    [downloadFiles, sampleColumn, groupColumn, group, program, project],
  );

  const handleDataSourceChange = (checked: boolean) => {
    setDataSource(checked ? 'transcript' : 'gene');
  };

  if (!hasGene && !hasTranscript) {
    return (
      <div className='mx-auto w-full max-w-[95vw] px-4 sm:px-6 lg:max-w-[1500px] lg:px-8'>
        <EmptyState>Kindly add CPM/TPM metric files to view plots.</EmptyState>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='mx-auto w-full max-w-[95vw] px-4 sm:px-6 lg:max-w-[1500px] lg:px-8'>
        <LoadingState>Loading data...</LoadingState>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-[95vw] px-4 sm:px-6 lg:max-w-[1500px] lg:px-8'>
      <Controls
        hasGene={hasGene}
        hasTranscript={hasTranscript}
        dataSource={dataSource}
        onDataSourceChange={handleDataSourceChange}
        geneList={geneList}
        selectedGenes={selectedGenes}
        onGeneSelection={handleGeneSelection}
        onShowSeeMore={() => setShowSeeMore(true)}
        isLoading={loading}
        groupToColor={groupToColor}
        sampleDataExists={sampleDataExists}
      />

      <PlotLayout
        geneDataMap={geneDataMap}
        selectedGenesArray={selectedGenesArray}
        dataSource={dataSource}
        getBarColors={getBarColors}
        viewportHeight={viewportHeight}
      />

      {selectedGenesArray.length === 0 && !loading && <NoSelectionState dataSource={dataSource} isLoading={loading} />}

      <SeeMore
        isOpen={showSeeMore}
        onClose={() => setShowSeeMore(false)}
        mapping={{
          availableColumns: availableSampleColumns,
          currentSampleColumn: sampleColumn,
          currentGroupColumn: groupColumn,
          onChange: mappingChange,
          title: 'Sample to Group Mapping',
          sampleHelpText: 'Column containing sample identifiers. Default: First column',
          groupHelpText: 'Column containing group assignments. Default: Last column',
        }}
        download={{
          files: downloadFiles,
          zipName: `TE-${project || 'data'}.zip`,
          title: 'Download Expression Data',
          buttonLabel: 'Download Data',
          metadata,
        }}
        title='Transcript Expression – Configuration & Data'
      />
    </div>
  );
}
