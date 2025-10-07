import { indexedDBManager } from './indexedDB';

export interface UploadedFileData {
  id: string;
  filename: string;
  content: string;
  type: string;
}

export const getUploadedFile = async (fileId: string): Promise<UploadedFileData | null> => {
  try {
    const file = await indexedDBManager.getFile(fileId);
    return file;
  } catch (error) {
    console.error('Error retrieving uploaded file:', error);
    return null;
  }
};

export const parseFileContent = (content: string): { headers: string[]; data: string[][] } => {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], data: [] };

  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';

  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));

  const data = lines.slice(1).map(line => line.split(delimiter).map(cell => cell.trim().replace(/"/g, '')));

  return { headers, data };
};

export const isUploadMode = (searchParams: URLSearchParams): boolean => {
  return searchParams.get('uploadMode') === 'true';
};

export const getUploadedFileIds = (searchParams: URLSearchParams) => {
  return {
    geneFileId: searchParams.get('geneFileId') || '',
    transcriptFileId: searchParams.get('transcriptFileId') || '',
    pcaFileId: searchParams.get('pcaFileId') || '',
    deFileIds:
      searchParams
        .get('deFileIds')
        ?.split(',')
        .filter(id => id) || [],
    sampleFileId: searchParams.get('sampleFileId') || '',
  };
};
