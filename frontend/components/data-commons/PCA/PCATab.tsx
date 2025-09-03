import PCA from './PCA';

export function PCATab({
  pcaFile,
  getFileUrl,
  sampleFile,
  group,
  program,
  project,
}: {
  pcaFile: string | null | undefined;
  getFileUrl: (filename: string) => string;
  sampleFile: string | null | undefined;
  group: string;
  program: string;
  project: string;
}) {
  return (
    <PCA
      samplesheetUrl={sampleFile ? getFileUrl(sampleFile) : undefined}
      pcaUrl={pcaFile ? getFileUrl(pcaFile) : undefined}
      group={group}
      program={program}
      project={project}
      pcaFileName={pcaFile ?? undefined}
      sampleFileName={sampleFile ?? undefined}
    />
  );
}
