'use client';

import PopUpTable from '@/components/PopUpTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VirtualizedCombobox } from '@/components/VirtualizedCombobox';
import { graphConfig } from '@/lib/data';
import { GENE_VERIFICATION_QUERY } from '@/lib/gql';
import type { GeneVerificationData, GeneVerificationVariables, GetDiseaseData, GraphConfigForm } from '@/lib/interface';
import { distinct, envURL } from '@/lib/utils';
import { useLazyQuery } from '@apollo/client';
import { AlertTriangle, Info, Loader } from 'lucide-react';
import React, { type ChangeEvent } from 'react';
import { toast } from 'sonner';
import History from '@/components/History';
import type { HistoryItem } from '@/components/History';

export default function Home() {
  const [verifyGenes, { data, loading }] = useLazyQuery<GeneVerificationData, GeneVerificationVariables>(
    GENE_VERIFICATION_QUERY,
  );
  const [diseaseData, setDiseaseData] = React.useState<GetDiseaseData | null>(null);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${envURL(process.env.NEXT_PUBLIC_BACKEND_URL)}/diseases`);
        if (!response.ok) {
          throw new Error('Failed to fetch diseases');
        }
        const data = await response.json();
        setDiseaseData(data);
      } catch (error) {
        console.error('Error fetching diseases:', error);
        toast.error('Error fetching diseases', {
          description: 'Failed to load disease data. Please try again later.',
        });
      }
    })();
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHistory = localStorage.getItem('history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    }
  }, []);

  const [formData, setFormData] = React.useState<GraphConfigForm>({
    seedGenes: 'MAPT, STX6, EIF2AK3, MOBP, DCTN1, LRRK2',
    diseaseMap: 'amyotrophic lateral sclerosis (MONDO_0004976)',
    order: '0',
    interactionType: 'PPI',
    minScore: '0.9',
  });

  React.useEffect(() => {
    const escapeListener = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTableOpen(false);
      }
    };
    document.addEventListener('keydown', escapeListener);
    return () => {
      document.removeEventListener('keydown', escapeListener);
    };
  }, []);

  const [tableOpen, setTableOpen] = React.useState(false);
  const [geneIDs, setGeneIDs] = React.useState<string[]>([]);
  const [showAlert, setShowAlert] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { seedGenes } = formData;
    const geneIDs = distinct(seedGenes.split(/[,|\n]/).map(gene => gene.trim().toUpperCase())).filter(Boolean);
    setGeneIDs(geneIDs);
    const { error } = await verifyGenes({
      variables: { geneIDs },
    });
    if (error) {
      console.error(error);
      toast.error('Error fetching data', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Server not available,Please try again later',
      });
      return;
    }
    setTableOpen(true);
  };

  const handleSelect = (val: string, key: string) => {
    setFormData({ ...formData, [key]: val });
  };

  const handleFileRead = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file?.type !== 'text/plain') {
      toast.error('Invalid file type', {
        cancel: { label: 'Close', onClick() {} },
      });
      return;
    }
    const text = await file?.text();
    if (text) {
      setFormData({ ...formData, seedGenes: text });
    } else {
      toast.error('Error reading file', {
        cancel: { label: 'Close', onClick() {} },
      });
    }
  };

  const handleSeedGenesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, seedGenes: event.target.value });
  };

  const handleGenerateGraph = (skipWarning = false) => {
    if (!skipWarning) {
      const seedCount = data?.genes.length ?? 0;
      const orderNum = +formData.order;
      const maxGenes = orderNum === 0 ? 5000 : 50;
      const warningThreshold = orderNum === 0 ? 1000 : 25;

      if (seedCount > maxGenes) {
        toast.error('Too many seed genes', {
          description: `Maximum ${maxGenes} genes allowed for ${
            orderNum === 0 ? 'zero' : 'first/second'
          } order networks`,
          cancel: { label: 'Close', onClick() {} },
        });
        return;
      }

      if (seedCount > warningThreshold) {
        setShowAlert(true);
        return;
      }
    }
    const seedGenes = data?.genes.map(gene => gene.ID);
    if (!seedGenes) {
      toast.error('There is no valid gene in the list', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Please enter valid gene names',
      });
      return;
    }
    const graphConfig = {
      geneIDs: seedGenes,
      diseaseMap: formData.diseaseMap,
      order: +formData.order,
      interactionType: formData.interactionType,
      minScore: +formData.minScore,
      createdAt: Date.now(),
    };
    localStorage.setItem('graphConfig', JSON.stringify(graphConfig));

    // Add to history
    const newHistoryItem: HistoryItem = {
      ...formData,
      title: `Network ${history.length + 1}`,
      geneIDs: seedGenes,
      createdAt: Date.now(),
    };
    const newHistory = [newHistoryItem, ...history];
    setHistory(newHistory);
    localStorage.setItem('history', JSON.stringify(newHistory));

    setTableOpen(false);
    window.open('/network', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className='mx-auto border rounded-lg shadow-md min-h-screen overflow-y-auto'>
      <h2
        style={{
          background: '#2B5876',
        }}
        className='text-2xl text-white rounded-t-lg font-semibold px-6 py-2 mb-6'
      >
        Search by Multiple Proteins
      </h2>
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 px-8'>
        <div>
          <form onSubmit={handleSubmit}>
            <div className='space-y-4'>
              <div>
                <div className='flex justify-between'>
                  <Label htmlFor='seedGenes' className='text-gray-900 font-medium'>
                    Seed Genes
                  </Label>
                  <p className='text-gray-900'>
                    (one-per-line or CSV; examples: {/* biome-ignore lint/a11y/useKeyWithClickEvents: required */}
                    <span
                      className='underline cursor-pointer text-gray-900 hover:text-gray-700'
                      onClick={() => {
                        setFormData({
                          ...formData,
                          seedGenes: 'MAPT, STX6, EIF2AK3, MOBP, DCTN1, LRRK2',
                        });
                      }}
                    >
                      #1
                    </span>{' '}
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                    <span
                      className='underline cursor-pointer text-gray-900 hover:text-gray-700'
                      onClick={() => {
                        setFormData({
                          ...formData,
                          seedGenes: `ENSG00000122359
ENSG00000100823
ENSG00000214944
ENSG00000172995
ENSG00000147894
ENSG00000162063`,
                        });
                      }}
                    >
                      #2
                    </span>{' '}
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                    <span
                      className='underline cursor-pointer text-gray-900 hover:text-gray-700'
                      onClick={() => {
                        setFormData({
                          ...formData,
                          seedGenes: `DCTN1
DNAJC7
ERBB4
ERLIN1
EWSR1
FIG4`,
                        });
                      }}
                    >
                      #3
                    </span>
                  </p>
                </div>
                <Textarea
                  rows={6}
                  id='seedGenes'
                  placeholder='Type seed genes in either , or new line separated format'
                  className='mt-1 text-gray-900 bg-white rounded-md border border-gray-200 focus:border-gray-300'
                  value={formData.seedGenes}
                  onChange={handleSeedGenesChange}
                  required
                />
                <center className='text-gray-900'>OR</center>
                <Label htmlFor='seedFile' className='text-gray-900 font-medium'>
                  Upload Text File
                </Label>
                <Input
                  id='seedFile'
                  type='file'
                  accept='.txt'
                  className='border-2 hover:border-dashed cursor-pointer h-9 text-gray-900 bg-white rounded-md border-gray-200 focus:border-gray-300'
                  onChange={handleFileRead}
                />
              </div>
              <div className='space-y-4'>
                <div className='space-y-2 relative z-50'>
                  <div className='flex items-center gap-1 h-6'>
                    <Label htmlFor='diseaseMap' className='text-gray-900 font-medium whitespace-nowrap'>
                      Disease Map
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className='text-gray-500 shrink-0' />
                      </TooltipTrigger>
                      <TooltipContent
                        side='bottom'
                        align='start'
                        className='text-gray-900 w-[300px] bg-white border border-gray-200'
                      >
                        Contains the disease name to be mapped taken from OpenTargets Portal. <br />
                        <b>Note:</b> To search disease using its ID, type disease ID in parentheses.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <VirtualizedCombobox
                    data={diseaseData?.map(val => `${val.name} (${val.ID})`)}
                    value={formData.diseaseMap}
                    onChange={val => typeof val === 'string' && handleSelect(val, 'diseaseMap')}
                    placeholder='Search Disease...'
                    loading={diseaseData === null}
                    className='w-full text-gray-900 bg-white rounded-md border border-gray-200 focus:border-gray-300 h-10'
                    width='900px'
                  />
                </div>
                <div className='grid grid-cols-2 gap-6 mb-8'>
                  {graphConfig.map(config => (
                    <div key={config.id} className='space-y-2'>
                      <div className='flex items-center gap-1 h-6'>
                        <Label htmlFor={config.id} className='text-gray-900 font-medium whitespace-nowrap'>
                          {config.name}
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info size={14} className='text-gray-500 shrink-0' />
                          </TooltipTrigger>
                          <TooltipContent
                            side='bottom'
                            align='start'
                            className='text-gray-900 w-[300px] bg-white border border-gray-200'
                          >
                            {config.tooltipContent}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select required value={formData[config.id]} onValueChange={val => handleSelect(val, config.id)}>
                        <SelectTrigger
                          id={config.id}
                          className='w-full text-gray-900 bg-white border border-gray-200 hover:border-gray-300 focus:border-gray-300 h-10 rounded-md'
                        >
                          <SelectValue placeholder='Select...' />
                        </SelectTrigger>
                        <SelectContent>
                          {config.options.map(option => (
                            <SelectItem key={option.value} value={option.value} className='text-gray-900'>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
              <center>
                <Button
                  type='submit'
                  className='w-3/4 mb-4 bg-[#2B5876] hover:bg-[#1A365D] transition-colors text-white rounded-xl py-3 text-lg font-medium'
                >
                  {loading ? (
                    <>
                      <Loader className='animate-spin mr-2' size={20} />
                      Verifying {geneIDs.length} genes...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </center>
              <PopUpTable
                setTableOpen={setTableOpen}
                tableOpen={tableOpen}
                handleGenerateGraph={handleGenerateGraph}
                data={data}
                geneIDs={geneIDs}
              />
            </div>
          </form>
        </div>
        <div className='border rounded-lg p-4 bg-white'>
          <History history={history} setHistory={setHistory} setFormData={setFormData} />
        </div>
      </div>
      <AlertDialog open={showAlert}>
        <AlertDialogContent className='bg-white'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-red-500 flex items-center'>
              <AlertTriangle size={24} className='mr-2' />
              Warning!
            </AlertDialogTitle>
            <AlertDialogDescription className='text-gray-900'>
              You are about to generate a graph with a large number of nodes/edges. This may take a long time to
              complete.
            </AlertDialogDescription>
            <p className='text-gray-900 font-semibold'>Are you sure you want to proceed?</p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowAlert(false)}
              className='text-gray-900 border-gray-200 hover:bg-gray-100'
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowAlert(false);
                handleGenerateGraph(true);
                document.body.removeAttribute('style');
              }}
              className='bg-[#2B5876] hover:bg-[#1A365D] text-white'
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
