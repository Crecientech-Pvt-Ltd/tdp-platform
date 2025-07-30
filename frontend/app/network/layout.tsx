'use client';

import { AppBar } from '@/components/app';
import { OpenTargetsHeatmap } from '@/components/heatmap';
import { LeftSideBar } from '@/components/left-panel';
import { RightSideBar } from '@/components/right-panel';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, FileTextIcon, HomeIcon } from 'lucide-react';
import React, { useEffect } from 'react';
import { Link } from 'next-view-transitions';
import { useStore } from '@/lib/hooks';

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
    <Tabs value={activeTab} onValueChange={setActiveTab} className='h-screen flex flex-col'>
      <div className='bg-primary h-12 flex items-center justify-between p-2'>
        <Button variant='oldtool' size='icon' className='h-full' onClick={() => setLeftSidebar(!leftSidebar)}>
          {leftSidebar ? <ChevronLeft className='h-4 w-4' /> : <ChevronRight className='h-4 w-4' />}
        </Button>
        <AppBar />
        <TabsList className='flex items-center gap-4 h-8 w-1/2'>
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
            className='inline-flex p-2 items-center h-full transition-colors text-xs border-none rounded-sm hover:bg-opacity-20 hover:text-black hover:underline'
          >
            <HomeIcon className='h-3 w-3 mr-1' /> Home
          </Link>
          <Link
            href={'/docs'}
            target='_blank'
            className='inline-flex p-2 items-center h-full transition-colors text-xs border-none rounded-sm hover:bg-opacity-20 hover:text-black hover:underline'
          >
            <FileTextIcon className='h-3 w-3 mr-1' /> Docs
          </Link>
        </div>
        <Button variant='oldtool' size='icon' className='h-full' onClick={() => setRightSidebar(!rightSidebar)}>
          {rightSidebar ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
        </Button>
      </div>

      <ResizablePanelGroup direction='horizontal' className='flex flex-1'>
        <ResizablePanel defaultSize={16} minSize={16} className={leftSidebar ? 'block' : 'hidden'}>
          <LeftSideBar />
        </ResizablePanel>
        <ResizableHandle withHandle className={leftSidebar ? 'flex' : 'hidden'} />
        <ResizablePanel defaultSize={68} className='bg-white h-full w-full'>
          <TabsContent
            forceMount
            value='Network'
            className={cn('h-full mt-0', activeTab === 'Network' ? 'visible' : 'invisible fixed')}
          >
            {children}
          </TabsContent>
          <TabsContent
            value='Heatmap'
            className={cn('h-full mt-0', activeTab === 'Heatmap' ? 'visible' : 'invisible fixed')}
          >
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
