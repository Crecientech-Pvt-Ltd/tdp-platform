import TranscriptExpression from '@/components/data-commons/TranscriptExpression';

export function TranscriptTab({
  geneFile,
  transcriptFile,
  getFileUrl,
  sampleFile,
}: {
  geneFile: string | null | undefined;
  transcriptFile: string | null | undefined;
  getFileUrl: (filename: string) => string;
  sampleFile: string | null | undefined;
}) {
  return (
    <TranscriptExpression
      samplesheetUrl={sampleFile ? getFileUrl(sampleFile) : undefined}
      geneCountsUrl={geneFile ? getFileUrl(geneFile) : undefined}
      transcriptCountsUrl={transcriptFile ? getFileUrl(transcriptFile) : undefined}
    />
  );
}
