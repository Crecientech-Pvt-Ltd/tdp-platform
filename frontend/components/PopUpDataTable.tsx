import { DownloadIcon } from 'lucide-react';
import { unparse } from 'papaparse';
import React from 'react';
import type { PopUpDataTableProps } from '@/lib/interface';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { DataTable } from './ui/data-table';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export default function PopUpDataTable<E, F>({
  dialogTitle = '',
  data,
  columns,
  open = false,
  setOpen,
  filterColumnNames,
  tabsTitle,
  loading,
}: PopUpDataTableProps<E, F>) {
  // Defensive normalization to avoid hydration mismatches
  const safeTabs = Array.isArray(tabsTitle) && tabsTitle.length > 0 ? tabsTitle : [''];
  const defaultTab = safeTabs[0];
  const colsCount = safeTabs.length || 1;
  const safeData = Array.isArray(data) ? data : [];
  /**
   * Function to download the selected genes data as a CSV file
   */
  const handleDownload = (fileName?: string) => {
    const csv = unparse<E | F>(data[tabsTitle?.indexOf(fileName ?? tabsTitle[0]) ?? 0]);
    const element = document.createElement('a');
    const file = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    if (fileName) element.download = `${fileName}.csv`;
    document.body.appendChild(element);
    element.click();
    URL.revokeObjectURL(element.href);
    element.remove();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: not required
  React.useEffect(() => {
    // esc key to close the dialog
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog open={open}>
      <DialogContent className='flex max-h-[90vh] min-h-[60vh] max-w-7xl flex-col'>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <div className='grow overflow-y-scroll'>
          <Tabs defaultValue={defaultTab}>
            <TabsList className={cn('grid w-full', `grid-cols-${colsCount}`)}>
              {safeTabs.map(title => (
                <TabsTrigger key={title} value={title}>
                  {title}
                </TabsTrigger>
              ))}
            </TabsList>
            {safeTabs.map((title, idx) => (
              <TabsContent key={title || String(idx)} value={title}>
                <DataTable
                  data={(safeData[idx] ?? []) as any}
                  loading={loading?.[idx]}
                  columns={columns[idx] as any}
                  filterColumnName={filterColumnNames[idx]}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
        <DialogFooter className='w-full gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size={'icon'}>
                <DownloadIcon size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {tabsTitle?.map(title => (
                <DropdownMenuItem key={title} onClick={() => handleDownload(title)}>
                  {title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DialogClose asChild>
            <Button type='button' variant={'secondary'} onClick={() => setOpen(false)}>
              Close (Esc)
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
