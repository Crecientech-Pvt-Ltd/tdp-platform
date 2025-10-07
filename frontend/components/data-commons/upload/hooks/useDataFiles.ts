import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { indexedDBManager } from '@/components/data-commons/upload/utils/indexedDB';

export interface FileSource {
  url?: string;
  content?: string;
  filename?: string;
}

export interface UseDataFilesReturn {
  geneFile: FileSource | null;
  transcriptFile: FileSource | null;
  pcaFile: FileSource | null;
  sampleFile: FileSource | null;
  deFiles: FileSource[];
  isUploadMode: boolean;
  loading: boolean;
}

export const useDataFiles = (): UseDataFilesReturn => {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<{
    geneFile: FileSource | null;
    transcriptFile: FileSource | null;
    pcaFile: FileSource | null;
    sampleFile: FileSource | null;
    deFiles: FileSource[];
  }>({
    geneFile: null,
    transcriptFile: null,
    pcaFile: null,
    sampleFile: null,
    deFiles: [],
  });

  const isUploadMode = searchParams?.get('uploadMode') === 'true';
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const group = searchParams?.get('group');
  const program = searchParams?.get('program');
  const project = searchParams?.get('project');
  const geneFileName = searchParams?.get('geneFile');
  const transcriptFileName = searchParams?.get('transcriptFile');
  const pcaFileName = searchParams?.get('pcaFile');
  const sampleFileName = searchParams?.get('sampleFile');
  const deFilesParam = searchParams?.get('deFiles');

  const geneFileId = searchParams?.get('geneFileId');
  const transcriptFileId = searchParams?.get('transcriptFileId');
  const pcaFileId = searchParams?.get('pcaFileId');
  const sampleFileId = searchParams?.get('sampleFileId');
  const deFileIds = useMemo(
    () =>
      searchParams
        ?.get('deFileIds')
        ?.split(',')
        .filter(id => id) || [],
    [searchParams],
  );

  const getServerFileUrl = useMemo(
    () => (filename: string) =>
      `${API_BASE}/data-commons/project/${encodeURIComponent(group ?? '')}/${encodeURIComponent(program ?? '')}/${encodeURIComponent(project ?? '')}/files/${encodeURIComponent(filename)}`,
    [API_BASE, group, program, project],
  );

  const loadUploadedFile = async (fileId: string): Promise<FileSource | null> => {
    if (!fileId) return null;

    try {
      await indexedDBManager.init();
      const file = await indexedDBManager.getFile(fileId);

      return file
        ? {
            content: file.content,
            filename: file.filename,
          }
        : null;
    } catch (error) {
      console.error('Error loading uploaded file:', fileId, error);
      return null;
    }
  };

  const deFileIdsString = deFileIds.join(',');

  useEffect(() => {
    const loadFiles = async () => {
      setLoading(true);

      if (isUploadMode) {
        const [gene, transcript, pca, sample, ...deFilesResults] = await Promise.all([
          loadUploadedFile(geneFileId || ''),
          loadUploadedFile(transcriptFileId || ''),
          loadUploadedFile(pcaFileId || ''),
          loadUploadedFile(sampleFileId || ''),
          ...deFileIds.map(id => loadUploadedFile(id)),
        ]);

        setFiles({
          geneFile: gene,
          transcriptFile: transcript,
          pcaFile: pca,
          sampleFile: sample,
          deFiles: deFilesResults.filter((file): file is FileSource => file !== null),
        });
      } else {
        const deFilesArray = deFilesParam?.split(',').filter(f => f) || [];

        setFiles({
          geneFile: geneFileName ? { url: getServerFileUrl(geneFileName), filename: geneFileName } : null,
          transcriptFile: transcriptFileName
            ? { url: getServerFileUrl(transcriptFileName), filename: transcriptFileName }
            : null,
          pcaFile: pcaFileName ? { url: getServerFileUrl(pcaFileName), filename: pcaFileName } : null,
          sampleFile: sampleFileName ? { url: getServerFileUrl(sampleFileName), filename: sampleFileName } : null,
          deFiles: deFilesArray.map(filename => ({ url: getServerFileUrl(filename), filename })),
        });
      }

      setLoading(false);
    };

    loadFiles();
  }, [
    isUploadMode,
    geneFileId,
    transcriptFileId,
    pcaFileId,
    sampleFileId,
    deFileIds,
    deFileIdsString,
    geneFileName,
    transcriptFileName,
    pcaFileName,
    sampleFileName,
    deFilesParam,
    getServerFileUrl,
    group,
    program,
    project,
    searchParams,
  ]);

  return {
    ...files,
    isUploadMode,
    loading,
  };
};
