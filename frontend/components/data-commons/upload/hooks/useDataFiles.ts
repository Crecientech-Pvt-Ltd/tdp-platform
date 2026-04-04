import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { buildDataCommonsApiUrl } from '@/components/data-commons/common/api';
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
  deGeneFiles: FileSource[];
  deTranscriptFiles: FileSource[];
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
    deGeneFiles: FileSource[];
    deTranscriptFiles: FileSource[];
  }>({
    geneFile: null,
    transcriptFile: null,
    pcaFile: null,
    sampleFile: null,
    deGeneFiles: [],
    deTranscriptFiles: [],
  });

  const isUploadMode = searchParams?.get('uploadMode') === 'true';
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

  const group = searchParams?.get('group');
  const program = searchParams?.get('program');
  const project = searchParams?.get('project');
  const dataCommonsPath = searchParams?.get('dataCommonsPath') ?? '';
  const geneFileName = searchParams?.get('geneFile');
  const transcriptFileName = searchParams?.get('transcriptFile');
  const pcaFileName = searchParams?.get('pcaFile');
  const sampleFileName = searchParams?.get('sampleFile');
  const _deFilesParam = searchParams?.get('deFiles');

  const geneFileId = searchParams?.get('geneFileId');
  const transcriptFileId = searchParams?.get('transcriptFileId');
  const pcaFileId = searchParams?.get('pcaFileId');
  const sampleFileId = searchParams?.get('sampleFileId');
  const _deFileIds = useMemo(
    () =>
      searchParams
        ?.get('deFileIds')
        ?.split(',')
        .filter(id => id) || [],
    [searchParams],
  );

  const deGeneFileIds = useMemo(
    () =>
      searchParams
        ?.get('deGeneFileIds')
        ?.split(',')
        .filter(id => id) || [],
    [searchParams],
  );

  const deTranscriptFileIds = useMemo(
    () =>
      searchParams
        ?.get('deTranscriptFileIds')
        ?.split(',')
        .filter(id => id) || [],
    [searchParams],
  );

  const getServerFileUrl = useMemo(
    () => (filename: string) =>
      buildDataCommonsApiUrl(
        API_BASE,
        `/data-commons/project/${encodeURIComponent(group ?? '')}/${encodeURIComponent(program ?? '')}/${encodeURIComponent(project ?? '')}/files/${encodeURIComponent(filename)}`,
        dataCommonsPath,
      ),
    [API_BASE, dataCommonsPath, group, program, project],
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

  const deGeneFileIdsString = deGeneFileIds.join(',');
  const deTranscriptFileIdsString = deTranscriptFileIds.join(',');

  // biome-ignore lint/correctness/useExhaustiveDependencies: not required
  useEffect(() => {
    (async () => {
      setLoading(true);

      if (isUploadMode) {
        const [gene, transcript, pca, sample, ...deGeneResults] = await Promise.all([
          loadUploadedFile(geneFileId || ''),
          loadUploadedFile(transcriptFileId || ''),
          loadUploadedFile(pcaFileId || ''),
          loadUploadedFile(sampleFileId || ''),
          ...deGeneFileIds.map(id => loadUploadedFile(id)),
        ]);

        const deTranscriptResults = await Promise.all(deTranscriptFileIds.map(id => loadUploadedFile(id)));

        setFiles({
          geneFile: gene,
          transcriptFile: transcript,
          pcaFile: pca,
          sampleFile: sample,
          deGeneFiles: deGeneResults.filter((file): file is FileSource => file !== null),
          deTranscriptFiles: deTranscriptResults.filter((file): file is FileSource => file !== null),
        });
      } else {
        const deGeneFilesParam = searchParams?.get('deGeneFiles');
        const deTranscriptFilesParam = searchParams?.get('deTranscriptFiles');

        const deGeneFilesArray = deGeneFilesParam?.split(',').filter(f => f) || [];
        const deTranscriptFilesArray = deTranscriptFilesParam?.split(',').filter(f => f) || [];

        setFiles({
          geneFile: geneFileName ? { url: getServerFileUrl(geneFileName), filename: geneFileName } : null,
          transcriptFile: transcriptFileName
            ? { url: getServerFileUrl(transcriptFileName), filename: transcriptFileName }
            : null,
          pcaFile: pcaFileName ? { url: getServerFileUrl(pcaFileName), filename: pcaFileName } : null,
          sampleFile: sampleFileName ? { url: getServerFileUrl(sampleFileName), filename: sampleFileName } : null,
          deGeneFiles: deGeneFilesArray.map(filename => ({ url: getServerFileUrl(filename), filename })),
          deTranscriptFiles: deTranscriptFilesArray.map(filename => ({ url: getServerFileUrl(filename), filename })),
        });
      }
      setLoading(false);
    })();
  }, [
    isUploadMode,
    geneFileId,
    transcriptFileId,
    pcaFileId,
    sampleFileId,
    deGeneFileIdsString,
    deTranscriptFileIdsString,
    geneFileName,
    transcriptFileName,
    pcaFileName,
    sampleFileName,
    getServerFileUrl,
    group,
    program,
    project,
    searchParams,
  ]);

  const deGeneFiles = useMemo(() => {
    return files.deGeneFiles;
  }, [files]);

  const deTranscriptFiles = useMemo(() => {
    return files.deTranscriptFiles;
  }, [files]);

  return {
    ...files,
    isUploadMode,
    loading,
    deGeneFiles,
    deTranscriptFiles,
  };
};
