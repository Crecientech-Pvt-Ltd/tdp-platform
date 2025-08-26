'use client';

import React, { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface DataFile {
  filename: string;
  description: string;
  xDescription: string;
  yDescription: string;
  columns?: string[];
  [key: string]: string | string[] | undefined;
}

interface SeeMoreProps {
  isOpen: boolean;
  onClose: () => void;
  dataFiles: DataFile[];
  currentXColumn: string;
  currentYColumn: string;
  onColumnChange: (xColumn: string, yColumn: string) => void;
  changeUseOfLog: (logUsage: boolean) => void;
  isLogUsed: boolean;
}

export default function SeeMore({
  isOpen,
  onClose,
  dataFiles,
  currentXColumn,
  currentYColumn,
  onColumnChange,
  changeUseOfLog,
  isLogUsed,
}: SeeMoreProps) {
  const [selectedXColumn, setSelectedXColumn] = useState(currentXColumn);
  const [selectedYColumn, setSelectedYColumn] = useState(currentYColumn);
  const [logEnabled, setLogEnabled] = useState(isLogUsed);

  const allColumns = React.useMemo(() => {
    const columnSet = new Set<string>();
    dataFiles.forEach(file => {
      if (file.columns) {
        file.columns.forEach(col => {
          if (col.trim() !== '') {
            columnSet.add(col);
          }
        });
      }
    });
    return Array.from(columnSet).sort();
  }, [dataFiles]);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedXColumn(currentXColumn);
      setSelectedYColumn(currentYColumn);
      setLogEnabled(isLogUsed);
    }
  }, [isOpen, currentXColumn, currentYColumn, isLogUsed]);

  const handleApplyChanges = () => {
    onColumnChange(selectedXColumn, selectedYColumn);
    changeUseOfLog(logEnabled);
    onClose();
  };

  const handleCancel = () => {
    setSelectedXColumn(currentXColumn);
    setSelectedYColumn(currentYColumn);
    setLogEnabled(isLogUsed);
    onClose();
  };

  const handleLogChange = (checked: boolean) => {
    setLogEnabled(checked);
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className='max-w-4xl w-[95vw] max-h-[90vh] flex flex-col'>
        <DialogTitle className='text-xl font-semibold'>Plot Configuration & Data Information</DialogTitle>

        <div className='flex-grow overflow-y-auto px-1 py-4'>
          <div className='space-y-8'>
            <div className='bg-muted/30 rounded-lg p-6 border'>
              <h3 className='text-lg font-semibold mb-4 text-primary'>Axis Configuration</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-3'>
                  <Label className='text-base font-medium'>X-Axis Column</Label>
                  <Select value={selectedXColumn} onValueChange={setSelectedXColumn}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select X-axis column' />
                    </SelectTrigger>
                    <SelectContent>
                      {allColumns.map(column => (
                        <SelectItem key={column} value={column || 'default'}>
                          <span className='font-medium'>{column}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-sm text-muted-foreground'>
                    Currently mapping to: <span className='font-medium'>{selectedXColumn}</span>
                  </p>
                </div>

                <div className='space-y-3'>
                  <Label className='text-base font-medium'>Y-Axis Column</Label>
                  <Select value={selectedYColumn} onValueChange={setSelectedYColumn}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select Y-axis column' />
                    </SelectTrigger>
                    <SelectContent>
                      {allColumns.map(column => (
                        <SelectItem key={column} value={column || 'default'}>
                          <span className='font-medium'>{column}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-sm text-muted-foreground'>
                    Currently mapping to: <span className='font-medium'>{selectedYColumn}</span>
                  </p>
                </div>
              </div>

              <div className='mt-6 pt-4 border-t'>
                <div className='flex items-center space-x-2'>
                  <Checkbox id='log-scale' checked={logEnabled} onCheckedChange={handleLogChange} />
                  <Label htmlFor='log-scale' className='text-base font-medium cursor-pointer'>
                    Use logarithmic scale
                  </Label>
                </div>
                <p className='text-sm text-muted-foreground mt-1 ml-6'>
                  Apply logarithmic transformation to the Y-Axis data for better visualization of exponential
                  relationships
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                  <Label className='text-sm font-medium'>X-Axis Data</Label>
                </div>
                <div className='bg-muted/50 rounded-md p-3 border-l-4 border-l-blue-500'>
                  <p className='text-sm'>{dataFiles[0].xDescription || ' '}</p>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                  <Label className='text-sm font-medium'>Y-Axis Data</Label>
                </div>
                <div className='bg-muted/50 rounded-md p-3 border-l-4 border-l-green-500'>
                  <p className='text-sm'>{dataFiles[0].yDescription || ' '}</p>
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-primary'>Data Files Information</h3>

              {dataFiles.map((file, index) => (
                <div key={index} className='bg-background border rounded-lg p-5 shadow-sm'>
                  <div className='space-y-4'>
                    <div className='border-b pb-3'>
                      <h4 className='text-base font-semibold text-foreground'>{file.filename}</h4>
                      <p className='text-sm text-muted-foreground mt-1'>{file.description || ' '}</p>
                    </div>

                    {file.columns && file.columns.length > 0 && (
                      <div className='space-y-2'>
                        <Label className='text-sm font-medium'>Available Columns</Label>
                        <div className='bg-muted/30 rounded-md p-3'>
                          <div className='flex flex-wrap gap-2'>
                            {file.columns
                              .filter(column => column.trim() !== '')
                              .map((column, colIndex) => (
                                <span
                                  key={colIndex}
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    column === selectedXColumn || column === selectedYColumn
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {column}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2 flex-col sm:flex-row justify-between border-t pt-4'>
          <DialogClose asChild>
            <Button
              type='button'
              variant='secondary'
              onClick={handleCancel}
              className='w-full sm:w-auto order-2 sm:order-1'
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleApplyChanges}
            className='bg-primary text-white hover:bg-primary/90 w-full sm:w-auto order-1 sm:order-2'
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
