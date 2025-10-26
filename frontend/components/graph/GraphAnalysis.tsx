'use client';

import { useLazyQuery } from '@apollo/client/react';
import { useSigma } from '@react-sigma/core';
import { fitViewportToNodes } from '@sigma/utils';
import { scaleLinear } from 'd3-scale';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { GENE_PROPERTIES_QUERY } from '@/lib/gql';
import { useStore } from '@/lib/hooks';
import {
  type EdgeAttributes,
  type GenePropertiesData,
  type GenePropertiesDataVariables,
  GenePropertyCategoryEnum,
  type NodeAttributes,
} from '@/lib/interface';
import { type EventMessage, Events, envURL, eventEmitter } from '@/lib/utils';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';

export function GraphAnalysis({
  highlightedNodesRef,
  hubGenesNodesRef,
}: {
  highlightedNodesRef?: React.RefObject<Set<string>>;
  hubGenesNodesRef: React.RefObject<Set<string>>;
}) {
  const sigma = useSigma<NodeAttributes, EdgeAttributes>();
  const graph = sigma.getGraph();
  const radialAnalysis = useStore(state => state.radialAnalysis);
  const [communityMap, setCommunityMap] = useState<Record<string, { name: string; genes: string[]; color: string }>>(
    {},
  );

  useEffect(() => {
    let edgeCount = 0;
    graph.updateEachEdgeAttributes((_edge, attr) => {
      if (attr.score && attr.score < radialAnalysis.edgeWeightCutOff) {
        attr.hidden = true;
      } else {
        attr.hidden = false;
        edgeCount++;
      }
      return attr;
    });
    useStore.setState({ totalEdges: edgeCount });
  }, [graph, radialAnalysis.edgeWeightCutOff]);

  const nodeDegreeProperty = useStore(state => state.radialAnalysis.nodeDegreeProperty);
  const universalData = useStore(state => state.universalData);

  const [fetchUniversal] = useLazyQuery<GenePropertiesData, GenePropertiesDataVariables>(GENE_PROPERTIES_QUERY);

  // biome-ignore lint/correctness/useExhaustiveDependencies: not required
  useEffect(() => {
    (async () => {
      let nodeCount = 0;
      const userOrCommonIdentifier = useStore.getState().radioOptions.user.TE.includes(nodeDegreeProperty)
        ? 'user'
        : 'common';
      const isNodeDegree = nodeDegreeProperty === 'Gene Degree';
      if (!isNodeDegree) {
        await fetchUniversal({
          variables: {
            geneIds: graph.nodes(),
            config: [
              {
                category: GenePropertyCategoryEnum.TISSUE_EXPRESSION,
                properties: [nodeDegreeProperty],
              },
            ],
          },
        }).then(({ data }) => {
          const minMax = [Number.POSITIVE_INFINITY, 0];
          for (const gene of data?.geneProperties ?? []) {
            const score = gene.data[0].score;
            if (score === null || score === undefined || Number.isNaN(score)) continue;
            universalData[gene.ID][userOrCommonIdentifier].TE[nodeDegreeProperty] = score;
            minMax[0] = Math.min(minMax[0], score);
            minMax[1] = Math.max(minMax[1], score);
          }
          const sizeScale = scaleLinear<number, number>(minMax, [0, 1]);
          graph.updateEachNodeAttributes((node, attr) => {
            const value = +universalData[node]?.[userOrCommonIdentifier]?.TE[nodeDegreeProperty];
            if (!Number.isNaN(value) && sizeScale(value) >= radialAnalysis.nodeDegreeCutOff) {
              nodeCount++;
              attr.hidden = false;
            } else {
              attr.hidden = true;
            }
            return attr;
          });
        });
      } else {
        graph.updateEachNodeAttributes((node, attr) => {
          const degree = graph.degree(node);
          if (degree < radialAnalysis.nodeDegreeCutOff) {
            attr.hidden = true;
          } else {
            nodeCount++;
            attr.hidden = false;
          }
          return attr;
        });
      }
      const edgeCount = graph.reduceEdges((count, _edge, _attr, _src, _tgt, srcAttr, tgtAttr) => {
        return count + (srcAttr.hidden || tgtAttr.hidden ? 0 : 1);
      }, 0);
      useStore.setState({ totalNodes: nodeCount, totalEdges: edgeCount });
    })();
  }, [radialAnalysis.nodeDegreeCutOff, nodeDegreeProperty]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: not required
  useEffect(() => {
    if (radialAnalysis.hubGeneEdgeCount < 1) {
      graph.updateEachNodeAttributes((node, attr) => {
        if (highlightedNodesRef?.current.has(node)) {
          attr.type = 'highlight';
        } else {
          attr.type = 'circle';
        }
        return attr;
      });
    } else {
      graph.updateEachNodeAttributes((node, attr) => {
        const degree = graph.degree(node);
        if (degree >= radialAnalysis.hubGeneEdgeCount) {
          attr.type = 'border';
          hubGenesNodesRef.current.add(node);
        } else if (highlightedNodesRef?.current.has(node)) {
          attr.type = 'highlight';
        } else {
          attr.type = 'circle';
        }
        return attr;
      });
    }
  }, [radialAnalysis.hubGeneEdgeCount]);

  async function renewSession() {
    const res = await fetch(`${envURL(process.env.NEXT_PUBLIC_BACKEND_URL)}/algorithm/renew-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(useStore.getState().graphConfig!),
    });
    if (res.status === 202 || res.status === 409) return true;
    return false;
  }

  const searchParams = useSearchParams();

  // biome-ignore lint/correctness/useExhaustiveDependencies: One time setup
  useEffect(() => {
    eventEmitter.on(Events.ALGORITHM, async ({ name, parameters }: EventMessage[Events.ALGORITHM]) => {
      if (name === 'None') {
        setCommunityMap({});
        graph.updateEachNodeAttributes((_, attr) => {
          attr.color = undefined;
          attr.community = undefined;
          return attr;
        });
      } else if (name === 'Louvain') {
        const { resolution, weighted, minCommunitySize } = parameters;
        if (searchParams?.get('file')) {
          const louvain = await import('graphology-communities-louvain').then(lib => lib.default);
          const hslToHex = (h: number, s: number, l: number) => {
            l /= 100;
            const a = (s * Math.min(l, 1 - l)) / 100;
            const f = (n: number) => {
              const k = (n + h / 30) % 12;
              const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
              return Math.round(255 * color)
                .toString(16)
                .padStart(2, '0');
            };
            return `#${f(0)}${f(8)}${f(4)}`;
          };
          const res = louvain(graph, {
            resolution: +resolution,
            getEdgeWeight: weighted ? 'score' : null,
          });
          const map: Record<string, { name: string; genes: string[]; color: string }> = {};
          let count = 0;
          for (const [node, comm] of Object.entries(res)) {
            if (!map[comm]) {
              map[comm] = {
                name: '',
                genes: [],
                color: hslToHex(count++ * 137.508, 75, 50),
              };
            }
            map[comm].genes.push(node);
          }
          for (const { genes, color } of Object.values(map)) {
            if (genes.length < +minCommunitySize) {
              for (const gene of genes) {
                graph.setNodeAttribute(gene, 'color', undefined);
              }
              continue;
            }
            for (const gene of genes) {
              graph.setNodeAttribute(gene, 'color', color);
            }
          }
          setCommunityMap(map);
          return;
        }
        (async function louvain() {
          const { graphName } = useStore.getState().graphConfig!;
          const res = await fetch(
            `${envURL(process.env.NEXT_PUBLIC_BACKEND_URL)}/algorithm/louvain?graphName=${encodeURIComponent(
              graphName,
            )}&minCommunitySize=${minCommunitySize}${
              resolution ? `&resolution=${resolution}` : ''
            }&weighted=${encodeURIComponent(!!weighted)}`,
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            },
          );
          if (res.ok) {
            const data: Record<string, { name: string; genes: string[]; color: string }> = await res.json();
            setCommunityMap(data);
            for (const community of Object.values(data)) {
              for (const gene of community.genes) {
                graph.setNodeAttribute(gene, 'color', community.color);
              }
            }
          } else if (res.status === 404) {
            toast.promise(
              new Promise<void>(async (resolve, reject) => {
                const res = await renewSession();
                if (res) {
                  resolve();
                  await louvain();
                } else {
                  reject();
                }
              }),
              {
                success: 'Session renewed',
                loading: 'Session expired, renewing...',
                error: 'Failed to renew session',
                description: 'This may take a while, please be patient',
                cancel: { label: 'Close', onClick() {} },
              },
            );
          } else {
            toast.error('Failed to fetch Louvain data', {
              cancel: { label: 'Close', onClick() {} },
              description: 'Server not available,Please try again later. Graph must have relationships to run Louvain.',
            });
          }
        })();
      }
    });
  }, []);

  const getReadableTextColor = useCallback((hex: string) => {
    const [r, g, b] = hex.match(/\w\w/g)!.map(v => Number.parseInt(v, 16));
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 140 ? '#000' : '#fff';
  }, []);

  return (
    <>
      {Object.keys(communityMap).length > 0 && (
        <div className='absolute bottom-2 left-2 flex max-h-56 flex-col space-y-1 overflow-scroll rounded-md border p-2 shadow backdrop-blur'>
          {Object.entries(communityMap).map(([id, val], idx) => (
            <div key={id} className='flex items-center gap-1'>
              <Checkbox
                defaultChecked
                onCheckedChange={bool => {
                  if (bool === 'indeterminate') return;
                  for (const gene of val.genes) {
                    graph.setNodeAttribute(gene, 'hidden', !bool);
                  }
                }}
              />
              <Button
                style={{
                  backgroundColor: val.color,
                  color: getReadableTextColor(val.color),
                }}
                className='h-5 w-32'
                onClick={() => fitViewportToNodes(sigma, val.genes, { animate: true })}
              >
                Community {idx + 1}
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
