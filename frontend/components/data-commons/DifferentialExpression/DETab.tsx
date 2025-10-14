'use client';

import { useEffect, useState } from 'react';
import VolcanoPlot from '@/components/data-commons/DifferentialExpression/DE';
import { useDataFiles } from '@/components/data-commons/upload/hooks/useDataFiles';

export function DETab({
  deFilesArray,
  getFileUrl,
  group,
  program,
  project,
}: {
  deFilesArray?: string[];
  getFileUrl?: (filename: string) => string;
  group: string;
  program: string;
  project: string;
}) {
  const [serverDeFiles, setServerDeFiles] = useState<Record<string, string> | undefined>(undefined);
  const [serverLoading, setServerLoading] = useState(false);

  const { deFiles: uploadedFiles, loading: uploadLoading, isUploadMode } = useDataFiles();

  useEffect(() => {
    if (isUploadMode || !deFilesArray || !getFileUrl) {
      setServerDeFiles(undefined);
      setServerLoading(false);
      return;
    }

    setServerLoading(true);
    const result: Record<string, string> = {};
    let completed = 0;

    deFilesArray.forEach(defilename => {
      fetch(getFileUrl(defilename))
        .then(res => res.json())
        .then(fileObj => {
          Object.assign(result, fileObj);
        })
        .catch(err => {
          console.error(`Error fetching ${defilename}`, err);
        })
        .finally(() => {
          completed++;
          if (completed === deFilesArray.length) {
            setServerDeFiles(Object.keys(result).length > 0 ? result : undefined);
            setServerLoading(false);
          }
        });
    });
  }, [deFilesArray, getFileUrl, isUploadMode]);

  const uploadedDeFiles =
    uploadedFiles && uploadedFiles.length > 0
      ? uploadedFiles.reduce(
          (acc, file, index) => {
            if (file && (file.content || file.url)) {
              const filename = file.filename || `differential_expression_${index + 1}.csv`;
              acc[filename] = file.content || '';
            }
            return acc;
          },
          {} as Record<string, string>,
        )
      : undefined;

  const deFiles = isUploadMode ? uploadedDeFiles : serverDeFiles;
  const loading = isUploadMode ? uploadLoading : serverLoading;

  return <VolcanoPlot deFiles={deFiles} group={group} program={program} project={project} loading={loading} />;
}
