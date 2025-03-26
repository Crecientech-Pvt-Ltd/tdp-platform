import { Legend, NetworkAnalysis, NetworkInfo, NetworkLayout, NetworkStyle } from '.';
import { ScrollArea } from '../ui/scroll-area';

export function RightSideBar() {
  return (
    <ScrollArea className='border-l text-xs flex flex-col h-[98vh] bg-secondary overflow-auto'>
      <div className="flex flex-col flex-grow">
        <NetworkLayout />
        <NetworkAnalysis />
        <NetworkStyle />
        <NetworkInfo />
        <Legend />
      </div>
    </ScrollArea>
  );
}
