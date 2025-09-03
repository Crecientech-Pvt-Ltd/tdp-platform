'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const VolcanoPlot = dynamic(() => import('@/components/data-commons/DifferentialExpression/VolcanoPlot'), { ssr: false });

export function DETab({
  deFilesArray,
  getFileUrl,
  group,
  program,
  project,
}: {
  deFilesArray: string[] | undefined;
  getFileUrl: (filename: string) => string;
  group: string;
  program: string;
  project: string;
}) {
  const [deFiles, setDeFiles] = useState<Record<string, string> | undefined>(undefined);

  useEffect(() => {
    if (!deFilesArray) {
      setDeFiles(undefined);
      return;
    }

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
            setDeFiles(result);
          }
        });
    });
  }, [deFilesArray, getFileUrl]);

  return <VolcanoPlot deFiles={deFiles} group={group} program={program} project={project} />;
}
