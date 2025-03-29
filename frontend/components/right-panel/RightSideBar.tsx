import { Legend, NetworkAnalysis, NetworkInfo, NetworkLayout, NetworkStyle } from '.';
import { ScrollArea } from '../ui/scroll-area';

export function RightSideBar() {
  return (
    <ScrollArea className='border-l text-xs flex flex-col h-[calc(96vh-1.5px)] bg-secondary'>
      <NetworkLayout />
      <NetworkAnalysis />
      <NetworkStyle />
      <NetworkInfo />
      <Legend />
    </ScrollArea>
  );
}
