'use client';

import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multiselect';
import type { ProcessedData } from './types';

interface NetworkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableContrasts: string[];
  processedData: Record<string, ProcessedData>;
  selectedType: 'gene' | 'transcript';
}

export function NetworkDialog({
  isOpen,
  onClose,
  availableContrasts,
  processedData,
  selectedType,
}: NetworkDialogProps) {
  const [regulationType, setRegulationType] = useState<'upregulated' | 'downregulated' | 'both'>('upregulated');
  const [selectedContrasts, setSelectedContrasts] = useState<string[]>([]);
  const [editableGenes, setEditableGenes] = useState<string>('');

  const geneUnion = useMemo(() => {
    if (selectedContrasts.length === 0) return new Set<string>();

    const allGenes = new Set<string>();
    const colors =
      regulationType === 'both'
        ? new Set(['red', 'blue'])
        : new Set([regulationType === 'upregulated' ? 'red' : 'blue']);

    selectedContrasts.forEach(contrast => {
      const data = processedData[contrast];
      if (data) {
        data.points
          .filter(p => colors.has(p.color))
          .forEach(p => {
            allGenes.add(p.text);
          });
      }
    });

    return allGenes;
  }, [selectedContrasts, regulationType, processedData]);

  useEffect(() => {
    setEditableGenes(Array.from(geneUnion).sort().join('\n'));
  }, [geneUnion]);

  const handleCreate = () => {
    const genes = editableGenes
      .split('\n')
      .map(g => g.trim())
      .filter(g => g.length > 0);

    if (genes.length === 0) {
      return;
    }

    const normalizedGenes = genes
      .map(gene => {
        const match = gene.match(/\[([^\]]+)\]/);
        return (match?.[1] ?? gene).trim();
      })
      .filter(Boolean);

    if (normalizedGenes.length === 0) {
      return;
    }

    const networkData = {
      genes: normalizedGenes.join(', '),
      type: selectedType,
      regulationType,
      contrasts: selectedContrasts,
      timestamp: Date.now(),
    };

    localStorage.setItem('pendingNetworkData', JSON.stringify(networkData));
    localStorage.setItem('pendingSeedGenesFromDE', normalizedGenes.join(', '));

    window.open('/', '_blank', 'noopener,noreferrer');

    onClose();
  };

  const contrastOptions = availableContrasts
    .filter(c => c !== 'default')
    .map(contrast => ({
      label: contrast.toUpperCase(),
      value: contrast,
    }));

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl'>
        <button
          type='button'
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-600'
          aria-label='Close'
        >
          <X className='size-5' />
        </button>

        <h2 className='mb-6 font-semibold text-xl'>Create Network</h2>

        <div className='space-y-6'>
          <div>
            <Label className='mb-2 block font-medium text-sm'>1. Select Regulation Type</Label>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setRegulationType('upregulated')}
                className={`flex-1 rounded-lg border-2 px-4 py-3 transition-colors ${
                  regulationType === 'upregulated'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className='flex items-center justify-center gap-2'>
                  <div className='size-4 rounded-full bg-red-500'></div>
                  <span className='font-medium'>Upregulated</span>
                </div>
              </button>
              <button
                type='button'
                onClick={() => setRegulationType('downregulated')}
                className={`flex-1 rounded-lg border-2 px-4 py-3 transition-colors ${
                  regulationType === 'downregulated'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className='flex items-center justify-center gap-2'>
                  <div className='size-4 rounded-full bg-blue-500'></div>
                  <span className='font-medium'>Downregulated</span>
                </div>
              </button>
              <button
                type='button'
                onClick={() => setRegulationType('both')}
                className={`flex-1 rounded-lg border-2 px-4 py-3 transition-colors ${
                  regulationType === 'both'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className='flex items-center justify-center gap-2'>
                  <div className='size-2 rounded-full bg-red-500'></div>
                  <div className='size-2 rounded-full bg-blue-500'></div>
                  <span className='font-medium'>Both</span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <Label className='mb-2 block font-medium text-sm'>2. Select Contrasts</Label>
            <MultiSelect
              options={contrastOptions}
              selectedValues={selectedContrasts}
              onChange={setSelectedContrasts}
              placeholder='Select contrasts...'
              className='w-full'
            />
          </div>

          {selectedContrasts.length > 0 && (
            <div>
              <Label className='mb-2 block font-medium text-sm'>
                {selectedType === 'gene' ? 'Genes' : 'Transcripts'} ({geneUnion.size} total)
              </Label>
              <textarea
                value={editableGenes}
                onChange={e => setEditableGenes(e.target.value)}
                className='h-64 w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none'
                placeholder={`${selectedType === 'gene' ? 'Gene' : 'Transcript'} IDs (one per line)`}
              />
              <p className='mt-1 text-gray-500 text-xs'>
                Edit the list above. One {selectedType === 'gene' ? 'gene' : 'transcript'} per line.
              </p>
            </div>
          )}
        </div>

        <div className='mt-6 flex justify-end gap-3'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={selectedContrasts.length === 0 || editableGenes.trim() === ''}>
            Create Network
          </Button>
        </div>
      </div>
    </div>
  );
}
