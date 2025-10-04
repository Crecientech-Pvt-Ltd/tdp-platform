import TranscriptExpression from '@/components/data-commons/TranscriptExpression/TranscriptExpression';
import { useDataFiles } from '@/components/data-commons/upload/hooks/useDataFiles';

export function TranscriptTab({
  group,
  program,
  project,
}: {
  group: string;
  program: string;
  project: string;
}) {
  const { geneFile, transcriptFile, sampleFile, loading } = useDataFiles();

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading files...</div>;
  }

  return (
    <TranscriptExpression
      sampleFile={sampleFile}
      geneFile={geneFile}
      transcriptFile={transcriptFile}
      group={group}
      program={program}
      project={project}
    />
  );
}
