import { ScrollArea } from '../ui/scroll-area';
import { Legend, NetworkAnalysis, NetworkInfo, NetworkLayout, NetworkStyle } from '.';

export function RightSideBar() {
  return (
    <ScrollArea className='flex h-[calc(96vh-1.5px)] flex-col border-l bg-secondary text-xs'>
      <NetworkLayout />
      <NetworkAnalysis />
      <NetworkStyle />
      <NetworkInfo />
      <Legend />
    </ScrollArea>
  );
}
