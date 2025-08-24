'use client';

import { NodeGradientProgram } from '@/lib/graph';
import NodeSquareProgram from '@/lib/graph/NodeSquareProgram';
import NodeTriangleProgram from '@/lib/graph/NodeTriangleProgram';
import type { EdgeAttributes, NodeAttributes } from '@/lib/interface';
import {
  ControlsContainer,
  FullScreenControl,
  type SigmaContainerProps,
  SigmaContainer as _SigmaContainer,
} from '@react-sigma/core';
import { NodeBorderProgram, createNodeBorderProgram } from '@sigma/node-border';
import type { Attributes } from 'graphology-types';
import { Maximize, Minimize } from 'lucide-react';
import React, { Suspense, useEffect } from 'react';
import type { Sigma } from 'sigma';
import { EdgeLineProgram, NodeCircleProgram, drawDiscNodeHover } from 'sigma/rendering';
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

export const SigmaContainer = React.forwardRef<
  Sigma<NodeAttributes, EdgeAttributes, Attributes>,
  SigmaContainerProps<NodeAttributes, EdgeAttributes, Attributes>
>((props, ref) => {
  const clickedNodesRef = React.useRef(new Set<string>());
  const highlightedNodesRef = React.useRef(new Set<string>());
  const hubGenesNodesRef = React.useRef(new Set<string>());

  useEffect(() => {
    const sigmaContainer = document.querySelector('.sigma-container') as HTMLElement;
    sigmaContainer.addEventListener('contextmenu', e => e.preventDefault());
  }, []);

  const circle = ['anatomy', 'gene/protein', 'effect/phenotype', 'molecular_function'];
  const triangle = ['biological_process', 'cellular_component', 'exposure'];
  const square = ['drug', 'pathway', 'disease', 'compound'];

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
          triangle: NodeTriangleProgram,
          square: NodeSquareProgram,
        },
        edgeProgramClasses: {
          line: EdgeLineProgram,
        },
        defaultDrawNodeHover: drawDiscNodeHover,
        nodeReducer(node, data) {
          console.log('sigma boy', data);
          if (triangle.includes(data.nodeType)) data.type = 'triangle';
          else if (square.includes(data.nodeType)) data.type = 'square';
          else if (circle.includes(data.nodeType)) data.type = 'circle';
          else data.type = 'circle';
          return data;
        },
      }}
    >
      <Suspense>
        <LoadGraph />
      </Suspense>
      <GraphExport highlightedNodesRef={highlightedNodesRef} />
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
          <Maximize />
          <Minimize />
        </FullScreenControl>
      </ControlsContainer>
    </_SigmaContainer>
  );
});
SigmaContainer.displayName = 'Client_SigmaContainer';
