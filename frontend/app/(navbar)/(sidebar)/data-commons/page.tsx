'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import FileSelectionPopup from '@/components/data-commons/common/PopUp';
import PasswordPopup from '@/components/data-commons/common/PasswordPopup';
import { Spinner } from '@/components/ui/spinner';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

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

export default function DataCommonsPage() {
  const [structure, setStructure] = React.useState<Group[]>([]);
  const [structureLoading, setStructureLoading] = React.useState<boolean>(true);
  const [selectedGroup, setSelectedGroup] = React.useState<string>('');
  const [selectedProgram, setSelectedProgram] = React.useState<string>('');
  const [selectedProject, setSelectedProject] = React.useState<string>('');
  const [descriptionFiles, setDescriptionFiles] = React.useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [showFileSelectionPopup, setShowFileSelectionPopup] = React.useState<boolean>(false);
  const [showPasswordPopup, setShowPasswordPopup] = React.useState<boolean>(false);
  const [imageLoading, setImageLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    setStructureLoading(true);
    fetch(`${API_BASE}/data-commons/structure`)
      .then(res => res.json())
      .then(data => setStructure(data))
      .catch(() => setStructure([]))
      .finally(() => setStructureLoading(false));
  }, []);

  const groupObj = structure.find(g => g.name === selectedGroup);
  const programs = groupObj?.programs.filter(p => p.projects.some(prj => prj.hasData && prj.files.length > 0)) || [];

  const programObj = programs.find(p => p.name === selectedProgram);
  const projects = programObj?.projects.filter(prj => prj.hasData && prj.files.length > 0) || [];

  React.useEffect(() => {
    if (selectedGroup && selectedProgram && selectedProject) {
      setLoading(true);
      setImageLoading(true);
      fetch(
        `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/description`,
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
  }, [selectedGroup, selectedProgram, selectedProject]);

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
      const authKey = `auth_${selectedGroup}_${selectedProgram}_${selectedProject}`;
      const isAuthenticated = sessionStorage.getItem(authKey) === 'authenticated';
      
      if (isAuthenticated) {
        setShowFileSelectionPopup(true);
        return;
      }
      
      try {
        const response = await fetch(
          `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: '' }),
          },
        );
        
        if (!response.ok) {
          console.error('Password check failed:', response.status);
          setShowFileSelectionPopup(true);
          return;
        }
        
        const result = await response.json();
        console.log('Password check result:', result);
        
        if (result.hasPassword) {
          setShowPasswordPopup(true);
        } else {
          sessionStorage.setItem(authKey, 'authenticated');
          setShowFileSelectionPopup(true);
        }
      } catch (error) {
        console.error('Password check error:', error);
        setShowFileSelectionPopup(true);
      }
    }
  };

  const handlePasswordSuccess = () => {
    setShowPasswordPopup(false);
    
    const authKey = `auth_${selectedGroup}_${selectedProgram}_${selectedProject}`;
    sessionStorage.setItem(authKey, 'authenticated');
    
    setShowFileSelectionPopup(true);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageLoadStart = () => {
    setImageLoading(true);
  };

  const getImageUrl = (filename: string) =>
    `${API_BASE}/data-commons/project/${encodeURIComponent(selectedGroup)}/${encodeURIComponent(selectedProgram)}/${encodeURIComponent(selectedProject)}/files/${encodeURIComponent(filename)}`;

  return (
    <div
      className='w-full border rounded-lg shadow-md'
      style={{ height: '85vh', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <h2
        style={{
          background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
        }}
        className='text-2xl text-white rounded-t-lg font-semibold px-6 py-2 mb-6 flex-shrink-0'
      >
        A Centralized Data Commons of Multi-Omics Data for Exploratory Research
      </h2>

      <div className='flex-shrink-0'>
        <form className='px-8 pb-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <Label htmlFor='group'>Select Group</Label>
              <Select
                value={selectedGroup}
                onValueChange={val => {
                  if (selectedGroup && selectedProgram && selectedProject) {
                    const oldAuthKey = `auth_${selectedGroup}_${selectedProgram}_${selectedProject}`;
                    sessionStorage.removeItem(oldAuthKey);
                  }
                  setSelectedGroup(val);
                  setSelectedProgram('');
                  setSelectedProject('');
                }}
                disabled={structureLoading}
              >
                <SelectTrigger id='group'>
                  <SelectValue placeholder={structureLoading ? 'Loading groups...' : 'Select group'} />
                </SelectTrigger>
                <SelectContent>
                  {structureLoading ? (
                    <div className='flex items-center justify-center py-4'>
                      <Spinner />
                      <span className='ml-2 text-sm text-gray-500'>Loading groups...</span>
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
              <Label htmlFor='program'>Select Program</Label>
              <Select
                value={selectedProgram}
                onValueChange={val => {
                  if (selectedGroup && selectedProgram && selectedProject) {
                    const oldAuthKey = `auth_${selectedGroup}_${selectedProgram}_${selectedProject}`;
                    sessionStorage.removeItem(oldAuthKey);
                  }
                  setSelectedProgram(val);
                  setSelectedProject('');
                }}
                disabled={structureLoading || !selectedGroup}
              >
                <SelectTrigger id='program'>
                  <SelectValue placeholder={structureLoading ? 'Loading...' : 'Select program'} />
                </SelectTrigger>
                <SelectContent>
                  {structureLoading ? (
                    <div className='flex items-center justify-center py-4'>
                      <Spinner />
                      <span className='ml-2 text-sm text-gray-500'>Loading...</span>
                    </div>
                  ) : programs.length === 0 ? (
                    <div className='py-4 text-center text-sm text-gray-500'>
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
              <Label htmlFor='project'>Select Project</Label>
              <Select
                value={selectedProject}
                onValueChange={val => {
                  if (selectedGroup && selectedProgram && selectedProject) {
                    const oldAuthKey = `auth_${selectedGroup}_${selectedProgram}_${selectedProject}`;
                    sessionStorage.removeItem(oldAuthKey);
                  }
                  setSelectedProject(val);
                }}
                disabled={structureLoading || !selectedProgram}
              >
                <SelectTrigger id='project'>
                  <SelectValue placeholder={structureLoading ? 'Loading...' : 'Select project'} />
                </SelectTrigger>
                <SelectContent>
                  {structureLoading ? (
                    <div className='flex items-center justify-center py-4'>
                      <Spinner />
                      <span className='ml-2 text-sm text-gray-500'>Loading...</span>
                    </div>
                  ) : projects.length === 0 ? (
                    <div className='py-4 text-center text-sm text-gray-500'>
                      {selectedProgram ? 'No projects available' : 'Select a program first'}
                    </div>
                  ) : (
                    projects.map(project => (
                      <SelectItem key={project.name} value={project.name}>
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>

        {selectedGroup && selectedProgram && selectedProject && (
          <div className='px-8 pb-4'>
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
          </div>
        )}
      </div>

      <div className='px-8 pb-8 flex-1 min-h-0'>
        <div
          className='mt-2 flex flex-col items-center justify-center h-full'
          style={{
            maxWidth: '100%',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {(loading || imageLoading) && (
              <div className='absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10'>
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
                      {descriptionFiles.map((_, idx) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: idx === currentIndex ? '#1976d2' : '#bbb',
                            cursor: 'pointer',
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
      />
      <PasswordPopup
        isOpen={showPasswordPopup}
        onClose={() => setShowPasswordPopup(false)}
        onSuccess={handlePasswordSuccess}
        selectedGroup={selectedGroup}
        selectedProgram={selectedProgram}
        selectedProject={selectedProject}
      />
    </div>
  );
}
