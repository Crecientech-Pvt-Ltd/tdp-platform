'use client';

/******** only for testing with sample graph **************/
// import { data as response } from '@/lib/data/sample-graph.json';
import { GENE_GRAPH_QUERY, GENE_VERIFICATION_QUERY } from '@/lib/gql';
import { useStore } from '@/lib/hooks';
import type {
  EdgeAttributes,
  GeneGraphData,
  GeneGraphVariables,
  GeneVerificationData,
  GeneVerificationVariables,
  NodeAttributes,
} from '@/lib/interface';
import { openDB } from '@/lib/utils';
import { useLazyQuery } from '@apollo/client';
import { useLoadGraph } from '@react-sigma/core';
import type Graph from 'graphology';
import type { SerializedEdge, SerializedGraph } from 'graphology-types';
import { AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Papa from 'papaparse';
import React from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Spinner } from '../ui/spinner';

export function LoadGraph() {
  const searchParams = useSearchParams();
  const loadGraph = useLoadGraph();
  const variable = JSON.parse(localStorage.getItem('graphConfig') || '{}');
  const [fetchData, { data: response, loading, error }] = useLazyQuery<GeneGraphData, GeneGraphVariables>(
    GENE_GRAPH_QUERY,
    {
      variables: {
        geneIDs: variable.geneIDs,
        interactionType: variable.interactionType,
        minScore: variable.minScore,
        order: variable.order,
      },
    },
  );

  const [fetchFileData] = useLazyQuery<GeneVerificationData, GeneVerificationVariables>(GENE_VERIFICATION_QUERY);
  const [showWarning, setShowWarning] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fileName = searchParams?.get('file');
    (async () => {
      if (fileName) {
        const fileType = fileName.split('.').pop();
        const store = await openDB('network', 'readonly');
        if (!store) {
          toast.error('Error opening IndexedDB!', {
            description: 'Please check your browser settings and try again',
            cancel: {
              label: 'Close',
              onClick: () => window.close(),
            },
          });
          return;
        }
        const req = store.get(fileName);
        req.onsuccess = async () => {
          const fileText = await (req.result as File).text();
          let fileData: Array<Record<string, string | number>>;
          let fields: string[] = [];
          if (fileType === 'json') {
            fileData = JSON.parse(fileText);
            fields = Object.keys(fileData?.[0] as object);
          } else {
            const parsedResult = Papa.parse(fileText, { header: true, skipEmptyLines: true });
            fileData = parsedResult.data as Array<Record<string, string | number>>;
            fields = parsedResult.meta.fields || [];
          }
          if (fields.length < 3) {
            toast.error('There must be atleast 3 fields in csv/json!', {
              description: 'Fields more than 3 are ignored. Please check the file and try again',
              cancel: {
                label: 'Close',
                onClick: () => window.close(),
              },
            });
            return;
          }
          const geneIDs = new Set<string>();
          for (const gene of fileData) {
            geneIDs.add(gene[fields?.[0]] as string);
            geneIDs.add(gene[fields?.[1]] as string);
          }
          const geneIDArray = Array.from(geneIDs);
          const result = await fetchFileData({
            variables: {
              geneIDs: geneIDArray,
            },
          });
          if (result.error) {
            toast.warning("Server can't verify the geneIDs!", {
              description: 'Please try again after some time',
              cancel: {
                label: 'Close',
                onClick: () => window.close(),
              },
            });
            return;
          }
          if (!result || !result.data) return;
          const geneNameToID = new Map<string, string>();
          const nodes = result.data.genes.map(gene => {
            if (gene.Gene_name) geneNameToID.set(gene.Gene_name, gene.ID);
            return {
              key: gene.ID,
              attributes: {
                label: gene.Gene_name || '',
                ID: gene.ID,
                description: gene.Description || '',
              },
            };
          });
          const serializedGraph: Partial<SerializedGraph<NodeAttributes, EdgeAttributes>> = {
            nodes,
            edges: fileData
              .map(gene => {
                const source = geneNameToID.get(gene[fields?.[0]] as string);
                const target = geneNameToID.get(gene[fields?.[1]] as string);
                if (!source || !target) return null;
                return {
                  key: `${source}-${target}`,
                  source,
                  target,
                  attributes: {
                    score: gene[fields?.[2]] as number,
                    label: gene[fields?.[2]].toString(),
                  },
                };
              })
              .filter(Boolean) as Array<SerializedEdge<EdgeAttributes>>,
            options: {
              type: 'directed',
            },
          };
          // Forcefully made this as it was only way to successfuly load graph in this version (don't try to solve it)
          loadGraph(serializedGraph as unknown as Graph<NodeAttributes, EdgeAttributes>);
          useStore.setState({ geneIDs: geneIDArray, totalNodes: geneIDs.size, totalEdges: fileData.length });
        };
      } else {
        await fetchData();
        if (error) {
          console.error(error);
          alert('Error loading graph! Check console for errors');
          return;
        }
        if (response) {
          const { genes, links, graphName } = response.getGeneInteractions;
          if (genes.length > 5000 || links.length > 50000) {
            toast.warning('Large graph detected!', {
              description: 'Computation is stopped. Auto closing the graph in 3 seconds to prevent browser crash',
              cancel: {
                label: 'Close',
                onClick: () => window.close(),
              },
            });
            setTimeout(() => window.close(), 3000);
            return;
          }
          if (genes.length > 1000 || links.length > 10000) {
            setShowWarning(true);
          }
          // store graphName in JSON in graphConfig key in localStorage
          localStorage.setItem('graphConfig', JSON.stringify({ ...variable, graphName }));
          useStore.setState({ graphConfig: { ...variable, graphName } });
          const transformedData: Partial<SerializedGraph<NodeAttributes, EdgeAttributes>> = {
            nodes: genes.map(gene => ({
              key: gene.ID,
              attributes: {
                label: gene.Gene_name || '',
                ID: gene.ID,
                description: gene.Description || '',
              },
            })),
            edges: links.map(link => ({
              key: `${link.gene1}-${link.gene2}`,
              source: link.gene1,
              target: link.gene2,
              attributes: {
                score: link.score,
                label: link.score.toString(),
              },
            })),
            options: {
              type: 'directed',
            },
          };
          if (transformedData) {
            // Forcefully made this as it was only way to successfuly load graph in this version (don't try to solve it)
            loadGraph(transformedData as unknown as Graph<NodeAttributes, EdgeAttributes>);
            const geneNameToID = new Map<string, string>();
            for (const gene of genes) {
              if (gene.Gene_name) geneNameToID.set(gene.Gene_name, gene.ID);
            }
            useStore.setState({
              geneIDs: transformedData.nodes?.map(node => node.key) || [],
              totalNodes: transformedData.nodes?.length || 0,
              totalEdges: transformedData.edges?.length || 0,
              geneNameToID,
            });
          }
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadGraph, loading, fetchData]);

  return (
    <>
      {loading ? (
        <div className=' absolute bottom-0 w-full h-full z-40 grid place-items-center'>
          <div className='flex flex-col items-center' id='test'>
            <Spinner />
            Loading...
          </div>
        </div>
      ) : showWarning ? (
        <AlertDialog open={showWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='text-red-500 flex items-center'>
                <AlertTriangle size={24} className='mr-2' />
                Warning!
              </AlertDialogTitle>
              <AlertDialogDescription className='text-black'>
                You are about to generate a graph with a large number of nodes/edges. You may face difficulties in
                analyzing the graph.
              </AlertDialogDescription>
              <p className='text-black font-semibold'>Are you sure you want to proceed?</p>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setShowWarning(false);
                  window.close();
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowWarning(false);
                }}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}
