import { indexedDBManager } from './indexedDB';

export interface FileUploadUtils {
  validateFileType: (file: File) => boolean;
  readFileAsText: (file: File) => Promise<string>;
  storeFile: (filename: string, content: string, type: string) => Promise<string>;
  truncateFilename: (filename: string, maxLength?: number) => string;
}

const VALID_EXTENSIONS = ['.csv', '.tsv', '.txt'];

export const fileUploadUtils: FileUploadUtils = {
  validateFileType: (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return VALID_EXTENSIONS.includes(extension);
  },

  readFileAsText: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  },

  storeFile: async (filename: string, content: string, type: string): Promise<string> => {
    return await indexedDBManager.storeFile(filename, content, type);
  },

  truncateFilename: (filename: string, maxLength = 50): string => {
    if (filename.length <= maxLength) return filename;
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4) + '...';
    return `${truncatedName}.${extension}`;
  }
};

export const createUploadParams = (selections: {
  gene: { id: string } | null;
  transcript: { id: string } | null;
  pca: { id: string } | null;
  differentialexpression: { id: string }[];
  samplesheet: { id: string } | null;
}): URLSearchParams => {
  return new URLSearchParams({
    uploadMode: 'true',
    geneFileId: selections.gene?.id || '',
    transcriptFileId: selections.transcript?.id || '',
    pcaFileId: selections.pca?.id || '',
    deFileIds: selections.differentialexpression.map(f => f.id).join(','),
    sampleFileId: selections.samplesheet?.id || '',
  });
};