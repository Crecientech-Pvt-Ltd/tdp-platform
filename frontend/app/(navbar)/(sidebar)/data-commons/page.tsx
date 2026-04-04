'use client';
import { InfoIcon, LockKeyholeIcon } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { buildDataCommonsApiUrl } from '@/components/data-commons/common/api';
import FileUploadPopup from '@/components/data-commons/common/FileUploadPopup';
import PasswordPopup from '@/components/data-commons/common/PasswordPopup';
import FileSelectionPopup from '@/components/data-commons/common/PopUp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
const DEFAULT_DATA_FOLDER_PATH = process.env.NEXT_PUBLIC_DATA_COMMONS_DEFAULT_FOLDER_PATH?.trim() || '/data1';

type Project = {
  name: string;
  hasData: boolean;
  files: string[];
};

type Program = {
  name: string;
  projects: Project[];
};

type Group = {
  name: string;
  programs: Program[];
};

const WINDOWS_ABSOLUTE_PATH_REGEX = /^[A-Za-z]:[\\/]/;

const normalizeDataFolderPath = (value: string) => value.trim().replace(/\\/g, '/');

const getDataFolderPathError = (value: string) => {
  const normalizedValue = normalizeDataFolderPath(value);

  if (!normalizedValue) {
    return null;
  }

  if (WINDOWS_ABSOLUTE_PATH_REGEX.test(normalizedValue)) {
    return 'Enter a mounted-root path like /data1, not a local Windows path.';
  }

  if (normalizedValue.includes('\0')) {
    return 'The path contains invalid characters.';
  }

  const normalizedSubPath = normalizedValue.replace(/^\/+/, '');
  const pathSegments = normalizedSubPath.split('/').filter(Boolean);

  if (pathSegments.some(segment => segment === '.' || segment === '..')) {
    return 'Use a folder path under the mounted root without "." or ".." segments.';
  }

  if (pathSegments.some(segment => /[<>:"|?*]/.test(segment))) {
    return 'The path contains unsupported characters.';
  }

  return null;
};

const getErrorMessageFromResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as { message?: string | string[] };

    if (Array.isArray(payload.message)) {
      return payload.message.join(' ');
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
  }

  const text = await response.text();
  return text.trim() || 'Unable to load data commons structure';
};

export default function DataCommonsPage() {
  const [structure, setStructure] = React.useState<Group[]>([]);
  const [structureLoading, setStructureLoading] = React.useState<boolean>(true);
  const [dataFolderPath, setDataFolderPath] = React.useState<string>(DEFAULT_DATA_FOLDER_PATH);
  const [activeDataCommonsPath, setActiveDataCommonsPath] = React.useState<string>('');
  const [structureError, setStructureError] = React.useState<string>('');
  const [selectedGroup, setSelectedGroup] = React.useState<string>('');
  const [selectedProgram, setSelectedProgram] = React.useState<string>('');
  const [selectedProject, setSelectedProject] = React.useState<string>('');
  const [descriptionFiles, setDescriptionFiles] = React.useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [showFileSelectionPopup, setShowFileSelectionPopup] = React.useState<boolean>(false);
  const [showFileUploadPopup, setShowFileUploadPopup] = React.useState<boolean>(false);
  const [imageLoading, setImageLoading] = React.useState<boolean>(false);
  const [showPasswordPopup, setShowPasswordPopup] = React.useState<boolean>(false);

  const loadStructure = React.useCallback(async (dataCommonsPath?: string) => {
    const normalizedInputPath = normalizeDataFolderPath(dataCommonsPath ?? '');
    const effectiveDataFolderPath = normalizedInputPath || DEFAULT_DATA_FOLDER_PATH;
    const pathValidationError = getDataFolderPathError(effectiveDataFolderPath);

    setStructureLoading(true);
    setStructureError('');

    if (pathValidationError) {
      setStructure([]);
      setStructureError(pathValidationError);
      setStructureLoading(false);
      return;
    }

    try {
      const response = await fetch(
        buildDataCommonsApiUrl(API_BASE, '/data-commons/structure', effectiveDataFolderPath),
      );

      if (!response.ok) {
        setStructure([]);
        setStructureError(await getErrorMessageFromResponse(response));
        return;
      }

      const data = (await response.json()) as Group[];
      setStructure(data);
      setActiveDataCommonsPath(effectiveDataFolderPath);
      setDataFolderPath(effectiveDataFolderPath);
    } catch (error) {
      setStructure([]);
      setStructureError(
        error instanceof Error ? error.message : 'Unable to load folders from that mounted-root data path.',
      );
    } finally {
      setStructureLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadStructure(DEFAULT_DATA_FOLDER_PATH);
  }, [loadStructure]);

  const groupObj = structure.find(g => g.name === selectedGroup);
  const programs = groupObj?.programs.filter(p => p.projects.some(prj => prj.hasData && prj.files.length > 0)) || [];

  const programObj = programs.find(p => p.name === selectedProgram);
  const projects = programObj?.projects.filter(prj => prj.hasData && prj.files.length > 0) || [];

  React.useEffect(() => {
    if (selectedGroup && selectedProgram && selectedProject) {
      setLoading(true);
      setImageLoading(true);
      fetch(
        buildDataCommonsApiUrl(
          API_BASE,
          `/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/description`,
          activeDataCommonsPath,
        ),
      )
        .then(res => {
          if (!res.ok) throw new Error('No description files');
          return res.json();
        })
        .then((result: Record<string, string>) => {
          const files = Object.values(result);
          setDescriptionFiles(files);
          setCurrentIndex(0);
        })
        .catch(() => {
          setDescriptionFiles([]);
          setImageLoading(false);
        })
        .finally(() => setLoading(false));
    } else {
      setDescriptionFiles([]);
      setImageLoading(false);
    }
  }, [activeDataCommonsPath, selectedGroup, selectedProgram, selectedProject]);

  React.useEffect(() => {
    if (descriptionFiles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(idx => (idx + 1) % descriptionFiles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [descriptionFiles]);

  const handlePrev = () => {
    setCurrentIndex(idx => (idx - 1 + descriptionFiles.length) % descriptionFiles.length);
  };

  const handleNext = () => {
    setCurrentIndex(idx => (idx + 1) % descriptionFiles.length);
  };

  const handleGoToPlots = async () => {
    if (selectedGroup && selectedProgram && selectedProject) {
      try {
        const response = await fetch(
          buildDataCommonsApiUrl(
            API_BASE,
            `/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/verify-auth`,
            activeDataCommonsPath,
          ),
          { method: 'GET', credentials: 'include' },
        );
        if (!response.ok) {
          // console.error('Password check failed:', response.status);
          setShowPasswordPopup(true);
          return;
        }
        const result = await response.json();
        if (result.success) {
          setShowFileSelectionPopup(true);
          return;
        } else if (result.hasPassword) {
          setShowPasswordPopup(true);
          return;
        }
      } catch (error) {
        console.error('Password check error:', error);
        setShowFileSelectionPopup(false);
      }
    }
  };

  const handlePasswordSuccess = () => {
    setShowPasswordPopup(false);
    setShowFileSelectionPopup(true);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageLoadStart = () => {
    setImageLoading(true);
  };

  const getImageUrl = (filename: string) =>
    buildDataCommonsApiUrl(
      API_BASE,
      `/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/files/${encodeURIComponent(filename)}`,
      activeDataCommonsPath,
    );

  const groupId = React.useId();
  const programId = React.useId();
  const projectId = React.useId();
  const serverFolderId = React.useId();

  return (
    <div
      className='w-full rounded-lg border shadow-md'
      style={{ height: '85vh', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <h2
        style={{
          background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
        }}
        className='mb-6 shrink-0 rounded-t-lg px-6 py-2 font-semibold text-2xl text-white'
      >
        A Centralized Data Commons of Multi-Omics Data for Exploratory Research
      </h2>

      <div className='shrink-0'>
        <form className='px-8 pb-4'>
          <div className='mb-4'>
            <div className='flex items-center gap-2'>
              <Label htmlFor={serverFolderId}>Data Folder Under Mounted Root</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    className='inline-flex items-center text-muted-foreground transition-colors hover:text-foreground'
                    aria-label='Information about the data folder structure'
                  >
                    <InfoIcon size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='right' align='start' className='max-w-80 text-white'>
                  <div>
                    Specify the mounted root path where the Data Commons directory is available to the application.
                    <br />
                    This location should expose the expected hierarchy for groups, programs, and projects.
                    <br />
                    Use a mounted server path rather than a local machine path.
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className='mt-1 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center'>
              <Input
                id={serverFolderId}
                value={dataFolderPath}
                onChange={e => setDataFolderPath(e.target.value)}
                placeholder='Enter the mounted Data Commons root path'
              />
              <Button
                type='button'
                variant='outline'
                className='w-full md:w-auto'
                disabled={structureLoading}
                onClick={() => {
                  setSelectedGroup('');
                  setSelectedProgram('');
                  setSelectedProject('');
                  setDescriptionFiles([]);
                  setCurrentIndex(0);
                  loadStructure(dataFolderPath);
                }}
              >
                {structureLoading ? 'Loading...' : 'Load Folder'}
              </Button>
            </div>
            {structureError ? <p className='mt-1 text-destructive text-xs'>{structureError}</p> : null}
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div>
              <Label htmlFor={groupId}>Select Group</Label>
              <Select
                value={selectedGroup}
                onValueChange={val => {
                  setSelectedGroup(val);
                  setSelectedProgram('');
                  setSelectedProject('');
                }}
                disabled={structureLoading}
              >
                <SelectTrigger id={groupId}>
                  <SelectValue placeholder={structureLoading ? 'Loading groups...' : 'Select group'} />
                </SelectTrigger>
                <SelectContent>
                  {structureLoading ? (
                    <div className='flex items-center justify-center py-4'>
                      <Spinner />
                      <span className='ml-2 text-gray-500 text-sm'>Loading groups...</span>
                    </div>
                  ) : (
                    structure
                      .filter(g => g.programs.some(p => p.projects.some(prj => prj.hasData && prj.files.length > 0)))
                      .map(group => (
                        <SelectItem key={group.name} value={group.name}>
                          {group.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={programId}>Select Program</Label>
              <Select
                value={selectedProgram}
                onValueChange={val => {
                  setSelectedProgram(val);
                  setSelectedProject('');
                }}
                disabled={structureLoading || !selectedGroup}
              >
                <SelectTrigger id={programId}>
                  <SelectValue placeholder={structureLoading ? 'Loading...' : 'Select program'} />
                </SelectTrigger>
                <SelectContent>
                  {structureLoading ? (
                    <div className='flex items-center justify-center py-4'>
                      <Spinner />
                      <span className='ml-2 text-gray-500 text-sm'>Loading...</span>
                    </div>
                  ) : programs.length === 0 ? (
                    <div className='py-4 text-center text-gray-500 text-sm'>
                      {selectedGroup ? 'No programs available' : 'Select a group first'}
                    </div>
                  ) : (
                    programs.map(program => (
                      <SelectItem key={program.name} value={program.name}>
                        {program.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={projectId}>Select Project</Label>
              <Select
                value={selectedProject}
                onValueChange={val => {
                  setSelectedProject(val);
                }}
                disabled={structureLoading || !selectedProgram}
              >
                <SelectTrigger id={projectId}>
                  <SelectValue placeholder={structureLoading ? 'Loading...' : 'Select project'} />
                </SelectTrigger>
                <SelectContent>
                  {structureLoading ? (
                    <div className='flex items-center justify-center py-4'>
                      <Spinner />
                      <span className='ml-2 text-gray-500 text-sm'>Loading...</span>
                    </div>
                  ) : projects.length === 0 ? (
                    <div className='py-4 text-center text-gray-500 text-sm'>
                      {selectedProgram ? 'No projects available' : 'Select a program first'}
                    </div>
                  ) : (
                    projects.map(project => (
                      <SelectItem key={project.name} value={project.name}>
                        <div className='flex gap-2'>
                          {project.files.find(f => f === 'password.txt') ? (
                            <LockKeyholeIcon className='size-4' />
                          ) : null}{' '}
                          {project.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        {selectedGroup && selectedProgram && selectedProject && (
          <div className='space-y-2 px-8 pb-4'>
            <Button
              type='button'
              className='w-full'
              style={{
                background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
              }}
              onClick={handleGoToPlots}
            >
              Go to Plots
            </Button>
            <div className='text-center text-muted-foreground text-sm'>or</div>
            <Button type='button' variant='outline' className='w-full' onClick={() => setShowFileUploadPopup(true)}>
              Upload Your Own Files
            </Button>
          </div>
        )}

        {/* Show upload option even when no project is selected */}
        {(!selectedGroup || !selectedProgram || !selectedProject) && (
          <div className='px-8 pb-4'>
            <Button type='button' variant='outline' className='w-full' onClick={() => setShowFileUploadPopup(true)}>
              Upload Your Own Files
            </Button>
          </div>
        )}
      </div>

      <div className='min-h-0 flex-1 px-8 pb-8'>
        <div
          className='mt-2 flex h-full flex-col items-center justify-center'
          style={{
            maxWidth: '100%',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {(loading || imageLoading) && (
              <div className='absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80'>
                <Spinner />
                <p className='mt-4 text-gray-500'>{loading ? 'Loading project description...' : 'Loading image...'}</p>
              </div>
            )}

            {(!selectedGroup || descriptionFiles.length === 0) && (
              <Image
                src='/image/alxn-data-commons.jpeg'
                alt='Default Data Commons'
                fill
                style={{ objectFit: 'contain' }}
                sizes='100vw'
                priority
                onLoad={handleImageLoad}
                onLoadStart={handleImageLoadStart}
              />
            )}

            {descriptionFiles.length > 0 && (
              <>
                <Image
                  src={getImageUrl(descriptionFiles[currentIndex]) || '/placeholder.svg'}
                  alt='Project Description'
                  fill
                  style={{ objectFit: 'contain' }}
                  sizes='100vw'
                  priority
                  onLoad={handleImageLoad}
                  onLoadStart={handleImageLoadStart}
                />
                {descriptionFiles.length > 1 && (
                  <>
                    <button
                      type='button'
                      aria-label='Previous'
                      onClick={handlePrev}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.4)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 36,
                        height: 36,
                        cursor: 'pointer',
                        zIndex: 2,
                      }}
                    >
                      &#8592;
                    </button>
                    <button
                      type='button'
                      aria-label='Next'
                      onClick={handleNext}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.4)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 36,
                        height: 36,
                        cursor: 'pointer',
                        zIndex: 2,
                      }}
                    >
                      &#8594;
                    </button>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 8,
                      }}
                    >
                      {descriptionFiles.map((a, idx) => (
                        <button
                          key={a}
                          type='button'
                          aria-label={`Go to slide ${idx + 1}`}
                          style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: idx === currentIndex ? '#1976d2' : '#bbb',
                            cursor: 'pointer',
                            border: 'none',
                          }}
                          onClick={() => setCurrentIndex(idx)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <FileSelectionPopup
        isOpen={showFileSelectionPopup}
        onClose={() => setShowFileSelectionPopup(false)}
        selectedGroup={selectedGroup}
        selectedProgram={selectedProgram}
        selectedProject={selectedProject}
        dataCommonsPath={activeDataCommonsPath}
      />
      <FileUploadPopup isOpen={showFileUploadPopup} onClose={() => setShowFileUploadPopup(false)} />
      <PasswordPopup
        isOpen={showPasswordPopup}
        onClose={() => setShowPasswordPopup(false)}
        onSuccess={handlePasswordSuccess}
        selectedGroup={selectedGroup}
        selectedProgram={selectedProgram}
        selectedProject={selectedProject}
        dataCommonsPath={activeDataCommonsPath}
      />
    </div>
  );
}
