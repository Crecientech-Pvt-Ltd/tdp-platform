'use client';

import { ChevronLeftIcon, ChevronRightIcon, FileTextIcon, HomeIcon } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { AppBar } from '@/components/app';
import { OpenTargetsHeatmap } from '@/components/heatmap';
import { LeftSideBar } from '@/components/left-panel';
import { RightSideBar } from '@/components/right-panel';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export default function NetworkLayoutPage({ children }: { children: React.ReactNode }) {
  const activeTab = useStore(state => state.activeTab);
  const setActiveTab = useStore(state => state.setActiveTab);
  const [leftSidebar, setLeftSidebar] = React.useState<boolean>(true);
  const [rightSidebar, setRightSidebar] = React.useState<boolean>(true);

  useEffect(() => {
    if (activeTab === 'Network') {
      window.dispatchEvent(new Event('resize'));
    }
  }, [activeTab]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className='flex h-screen flex-col'>
      <div className='flex h-12 items-center justify-between bg-primary p-2'>
        <Button variant='oldtool' size='icon' className='h-full' onClick={() => setLeftSidebar(!leftSidebar)}>
          {leftSidebar ? <ChevronLeftIcon className='h-4 w-4' /> : <ChevronRightIcon className='h-4 w-4' />}
        </Button>
        <AppBar />
        <TabsList className='flex h-8 w-1/2 items-center gap-4'>
          <TabsTrigger className='w-full' value='Network'>
            Network Visualization
          </TabsTrigger>
          <TabsTrigger className='w-full' value='Heatmap'>
            OpenTargets Heatmap
          </TabsTrigger>
        </TabsList>
        <div className='flex items-center gap-4'>
          <Link
            href={'/'}
            className='inline-flex h-full items-center rounded-sm border-none p-2 text-xs transition-colors hover:bg-opacity-20 hover:text-black hover:underline'
          >
            <HomeIcon className='mr-1 h-3 w-3' /> Home
          </Link>
          <Link
            href={'/docs'}
            target='_blank'
            className='inline-flex h-full items-center rounded-sm border-none p-2 text-xs transition-colors hover:bg-opacity-20 hover:text-black hover:underline'
          >
            <FileTextIcon className='mr-1 h-3 w-3' /> Docs
          </Link>
        </div>
        <Button variant='oldtool' size='icon' className='h-full' onClick={() => setRightSidebar(!rightSidebar)}>
          {rightSidebar ? <ChevronRightIcon className='h-4 w-4' /> : <ChevronLeftIcon className='h-4 w-4' />}
        </Button>
      </div>

      <ResizablePanelGroup direction='horizontal' className='flex flex-1'>
        <ResizablePanel defaultSize={16} minSize={16} className={leftSidebar ? 'block' : 'hidden'}>
          <LeftSideBar />
        </ResizablePanel>
        <ResizableHandle withHandle className={leftSidebar ? 'flex' : 'hidden'} />
        <ResizablePanel defaultSize={68} className='h-full w-full bg-white'>
          <TabsContent
            forceMount
            value='Network'
            className={cn('mt-0 h-full', activeTab === 'Network' ? 'visible' : 'invisible fixed')}
          >
            {children}
          </TabsContent>
          <TabsContent value='Heatmap' className='mt-0 h-full'>
            <ScrollArea className='h-full'>
              <OpenTargetsHeatmap />
            </ScrollArea>
          </TabsContent>
        </ResizablePanel>
        <ResizableHandle withHandle className={rightSidebar ? 'flex' : 'hidden'} />
        <ResizablePanel defaultSize={16} minSize={16} className={rightSidebar ? 'block' : 'hidden'}>
          <RightSideBar />
        </ResizablePanel>
      </ResizablePanelGroup>
    </Tabs>
  );
}
