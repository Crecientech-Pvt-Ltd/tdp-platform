'use client';

import {
  SigmaContainer as _SigmaContainer,
  ControlsContainer,
  FullScreenControl,
  type SigmaContainerProps,
} from '@react-sigma/core';
import { createNodeBorderProgram, NodeBorderProgram } from '@sigma/node-border';
import type { Attributes } from 'graphology-types';
import { MaximizeIcon, MinimizeIcon } from 'lucide-react';
import React, { Suspense, useEffect } from 'react';
import type { Sigma } from 'sigma';
import { drawDiscNodeHover, EdgeLineProgram, NodeCircleProgram } from 'sigma/rendering';
import { NodeGradientProgram } from '@/lib/graph';
import type { EdgeAttributes, NodeAttributes } from '@/lib/interface';
import {
  ColorAnalysis,
  ForceLayout,
  GraphAnalysis,
  GraphEvents,
  GraphExport,
  GraphSettings,
  LoadGraph,
  SizeAnalysis,
  ZoomControl,
} from '.';

export const SigmaContainer = ({
  ref,
  ...props
}: SigmaContainerProps<NodeAttributes, EdgeAttributes, Attributes> & {
  ref?: React.RefObject<Sigma<NodeAttributes, EdgeAttributes, Attributes> | null>;
}) => {
  const clickedNodesRef = React.useRef(new Set<string>());
  const highlightedNodesRef = React.useRef(new Set<string>());
  const hubGenesNodesRef = React.useRef(new Set<string>());

  useEffect(() => {
    const sigmaContainer = document.querySelector('.sigma-container') as HTMLElement;
    sigmaContainer.addEventListener('contextmenu', e => e.preventDefault());
  }, []);

  return (
    <_SigmaContainer
      ref={ref}
      className={props.className}
      settings={{
        ...props.settings,
        nodeProgramClasses: {
          circle: NodeGradientProgram,
          border: createNodeBorderProgram({
            borders: [
              {
                size: { attribute: 'borderSize', defaultValue: 0.4 },
                color: { attribute: 'borderColor' },
              },
              { size: { fill: true }, color: { attribute: 'color' } },
            ],
          }),
          highlight: NodeBorderProgram,
          normal: NodeCircleProgram,
        },
        edgeProgramClasses: {
          line: EdgeLineProgram,
        },
        defaultDrawNodeHover: drawDiscNodeHover,
      }}
    >
      <Suspense>
        <LoadGraph />
      </Suspense>
      <GraphExport hubGenesNodesRef={hubGenesNodesRef} highlightedNodesRef={highlightedNodesRef} />
      <GraphEvents
        highlightedNodesRef={highlightedNodesRef}
        clickedNodesRef={clickedNodesRef}
        hubGenesNodesRef={hubGenesNodesRef}
      />
      <ForceLayout />
      <GraphSettings clickedNodesRef={clickedNodesRef} />
      <ColorAnalysis />
      <SizeAnalysis />
      <GraphAnalysis highlightedNodesRef={highlightedNodesRef} hubGenesNodesRef={hubGenesNodesRef} />
      <ControlsContainer position='bottom-right' style={{ zIndex: 0 }}>
        <ZoomControl />
        <FullScreenControl labels={{ enter: 'ENTER', exit: 'EXIT' }}>
          <MaximizeIcon />
          <MinimizeIcon />
        </FullScreenControl>
      </ControlsContainer>
    </_SigmaContainer>
  );
};
SigmaContainer.displayName = 'Client_SigmaContainer';
