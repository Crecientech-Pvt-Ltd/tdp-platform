import { useDataFiles } from '@/components/data-commons/upload/hooks/useDataFiles';
import PCA from './PCA';

export function PCATab({ group, program, project }: { group: string; program: string; project: string }) {
  const { pcaFile, sampleFile, loading } = useDataFiles();

  if (loading) {
    return <div className='flex items-center justify-center p-8'>Loading files...</div>;
  }

  return <PCA sampleFile={sampleFile} pcaFile={pcaFile} group={group} program={program} project={project} />;
}
