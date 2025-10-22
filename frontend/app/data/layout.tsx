'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import React from 'react';
import { LeftSideBar } from '@/components/left-panel';
import { RightSideBar } from '@/components/right-panel';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function NetworkLayoutPage({ children }: { children: React.ReactNode }) {
  const tabNames = [
    { key: 'transcript', label: 'Gene-level expression' },
    { key: 'pca', label: 'PCA analysis' },
    { key: 'de', label: 'Differential Expression analysis' },
  ];
  const [activeTab, setActiveTab] = React.useState(tabNames[0].key);
  const [leftSidebar, setLeftSidebar] = React.useState<boolean>(false);
  const [rightSidebar, setRightSidebar] = React.useState<boolean>(false);

  const handleLeftSidebarToggle = React.useCallback(() => {
    setLeftSidebar(prev => !prev);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('layout-change'));
    }, 150);
  }, []);

  const handleRightSidebarToggle = React.useCallback(() => {
    setRightSidebar(prev => !prev);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('layout-change'));
    }, 150);
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className='flex h-screen flex-col'>
      <div className='flex h-12 items-center bg-primary p-2'>
        <Button variant='oldtool' size='icon' className='h-full' onClick={handleLeftSidebarToggle}>
          {leftSidebar ? <ChevronLeftIcon className='h-4 w-4' /> : <ChevronRightIcon className='h-4 w-4' />}
        </Button>
        <div className='flex flex-1 justify-center'>
          <TabsList className='flex h-8 w-3/4 max-w-4xl items-center gap-2'>
            {tabNames.map(tab => (
              <TabsTrigger key={tab.key} className='flex-1 px-6' value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className='flex items-center gap-4'></div>
        <Button variant='oldtool' size='icon' className='h-full' onClick={handleRightSidebarToggle}>
          {rightSidebar ? <ChevronRightIcon className='h-4 w-4' /> : <ChevronLeftIcon className='h-4 w-4' />}
        </Button>
      </div>

      <ResizablePanelGroup direction='horizontal' className='flex flex-1'>
        {leftSidebar && (
          <>
            <ResizablePanel defaultSize={16} minSize={16}>
              <LeftSideBar graphConfigPresent={false} />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}
        <ResizablePanel
          defaultSize={leftSidebar && rightSidebar ? 68 : leftSidebar || rightSidebar ? 84 : 100}
          className='h-full w-full bg-white'
        >
          {children}
        </ResizablePanel>
        {rightSidebar && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={16} minSize={16}>
              <RightSideBar />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </Tabs>
  );
}
