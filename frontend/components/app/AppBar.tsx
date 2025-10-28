import { SquareDashedMousePointerIcon } from 'lucide-react';
import { Suspense, useState } from 'react';
import { Input } from '../ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { FileName } from '.';

export function AppBar() {
  const [visible, setVisible] = useState(true);
  return (
    <div className='flex items-center gap-2'>
      <Tooltip>
        <TooltipTrigger className='relative'>
          {visible && (
            // biome-ignore lint/a11y/noStaticElementInteractions: hydration error (button inside button)
            <span
              className='-bottom-2 absolute flex size-2.5'
              onClick={() => setVisible(false)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setVisible(false)}
            >
              <span className='-bottom-0.5 absolute z-50 inline-flex h-[150%] w-[150%] animate-ping rounded-full bg-sky-400 opacity-75' />
              <span className='relative inline-flex size-2.5 rounded-full bg-sky-500' />
            </span>
          )}
          <SquareDashedMousePointerIcon className='size-4 text-white' />
        </TooltipTrigger>
        <TooltipContent align='start' className='max-w-96 text-sm text-white'>
          <ol>
            <li>
              • To select multiple genes and export details or perform GSEA analysis, use the mouse to select the genes
              <br />
              <b>
                <i>Shortcut: </i>
              </b>
              <kbd className='rounded-md border border-white px-1'> Shift(⇧) + Click</kbd> & Drag
            </li>
            <br />
            <li>
              • To highlight neighbors of a gene, either check Highlight Neighbor Genes on Network Style section and
              then hover/click the gene
              <br />
              <b>
                <i>Shortcut: </i>
              </b>
              <kbd className='rounded-md border border-white px-1'>Cmd/Ctrl(⌘) + Hover</kbd>
            </li>
            <br />
            <li>
              • To highlight a gene via appending it to search textbox, click the gene while holding the Cmd/Ctrl(⌘) key
              <br />
              <b>
                <i>Shortcut: </i>
              </b>
              <kbd className='rounded-md border border-white px-1'>Cmd/Ctrl(⌘) + Click</kbd>
            </li>
          </ol>
        </TooltipContent>
      </Tooltip>
      <Suspense fallback={<Input className='max-w-fit font-semibold text-sm' value={'Untitled'} />}>
        <FileName />
      </Suspense>
    </div>
  );
}
