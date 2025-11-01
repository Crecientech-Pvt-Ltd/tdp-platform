'use client';

import { useEffect, useState } from 'react';
import VolcanoPlot from '@/components/data-commons/DifferentialExpression/DE';
import { useDataFiles } from '@/components/data-commons/upload/hooks/useDataFiles';

export function DETab({
  deGeneFilesArray,
  deTranscriptFilesArray,
  getFileUrl,
  group,
  program,
  project,
}: {
  deGeneFilesArray?: string[];
  deTranscriptFilesArray?: string[];
  getFileUrl?: (filename: string) => string;
  group: string;
  program: string;
  project: string;
}) {
  const {
    deGeneFiles: uploadedGeneFiles,
    deTranscriptFiles: uploadedTranscriptFiles,
    loading: uploadLoading,
    isUploadMode,
  } = useDataFiles();

  const [geneFilesContent, setGeneFilesContent] = useState<Record<string, string> | undefined>(undefined);
  const [transcriptFilesContent, setTranscriptFilesContent] = useState<Record<string, string> | undefined>(undefined);
  const [serverLoading, setServerLoading] = useState(false);

  useEffect(() => {
    if (isUploadMode || !deGeneFilesArray || !getFileUrl || deGeneFilesArray.length === 0) {
      setGeneFilesContent(undefined);
      return;
    }

    setServerLoading(true);
    const result: Record<string, string> = {};
    let completed = 0;

    deGeneFilesArray.forEach(filename => {
      fetch(getFileUrl(filename))
        .then(res => {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            return res.json();
          }
          return res.text().then(text => ({ [filename]: text }));
        })
        .then(fileObj => {
          Object.assign(result, fileObj);
        })
        .catch(err => {
          console.error(`Error fetching ${filename}`, err);
        })
        .finally(() => {
          completed++;
          if (completed === deGeneFilesArray.length) {
            setGeneFilesContent(result);
            setServerLoading(false);
          }
        });
    });
  }, [deGeneFilesArray, getFileUrl, isUploadMode]);

  useEffect(() => {
    if (isUploadMode || !deTranscriptFilesArray || !getFileUrl || deTranscriptFilesArray.length === 0) {
      setTranscriptFilesContent(undefined);
      return;
    }

    setServerLoading(true);
    const result: Record<string, string> = {};
    let completed = 0;

    deTranscriptFilesArray.forEach(filename => {
      fetch(getFileUrl(filename))
        .then(res => {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            return res.json();
          }
          return res.text().then(text => ({ [filename]: text }));
        })
        .then(fileObj => {
          Object.assign(result, fileObj);
        })
        .catch(err => {
          console.error(`Error fetching ${filename}`, err);
        })
        .finally(() => {
          completed++;
          if (completed === deTranscriptFilesArray.length) {
            setTranscriptFilesContent(result);
            setServerLoading(false);
          }
        });
    });
  }, [deTranscriptFilesArray, getFileUrl, isUploadMode]);

  const uploadedGeneContent =
    isUploadMode && uploadedGeneFiles && uploadedGeneFiles.length > 0
      ? uploadedGeneFiles.reduce(
          (acc, file, index) => {
            if (file && (file.content || file.url)) {
              const filename = file.filename || `gene_differential_expression_${index + 1}.csv`;
              acc[filename] = file.content || '';
            }
            return acc;
          },
          {} as Record<string, string>,
        )
      : {};

  const uploadedTranscriptContent =
    isUploadMode && uploadedTranscriptFiles && uploadedTranscriptFiles.length > 0
      ? uploadedTranscriptFiles.reduce(
          (acc, file, index) => {
            if (file && (file.content || file.url)) {
              const filename = file.filename || `transcript_differential_expression_${index + 1}.csv`;
              acc[filename] = file.content || '';
            }
            return acc;
          },
          {} as Record<string, string>,
        )
      : {};

  const GeneContent = isUploadMode ? uploadedGeneContent : geneFilesContent;
  const TranscriptContent = isUploadMode ? uploadedTranscriptContent : transcriptFilesContent;
  const loading = isUploadMode ? uploadLoading : serverLoading;

  return (
    <VolcanoPlot
      deGeneFilesContent={GeneContent}
      deTranscriptFilesContent={TranscriptContent}
      group={group}
      program={program}
      project={project}
      loading={loading}
    />
  );
}
