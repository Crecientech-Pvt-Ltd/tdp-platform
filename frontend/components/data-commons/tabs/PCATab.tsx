import PCA from '@/components/data-commons/PCA';

export function PCATab({
  pcaFile,
  getFileUrl,
  sampleFile,
}: {
  pcaFile: string | null | undefined;
  getFileUrl: (filename: string) => string;
  sampleFile: string | null | undefined;
}) {
  return (
    <PCA
      samplesheetUrl={sampleFile ? getFileUrl(sampleFile) : undefined}
      pcaUrl={pcaFile ? getFileUrl(pcaFile) : undefined}
    />
  );
}
