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
import History, { type HistoryItem } from '@/components/History';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Switch } from '@/components/ui/switch';

export default function Home() {
  const [verifyGenes, { data, loading }] = useLazyQuery<GeneVerificationData, GeneVerificationVariables>(
    GENE_VERIFICATION_QUERY,
  );
  const [diseaseData, setDiseaseData] = React.useState<GetDiseaseData | null>(null);

  React.useEffect(() => {
    (async () => {
      const response = await fetch(`${envURL(process.env.NEXT_PUBLIC_BACKEND_URL)}/diseases`);
      const data = await response.json();
      setDiseaseData(data);
    })();
  }, []);

  const [formData, setFormData] = React.useState<GraphConfigForm>({
    seedGenes: 'MAPT, STX6, EIF2AK3, MOBP, DCTN1, LRRK2',
    diseaseMap: 'amyotrophic lateral sclerosis (MONDO_0004976)',
    order: '0',
    interactionType: 'PPI',
    minScore: '0.9',
  });

  const [history, setHistory] = React.useState<HistoryItem[]>([]);

  React.useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('history') ?? '[]'));
  }, []);

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

  //replace with api call
  const mockGeneData = React.useMemo(
    () => ({
      '#1': [
        'FAKEGENE1',
        'FAKEGENE2',
        'FAKEGENE3',
        'FAKEGENE4',
        'FAKEGENE5',
        'FAKEGENE6',
        'FAKEGENE7',
        'FAKEGENE8',
        'FAKEGENE9',
        'FAKEGENE10',
        'FAKEGENE11',
        'FAKEGENE12',
        'FAKEGENE13',
        'FAKEGENE14',
        'FAKEGENE15',
        'FAKEGENE16',
        'FAKEGENE17',
        'FAKEGENE18',
        'FAKEGENE19',
        'FAKEGENE20',
      ],
      '#2': [
        'FAKEID0001',
        'FAKEID0002',
        'FAKEID0003',
        'FAKEID0004',
        'FAKEID0005',
        'FAKEID0006',
        'FAKEID0007',
        'FAKEID0008',
        'FAKEID0009',
        'FAKEID0010',
        'FAKEID0011',
        'FAKEID0012',
        'FAKEID0013',
        'FAKEID0014',
        'FAKEID0015',
        'FAKEID0016',
        'FAKEID0017',
        'FAKEID0018',
        'FAKEID0019',
        'FAKEID0020',
      ],
      '#3': [
        'ALIASGENE1',
        'ALIASGENE2',
        'ALIASGENE3',
        'ALIASGENE4',
        'ALIASGENE5',
        'ALIASGENE6',
        'ALIASGENE7',
        'ALIASGENE8',
        'ALIASGENE9',
        'ALIASGENE10',
        'ALIASGENE11',
        'ALIASGENE12',
        'ALIASGENE13',
        'ALIASGENE14',
        'ALIASGENE15',
        'ALIASGENE16',
        'ALIASGENE17',
        'ALIASGENE18',
        'ALIASGENE19',
        'ALIASGENE20',
      ],
    }),
    [],
  );

  const [autofill, setAutofill] = React.useState(false);
  const [autofillType, setAutofillType] = React.useState<'#1' | '#2' | '#3'>('#1');
  const [autofillNum, setAutofillNum] = React.useState<string>('25');
  const lastAutofill = React.useRef<{ type: string; num: number }>({ type: '#1', num: 0 });

  React.useEffect(() => {
    if (!autofill) return;
    const num = parseInt(autofillNum, 10);
    if (!autofillNum || isNaN(num) || num <= 0) {
      setFormData(f => ({ ...f, seedGenes: '' }));
      return;
    }
    const genes = mockGeneData[autofillType].slice(0, num);
    let value = '';
    if (autofillType === '#1') {
      value = genes.join(', ');
    } else {
      value = genes.join('\n');
    }
    setFormData(f => ({ ...f, seedGenes: value }));
    lastAutofill.current = { type: autofillType, num };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autofillType, autofillNum, autofill]);

  React.useEffect(() => {
    if (!autofill) return;
    if (lastAutofill.current.num && autofillNum === '') {
      setAutofillNum(lastAutofill.current.num.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autofillType]);

  React.useEffect(() => {
    if (autofill) {
      if (!autofillNum) setAutofillNum('25');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autofill]);

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
    if (autofill) setAutofill(false);
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

    const newHistory = [
      {
        title: `Graph: ${history.length + 1}`,
        geneIDs: seedGenes,
        ...formData,
      },
      ...history,
    ];
    setHistory(newHistory);
    localStorage.setItem('history', JSON.stringify(newHistory));

    localStorage.setItem(
      'graphConfig',
      JSON.stringify({
        geneIDs: seedGenes,
        diseaseMap: formData.diseaseMap,
        order: +formData.order,
        interactionType: formData.interactionType,
        minScore: +formData.minScore,
        createdAt: Date.now(),
      }),
    );
    setTableOpen(false);
    window.open('/network', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className='mx-auto rounded-lg shadow-md border min-h-[80vh]'>
      <h2
        style={{
          background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
        }}
        className='text-2xl text-white rounded-t-lg font-semibold px-6 py-2 mb-6'
      >
        Search by Multiple Proteins
      </h2>
      <ResizablePanelGroup direction='horizontal' className='gap-4 p-4'>
        <ResizablePanel defaultSize={75} minSize={65}>
          <form onSubmit={handleSubmit}>
            <div className='space-y-4'>
              <div className='flex items-center gap-2 mb-2 flex-wrap'>
                <Switch checked={autofill} onCheckedChange={setAutofill} id='autofill-toggle' />
                <Label htmlFor='autofill-toggle' className='whitespace-nowrap'>
                  Autofill Seed Genes
                </Label>
                <span className='flex items-center'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={12} />
                    </TooltipTrigger>
                    <TooltipContent className='max-w-s'>
                      <div>
                        <div>
                          <b>Autofills</b> the seed genes box with the top <b>n</b> genes for the selected disease.
                        </div>
                        <div>Genes are ranked by overall association score from the OpenTargets platform.</div>
                        <div>
                          <b>Note:</b> Switch between gene identifier types (#1, #2, #3) using the links below.
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </span>
                <div
                  className={`flex items-center gap-1 ml-4 transition-opacity duration-200`}
                  style={{
                    minWidth: 160,
                    opacity: autofill ? 1 : 0,
                    visibility: autofill ? 'visible' : 'hidden',
                    height: 'auto',
                  }}
                >
                  <Label htmlFor='autofill-num'>No. of genes</Label>
                  <Input
                    id='autofill-num'
                    type='number'
                    min={1}
                    value={autofillNum}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^[0-9\b]+$/.test(val)) setAutofillNum(val);
                    }}
                    className='w-20'
                    placeholder='e.g. 25'
                    onWheel={e => e.currentTarget.blur()}
                  />
                </div>
              </div>
              <div>
                <div className='flex justify-between'>
                  <Label htmlFor='seedGenes'>Seed Genes</Label>
                  <p className='text-zinc-500'>
                    (one-per-line or CSV; examples:
                    <span
                      className='underline cursor-pointer'
                      onClick={() => {
                        if (autofill) {
                          setAutofillType('#1');
                        } else {
                          setFormData({
                            ...formData,
                            seedGenes: 'MAPT, STX6, EIF2AK3, MOBP, DCTN1, LRRK2',
                          });
                          setAutofillType('#1');
                          setAutofill(false);
                        }
                      }}
                    >
                      #1
                    </span>{' '}
                    <span
                      className='underline cursor-pointer'
                      onClick={() => {
                        if (autofill) {
                          setAutofillType('#2');
                        } else {
                          setFormData({
                            ...formData,
                            seedGenes: `ENSG00000122359
ENSG00000100823
ENSG00000214944
ENSG00000172995
ENSG00000147894
ENSG00000162063`,
                          });
                          setAutofillType('#2');
                          setAutofill(false);
                        }
                      }}
                    >
                      #2
                    </span>{' '}
                    <span
                      className='underline cursor-pointer'
                      onClick={() => {
                        if (autofill) {
                          setAutofillType('#3');
                        } else {
                          setFormData({
                            ...formData,
                            seedGenes: `DCTN1
DNAJC7
ERBB4
ERLIN1
EWSR1
FIG4`,
                          });
                          setAutofillType('#3');
                          setAutofill(false);
                        }
                      }}
                    >
                      #3
                    </span>
                    )
                  </p>
                </div>
                <Textarea
                  rows={6}
                  id='seedGenes'
                  placeholder='Type seed genes in either , or new line separated format'
                  className='mt-1'
                  value={formData.seedGenes}
                  onChange={handleSeedGenesChange}
                  required
                />
                <center>OR</center>
                <Label htmlFor='seedFile'>Upload Text File</Label>
                <Input
                  id='seedFile'
                  type='file'
                  accept='.txt'
                  className='border-2 hover:border-dashed cursor-pointer h-9'
                  onChange={handleFileRead}
                />
              </div>
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='space-y-1'>
                  <div className='flex items-end gap-1'>
                    <Label htmlFor='diseaseMap'>Disease Map</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} />
                      </TooltipTrigger>
                      <TooltipContent>
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
                    className='w-full hover:bg-transparent hover:text-current'
                  />
                </div>
                {graphConfig.map(config => (
                  <div key={config.id} className='space-y-1'>
                    <div className='flex items-end gap-1'>
                      <Label htmlFor={config.id}>{config.name}</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={12} />
                        </TooltipTrigger>
                        <TooltipContent>{config.tooltipContent}</TooltipContent>
                      </Tooltip>
                    </div>
                    <Select required value={formData[config.id]} onValueChange={val => handleSelect(val, config.id)}>
                      <SelectTrigger id={config.id}>
                        <SelectValue placeholder='Select...' />
                      </SelectTrigger>
                      <SelectContent>
                        {config.options.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <center>
                <Button
                  type='submit'
                  style={{
                    background:
                      'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
                  }}
                  className='w-3/4 mb-4'
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
            <AlertDialog open={showAlert}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className='text-red-500 flex items-center'>
                    <AlertTriangle size={24} className='mr-2' />
                    Warning!
                  </AlertDialogTitle>
                  <AlertDialogDescription className='text-black'>
                    You are about to generate a graph with a large number of nodes/edges. This may take a long time to
                    complete.
                  </AlertDialogDescription>
                  <p className='text-black font-semibold'>Are you sure you want to proceed?</p>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowAlert(false)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setShowAlert(false);
                      handleGenerateGraph(true);
                      document.body.removeAttribute('style');
                    }}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        </ResizablePanel>
        <ResizableHandle withHandle className='hidden md:flex' />
        <ResizablePanel className='h-[65vh] hidden md:block' defaultSize={25} minSize={15}>
          <History history={history} setHistory={setHistory} setFormData={setFormData} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
