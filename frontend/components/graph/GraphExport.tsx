'use client';

import { useSigma } from '@react-sigma/core';
import { downloadAsImage } from '@sigma/export-image';
import { strToU8, zipSync } from 'fflate';
import { unparse } from 'papaparse';
import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  DISEASE_DEPENDENT_PROPERTIES,
  type DiseaseDependentProperties,
  type NodeColorType,
  type NodeSizeType,
} from '@/lib/data';
import { useStore } from '@/lib/hooks';
import type { CommonSection, EdgeAttributes, NodeAttributes, OtherSection } from '@/lib/interface';
import { type EventMessage, Events, eventEmitter } from '@/lib/utils';

export function GraphExport({
  highlightedNodesRef,
  hubGenesNodesRef,
}: {
  highlightedNodesRef?: React.RefObject<Set<string>>;
  hubGenesNodesRef?: React.RefObject<Set<string>>;
}) {
  const projectTitle = useStore(state => state.projectTitle);
  const sigma = useSigma<NodeAttributes, EdgeAttributes>();

  function downloadFile(content: string, type: string, filename: string) {
    const element = document.createElement('a');
    const file = new Blob([content], { type });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    URL.revokeObjectURL(element.href);
    element.remove();
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: not required
  useEffect(() => {
    eventEmitter.on(
      Events.EXPORT,
      async ({ format, all, csvType }: EventMessage[Events.EXPORT] & { csvType?: string }) => {
        switch (format) {
          case 'csv': {
            const combinedNodesArray = [...(highlightedNodesRef?.current ?? []), ...(hubGenesNodesRef?.current ?? [])];
            if (!all && combinedNodesArray.length === 0) {
              toast.warning('No nodes selected', {
                cancel: { label: 'Close', onClick() {} },
              });
              return;
            }

            const graph = sigma.getGraph();
            const {
              selectedNodeColorProperty,
              selectedNodeSizeProperty,
              selectedRadioNodeColor,
              selectedRadioNodeSize,
              radioOptions,
              universalData,
              diseaseName,
            } = useStore.getState();

            const isDatabaseOrUser = (radio: NodeColorType | NodeSizeType, property: string) =>
              radioOptions.user[radio].includes(property)
                ? 'user'
                : DISEASE_DEPENDENT_PROPERTIES.includes(radio as DiseaseDependentProperties)
                  ? diseaseName
                  : 'common';
            const nodeIds = all ? sigma.getGraph().nodes() : combinedNodesArray;
            const universalCsv = unparse(
              nodeIds.map(nodeId => {
                const universalProperties: Record<string, string | number> = {};
                if (selectedRadioNodeColor) {
                  if (typeof selectedNodeColorProperty === 'string') {
                    universalProperties[selectedNodeColorProperty] =
                      (
                        universalData[nodeId][
                          isDatabaseOrUser(selectedRadioNodeColor, selectedNodeColorProperty)
                        ] as CommonSection & OtherSection
                      )?.[selectedRadioNodeColor][selectedNodeColorProperty] ?? 'N/A';
                  } else {
                    for (const property of selectedNodeColorProperty) {
                      universalProperties[property] =
                        (
                          universalData[nodeId][isDatabaseOrUser(selectedRadioNodeColor, property)] as CommonSection &
                            OtherSection
                        )?.[selectedRadioNodeColor][property] ?? 'N/A';
                    }
                  }
                }

                if (selectedRadioNodeSize) {
                  if (typeof selectedNodeSizeProperty === 'string') {
                    universalProperties[selectedNodeSizeProperty] =
                      (
                        universalData[nodeId][
                          isDatabaseOrUser(selectedRadioNodeSize, selectedNodeSizeProperty)
                        ] as CommonSection & OtherSection
                      )?.[selectedRadioNodeSize][selectedNodeSizeProperty] ?? 'N/A';
                  } else {
                    for (const property of selectedNodeSizeProperty) {
                      universalProperties[property] =
                        (
                          universalData[nodeId][isDatabaseOrUser(selectedRadioNodeSize, property)] as CommonSection &
                            OtherSection
                        )?.[selectedRadioNodeSize][property] ?? 'N/A';
                    }
                  }
                }

                return {
                  ID: nodeId,
                  Gene_name: graph.getNodeAttribute(nodeId, 'label'),
                  Description: graph.getNodeAttribute(nodeId, 'description'),
                  ...universalProperties,
                };
              }),
            );
            const nodeSet = new Set(nodeIds);
            const interactionCsv = unparse(
              graph.reduceEdges(
                (acc, _edgeId, attributes, source, target) => {
                  if (nodeSet.has(source) && nodeSet.has(target)) {
                    acc.push({
                      Source: source,
                      Target: target,
                      Score: attributes.score ?? 0,
                    });
                  }
                  return acc;
                },
                [] as { Source: string; Target: string; Score: number }[],
              ),
            );
            // Handle csvType
            if (csvType === 'universal') {
              downloadFile(universalCsv, 'text/csv', `${projectTitle}-universal.csv`);
            } else if (csvType === 'interaction') {
              if (interactionCsv) {
                downloadFile(interactionCsv, 'text/csv', `${projectTitle}-interaction.csv`);
              } else {
                toast.info('No interactions found for selected nodes.', {
                  cancel: { label: 'Close', onClick() {} },
                });
              }
            } else if (csvType === 'both') {
              // Zip both CSV files using fflate
              const files: Record<string, Uint8Array> = {
                [`${projectTitle}-universal.csv`]: strToU8(universalCsv),
              };
              if (interactionCsv) {
                files[`${projectTitle}-interaction.csv`] = strToU8(interactionCsv);
              }
              const zipped = zipSync(files);
              const zippedArrayBuffer = zipped.buffer instanceof ArrayBuffer ? zipped.buffer : zipped.slice().buffer; // fallback, but zipSync should return ArrayBuffer-backed Uint8Array
              const blob = new Blob([zippedArrayBuffer], { type: 'application/zip' });
              const aElement = document.createElement('a');
              aElement.href = URL.createObjectURL(blob);
              aElement.download = `${projectTitle}-csv.zip`;
              aElement.click();
              URL.revokeObjectURL(aElement.href);
              aElement.remove();
            }
            break;
          }
          default: {
            downloadAsImage(sigma, {
              format,
              fileName: projectTitle,
              backgroundColor: 'white',
            });
          }
        }
      },
    );
  }, []);

  return null;
}
