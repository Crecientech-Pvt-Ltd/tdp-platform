import TranscriptExpression from '@/components/data-commons/TranscriptExpression/TranscriptExpression';

export function TranscriptTab({
  geneFile,
  transcriptFile,
  getFileUrl,
  sampleFile,
  group,
  program,
  project,
}: {
  geneFile: string | null | undefined;
  transcriptFile: string | null | undefined;
  getFileUrl: (filename: string) => string;
  sampleFile: string | null | undefined;
  group: string;
  program: string;
  project: string;
}) {
  return (
    <TranscriptExpression
      samplesheetUrl={sampleFile ? getFileUrl(sampleFile) : undefined}
      geneCountsUrl={geneFile ? getFileUrl(geneFile) : undefined}
      transcriptCountsUrl={transcriptFile ? getFileUrl(transcriptFile) : undefined}
      group={group}
      program={program}
      project={project}
      geneFileName={geneFile? geneFile: undefined} 
  transcriptFileName={transcriptFile? transcriptFile : undefined}
  sampleFileName={sampleFile? sampleFile : undefined}
    />
  );
}
