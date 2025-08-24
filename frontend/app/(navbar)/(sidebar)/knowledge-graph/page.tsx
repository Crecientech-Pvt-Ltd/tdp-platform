'use client';
import PopUpTable from '@/components/PopUpTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENE_VERIFICATION_QUERY } from '@/lib/gql';
import type { GeneVerificationData, GeneVerificationVariables } from '@/lib/interface';
import { distinct, openDB } from '@/lib/utils';
import { useLazyQuery } from '@apollo/client';
import { Loader, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import Papa from 'papaparse';

//made interface to define the type of columns of primekg
interface PrimeKGRow {
  relation: string;
  display_relation: string;
  x_index: string;
  x_id: string;
  x_type: string;
  x_name: string;
  x_source: string;
  y_index: string;
  y_id: string;
  y_type: string;
  y_name: string;
  y_source: string;
}

interface NetworkEdge {
  node1: string;
  node2: string;
  score?: number;
  relation?: string;
  display_relation?: string;
}

export default function UploadFile() {
  const [file, setFile] = React.useState<File | null>(null);
  const [fileType, setFileType] = React.useState<'csv' | 'json'>('csv');
  const [fetchData, { data, loading }] = useLazyQuery<GeneVerificationData, GeneVerificationVariables>(
    GENE_VERIFICATION_QUERY,
  );
  //explicit for gene verification only and its rendering
  //   fetchData: GraphQL lazy query function for gene verification
  //i took this from upload network

  const [tableOpen, setTableOpen] = React.useState(false);
  const [geneIDs, setGeneIDs] = React.useState<string[]>([]);
  //only gene data is extracted till now

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [parsedData, setParsedData] = useState<PrimeKGRow[]>([]);
  const [isPrimeKG, setIsPrimeKG] = useState(false);
  const [processedNetworkData, setProcessedNetworkData] = useState<NetworkEdge[]>([]);

  //for auth use password admin123
  const handleAuthentication = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
      toast.success('Authentication successful!');
    } else {
      toast.error('Incorrect password');
    }
  };

  //this whole function just checks for the header content whether all columns according to primekg present or not

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.name.endsWith('.csv')) {
      setFileType('csv');
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = event => {
        const csvData = event.target?.result as string;
        const firstLine = csvData.split('\n')[0].toLowerCase();

        if (
          firstLine.includes('relation') &&
          firstLine.includes('display_relation') &&
          firstLine.includes('x_index') &&
          firstLine.includes('x_id') &&
          firstLine.includes('x_type') &&
          firstLine.includes('x_name') &&
          firstLine.includes('x_source') &&
          firstLine.includes('y_index') &&
          firstLine.includes('y_id') &&
          firstLine.includes('y_type') &&
          firstLine.includes('y_name') &&
          firstLine.includes('y_source')
        ) {
          setIsPrimeKG(true);
          parsePrimeKGData(csvData);
        } else {
          setIsPrimeKG(false);
        }
      };
      reader.readAsText(selectedFile);
    } else if (selectedFile.name.endsWith('.json')) {
      setFileType('json');
      setFile(selectedFile);
      setIsPrimeKG(false);
    } else {
      toast.error('Invalid file type', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Please upload a CSV or JSON file',
      });
    }
  };

  //    2. What Happens WITHOUT Processing
  // If we skip processPrimeKGForNetwork, the network visualization would receive:

  // 12 columns instead of expected 3
  // Entity IDs (ENSG00000100813) instead of readable names (ACIN1)
  // Mixed entity types (compounds, diseases) that might break gene-focused algorithms
  // No standardized scoring system
  // 3. The Processing
  const processPrimeKGForNetwork = useCallback((data: PrimeKGRow[]) => {
    const networkEdges: NetworkEdge[] = data.map(row => ({
      node1: row.x_name.trim().toUpperCase(),
      node2: row.y_name.trim().toUpperCase(),
      score: 1,
      relation: row.relation,
      display_relation: row.display_relation,
    }));

    setProcessedNetworkData(networkEdges);

    const geneNodes = data.flatMap(row => {
      const genes = [];
      if (row.x_type?.toLowerCase().includes('gene')) genes.push(row.x_name.trim().toUpperCase());
      if (row.y_type?.toLowerCase().includes('gene')) genes.push(row.y_name.trim().toUpperCase());
      return genes;
    });

    const uniqueGenes = distinct(geneNodes);
    setGeneIDs(uniqueGenes);

    return { networkEdges, allNodes: uniqueGenes };
  }, []);

  const parsePrimeKGData = useCallback(
    (csvText: string) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
          const data = results.data as PrimeKGRow[];
          setParsedData(data);

          // Process data for network generation
          const { networkEdges, allNodes } = processPrimeKGForNetwork(data);

          toast.success(
            `Processed ${data.length} relationships into ${networkEdges.length} network edges. Found ${allNodes.length} unique genes.`,
          );
        },
        error: (error: Error) => {
          console.error('CSV parsing error:', error);
          toast.error('Error parsing CSV file', {
            description: 'Please ensure the file follows the PrimeKG format',
          });
        },
      });
    },
    [processPrimeKGForNetwork],
  );

  // Extract geneIDs from all PrimeKG data
  React.useEffect(() => {
    if (isPrimeKG && parsedData.length > 0 && geneIDs.length > 0) {
      setTableOpen(true);
    }
  }, [isPrimeKG, parsedData, geneIDs]);

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please upload a file', {
        cancel: { label: 'Close', onClick() {} },
      });
      return;
    }

    if (isPrimeKG) {
      //   // For PrimeKG files, we've already processed the data during file selection
      //   if (geneIDs.length < 2) {
      //     toast.error('Please provide at least 2 valid genes', {
      //       cancel: { label: 'Close', onClick() {} },
      //       description: 'PrimeKG file should contain gene relationships',
      //     });
      //     return;
      //   }

      // Verify genes with GraphQL query
      const { error } = await fetchData({
        variables: { geneIDs: geneIDs },
      });

      if (error) {
        console.error(error);
        toast.error('Error fetching data', {
          cancel: { label: 'Close', onClick() {} },
          description: 'Server not available, Please try again later',
        });
        return;
      }

      setTableOpen(true);
      return;
    }

    // Original functionality for non-PrimeKG files
    let distinctSeedGenes: string[];
    if (fileType === 'json') {
      const data = JSON.parse(await file.text());
      distinctSeedGenes = distinct(
        data
          .flatMap((gene: Record<string, string | number>) => {
            return Object.values(gene).filter(val => Number.isNaN(Number(val)));
          })
          .map((gene: string) => gene.trim().toUpperCase()),
      );
    } else {
      const data = await file.text();
      distinctSeedGenes = distinct(
        data
          .split('\n')
          .slice(1)
          .flatMap(line => line.split(',').slice(0, 2))
          .map(gene => gene.trim().toUpperCase()),
      );
    }

    if (distinctSeedGenes.length < 2) {
      toast.error('Please provide at least 2 valid genes', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Seed genes should be either ENSG IDs or gene names',
      });
      return;
    }

    const { error } = await fetchData({
      variables: { geneIDs: distinctSeedGenes },
    });

    if (error) {
      console.error(error);
      toast.error('Error fetching data', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Server not available, Please try again later',
      });
      return;
    }

    setGeneIDs(distinctSeedGenes);
    setTableOpen(true);
  };

  const handleGenerateGraph = async () => {
    try {
      const store = await openDB('network', 'readwrite');
      if (!store) {
        toast.error('Failed to open IndexedDB database', {
          cancel: { label: 'Close', onClick() {} },
          description: 'Please make sure you have enabled IndexedDB in your browser',
        });
        return;
      }

      let fileToStore = file;

      // If it's PrimeKG data, create a processed CSV file for network visualization
      if (isPrimeKG && processedNetworkData.length > 0) {
        // Convert processed network data back to CSV format compatible with network visualization
        const csvHeader = 'x_id,y_id,x_name,y_name,x_type,y_type,relation,display_relation\n';
        const csvContent = parsedData
          .map(row => {
            const xName = row.x_name.trim().toUpperCase();
            const yName = row.y_name.trim().toUpperCase();

            return `${row.x_id || xName},${row.y_id || yName},${xName},${yName},${row.x_type},${row.y_type},${row.relation},${row.display_relation}`;
          })
          .join('\n');

        const processedCsvContent = csvHeader + csvContent;
        const processedBlob = new Blob([processedCsvContent], { type: 'text/csv' });
        fileToStore = new File([processedBlob], `${file?.name}`, { type: 'text/csv' });
      }

      // Store the file in IndexedDB
      await store.put(fileToStore, fileToStore?.name);

      toast.success('File uploaded successfully', {
        cancel: { label: 'Close', onClick() {} },
      });

      const params = new URLSearchParams({
        file: file?.name as string,
        csvType: fileType === 'csv' ? 'type2' : '',
      });
      window.open(`/network?${params.toString()}`, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error generating graph:', error);
      toast.error('Failed to generate graph', {
        cancel: { label: 'Close', onClick() {} },
        description: 'Please try again',
      });
    }
  };

  // Password screen
  if (!isAuthenticated) {
    return (
      <div className='mx-auto border rounded-lg shadow-md p-8 max-w-md'>
        <h2
          style={{
            background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
          }}
          className='text-2xl text-white rounded-t-lg font-semibold px-6 py-2 mb-6'
        >
          Knowledge Graph - Password Protected
        </h2>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='password'>Enter Password</Label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className='pr-10'
                placeholder='Enter password to continue'
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleAuthentication();
                  }
                }}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500'
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <Button
            onClick={handleAuthentication}
            style={{
              background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
            }}
            className='w-full'
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto border rounded-lg shadow-md h-full'>
      <h2
        style={{
          background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
        }}
        className='text-2xl text-white rounded-t-lg font-semibold px-6 py-2 mb-6'
      >
        Knowledge Graph Upload
      </h2>

      <form
        onSubmit={e => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className='space-y-4 px-8'>
          <div>
            <Label htmlFor='fileType'>Select File Type</Label>
            <Select value={fileType} onValueChange={val => setFileType(val as 'csv' | 'json')}>
              <SelectTrigger id='fileType'>
                <SelectValue placeholder='Select file type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='csv'>CSV</SelectItem>
                <SelectItem value='json'>JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className='flex justify-between items-center'>
              <Label htmlFor='fileUpload'>Upload {fileType.toUpperCase()}</Label>
              {isPrimeKG ? (
                <div className='text-right'>
                  <p className='text-green-600 font-medium'>✓ PrimeKG Format Detected</p>
                  <p className='text-sm text-gray-600'>
                    {processedNetworkData.length} network edges, {geneIDs.length} unique genes
                  </p>
                </div>
              ) : (
                <p className='text-zinc-500 lg:text-base sm:text-sm text-xs'>
                  (1st & 2nd columns need to be ENSG IDs or Gene name,
                  <br />
                  while 3rd column should be interaction score; examples:{' '}
                  <a href={'/example1.csv'} download className='underline'>
                    #1
                  </a>{' '}
                  <a href={'/example2.csv'} download className='underline'>
                    #2
                  </a>
                  )
                </p>
              )}
            </div>
            <Input
              id='fileUpload'
              type='file'
              accept='.csv,.json'
              onChange={handleFileChange}
              required
              className='border-2 hover:border-dashed cursor-pointer h-9'
            />
          </div>

          <Button
            type='submit'
            style={{
              background: 'linear-gradient(45deg, rgba(18,76,103,1) 0%, rgba(9,114,121,1) 35%, rgba(0,0,0,1) 100%)',
            }}
            className='w-full'
          >
            {loading && <Loader className='animate-spin mr-2' size={20} />} Submit
          </Button>
        </div>
      </form>

      {/* PrimeKG Network Summary */}
      {isPrimeKG && processedNetworkData.length > 0 && (
        <div className='px-8 py-4 mt-6 bg-blue-50 rounded-lg mx-8'>
          <h3 className='text-lg font-semibold mb-2'>Network Summary</h3>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <p>
                <strong>Total Edges:</strong> {processedNetworkData.length}
              </p>
              <p>
                <strong>Unique Genes:</strong> {geneIDs.length}
              </p>
            </div>
            <div>
              <p>
                <strong>Relationship Types:</strong> {distinct(processedNetworkData.map(e => e.relation || '')).length}
              </p>
              <p>
                <strong>Ready for Network Visualization</strong> ✓
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PrimeKG All Relationships Table */}
      {isPrimeKG && parsedData.length > 0 && (
        <div className='px-8 py-4 mt-6'>
          <h3 className='text-lg font-semibold mb-4'>All Relationships ({parsedData.length})</h3>
          <div className='overflow-x-auto max-h-96'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-100 sticky top-0'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Entity 1
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Type 1
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Entity 2
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Type 2
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Relation
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Display Relation
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {parsedData.slice(0, 100).map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{row.x_name}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          row.x_type?.includes('gene')
                            ? 'bg-green-100 text-green-800'
                            : row.x_type?.includes('compound')
                              ? 'bg-orange-100 text-orange-800'
                              : row.x_type?.includes('disease')
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {row.x_type}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{row.y_name}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm'>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          row.y_type?.includes('gene')
                            ? 'bg-green-100 text-green-800'
                            : row.y_type?.includes('compound')
                              ? 'bg-orange-100 text-orange-800'
                              : row.y_type?.includes('disease')
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {row.y_type}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{row.relation}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{row.display_relation}</td>
                  </tr>
                ))}
                {parsedData.length > 100 && (
                  <tr>
                    <td colSpan={6} className='px-6 py-4 text-center text-sm text-gray-500'>
                      ... and {parsedData.length - 100} more rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Show PopUpTable for both PrimeKG and non-PrimeKG files */}
      {tableOpen && (
        <PopUpTable
          geneIDs={geneIDs}
          tableOpen={tableOpen}
          setTableOpen={setTableOpen}
          data={data}
          handleGenerateGraph={handleGenerateGraph}
        />
      )}

      <div className='mt-6 px-8'>
        <h3 className='text-lg font-semibold mb-2'>File Format</h3>
        <Image
          src={'/image/uploadFormat.png'}
          width={400}
          height={400}
          alt='CSV file format example'
          className='w-full max-w-3xl mx-auto mix-blend-multiply'
        />
      </div>

      {/* PrimeKG Format Example */}
      {isPrimeKG && (
        <div className='mt-6 px-8 mb-8'>
          <h3 className='text-lg font-semibold mb-2'>PrimeKG Format</h3>
          <div className='bg-gray-100 p-4 rounded text-sm font-mono overflow-x-auto'>
            <pre>
              {`relation,display_relation,x_index,x_id,x_type,x_name,x_source,y_index,y_id,y_type,y_name,y_source
protein_protein,ppi,0,ENSG00000004059,gene/protein,ENSG00000004059,NCBI,1,ENSG00000135318,gene/protein,ENSG00000135318,NCBI
compound_protein,targets,18,CHEMBL123,compound,Aspirin,ChEMBL,19,ENSG00000135318,gene/protein,ENSG00000135318,NCBI
disease_protein,associated_with,19,MONDO_0007254,disease,Breast cancer,MONDO,20,ENSG00000149182,gene/protein,ENSG00000149182,NCBI`}
            </pre>
          </div>
          <p className='text-sm text-gray-500 mt-2'>
            Supports all relationship types: gene-gene, compound-gene, disease-gene, etc.
            <br />
            <strong>Network Output:</strong> node1,node2,score,relation,display_relation
          </p>
        </div>
      )}
    </div>
  );
}
