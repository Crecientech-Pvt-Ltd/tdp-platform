import { Events, eventEmitter } from '@/lib/utils';
import { DropdownMenuContent } from '@radix-ui/react-dropdown-menu';
import { FolderUp } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

const exportOptions = ['csv', 'png'] as const;

export function Export() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='oldtool'
          size='sm'
          className='text-xs hover:opacity-80 border-none bg-primary rounded-sm '
        >
          <FolderUp className='h-3 w-3 mr-1' />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='z-10 w-36 bg-zinc-100 border shadow p-1 gap-1 rounded-md'>
        {exportOptions.map(val => (
          <DropdownMenuItem
            key={val}
            onClick={() => eventEmitter.emit(Events.EXPORT, { format: val, all: true })}
            className='cursor-pointer'
          >
            {val.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
