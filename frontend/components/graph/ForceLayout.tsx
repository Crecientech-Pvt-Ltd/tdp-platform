'use client';

import type EventEmitter from 'events';
import { useStore } from '@/lib/hooks';
import type { EdgeAttributes, NodeAttributes } from '@/lib/interface';
import { useSigma } from '@react-sigma/core';
import {
  type Simulation,
  type SimulationLinkDatum,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from 'd3-force';
import { useCallback, useEffect, useRef } from 'react';

export function ForceLayout() {
  const sigma = useSigma<NodeAttributes, EdgeAttributes>();
  const nodes = useRef<NodeAttributes[]>([]);
  const edges = useRef<SimulationLinkDatum<NodeAttributes>[]>([]);
  const simulation = useRef<Simulation<NodeAttributes, SimulationLinkDatum<NodeAttributes>>>();
  const graph = sigma.getGraph();
  const settings = useStore(state => state.forceSettings);
  const defaultNodeSize = useStore(state => state.defaultNodeSize);

  const tick = useCallback(() => {
    if (!graph || !nodes.current.length) return;
    for (const node of nodes.current) {
      graph.setNodeAttribute(node.ID, 'x', node.x);
      graph.setNodeAttribute(node.ID, 'y', node.y);
    }
  }, [graph]);

  useEffect(() => {
    sigma.on('afterRender', () => {
      if (!sigma.getGraph().order) return;
      (sigma as EventEmitter).emit('loaded');
    });
  }, [sigma]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!sigma) return;
    (sigma as EventEmitter).once('loaded', () => {
      const graph = sigma.getGraph();
      nodes.current = graph.mapNodes(node => ({
        ID: node,
      }));
      edges.current = graph.mapEdges((_edge, _attr, source, target) => ({
        source,
        target,
      }));
      simulation.current = forceSimulation<NodeAttributes, SimulationLinkDatum<NodeAttributes>>(nodes.current)
        .force(
          'link',
          forceLink<NodeAttributes, SimulationLinkDatum<NodeAttributes>>(edges.current)
            .id(d => d.ID!)
            .distance(settings.linkDistance),
        )
        .force('charge', forceManyBody().strength(settings.chargeStrength).theta(0.8))
        .force('collide', forceCollide(defaultNodeSize * 8))
        .on('tick', tick);

      useStore.setState({
        forceWorker: {
          start() {
            simulation.current?.alpha(1).restart();
          },
          stop() {
            simulation.current?.stop();
          },
        },
      });
    });
  }, [sigma, tick]);

  useEffect(() => {
    if (!simulation.current) return;
  
    console.log(`Updating charge strength to: ${settings.chargeStrength}`);
  
    simulation.current.force(
      'charge',
      forceManyBody().strength(settings.chargeStrength).theta(0.8)
    );
  
    // Adjust link distance to stabilize the network as charge strength increases
    simulation.current.force(
      'link',
      forceLink<NodeAttributes, SimulationLinkDatum<NodeAttributes>>(edges.current)
        .id(d => d.ID!)
        .distance(Math.abs(settings.chargeStrength) * 2) // Increase link distance as repulsion increases
    );
  
    simulation.current.alpha(0.3).restart(); // Restart simulation to apply new forces
  }, [settings.chargeStrength]);
  
  

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!simulation.current || !edges.current) return;
    simulation.current.force(
      'link',
      forceLink<NodeAttributes, SimulationLinkDatum<NodeAttributes>>(edges.current)
        .id(d => d.ID!)
        .distance(settings.linkDistance),
    );
    simulation.current.force('collide', forceCollide(defaultNodeSize * 8));
    simulation.current.alpha(0.3).restart();
  }, [settings]);

  return null;
}
