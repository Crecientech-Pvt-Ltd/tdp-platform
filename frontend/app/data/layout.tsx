'use client';

import { LeftSideBar } from '@/components/left-panel';
import { RightSideBar } from '@/components/right-panel';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

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
    <Tabs value={activeTab} onValueChange={setActiveTab} className='h-screen flex flex-col'>
      <div className='bg-primary h-12 flex items-center p-2'>
        <Button variant='oldtool' size='icon' className='h-full' onClick={handleLeftSidebarToggle}>
          {leftSidebar ? <ChevronLeft className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
        </Button>
        <div className='flex-1 flex justify-center'>
          <TabsList className='flex items-center gap-2 h-8 w-3/4 max-w-4xl'>
            {tabNames.map(tab => (
              <TabsTrigger key={tab.key} className='flex-1 px-6' value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className='flex items-center gap-4'></div>
        <Button variant='oldtool' size='icon' className='h-full' onClick={handleRightSidebarToggle}>
          {rightSidebar ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
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
          className='bg-white h-full w-full'
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
