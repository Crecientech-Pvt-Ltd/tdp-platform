import { Legend, NetworkAnalysis, NetworkInfo, NetworkLayout, NetworkStyle } from '.';
import { ScrollArea } from '../ui/scroll-area';

export function RightSideBar() {
  return (
    <ScrollArea className='text-xs flex flex-col h-[98vh] bg-secondary'>
      <NetworkLayout />
      <NetworkAnalysis />
      <NetworkStyle />
      <NetworkInfo />
      <Legend />
    </ScrollArea>
  );
}
