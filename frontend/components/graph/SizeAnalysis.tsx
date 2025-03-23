'use client';

import { useStore } from '@/lib/hooks';
import type { EdgeAttributes, NodeAttributes, OtherSection } from '@/lib/interface';
import { useSigma } from '@react-sigma/core';
import { scaleLinear } from 'd3-scale';
import { useEffect } from 'react';

export function SizeAnalysis() {
  const selectedRadioNodeSize = useStore(state => state.selectedRadioNodeSize);
  const selectedNodeSizeProperty = useStore(state => state.selectedNodeSizeProperty);
  const graph = useSigma<NodeAttributes, EdgeAttributes>().getGraph();
  const universalData = useStore(state => state.universalData);
  const defaultNodeSize = useStore(state => state.defaultNodeSize);
  const diseaseName = useStore(state => state.diseaseName);
  const radioOptions = useStore(state => state.radioOptions);

  useEffect(() => {
    if (!selectedRadioNodeSize && graph) {
      useStore.setState({ selectedNodeSizeProperty: '' });
      graph.updateEachNodeAttributes((_node, attr) => {
        attr.size = defaultNodeSize;
        return attr;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRadioNodeSize]);

  useEffect(() => {
    if (!selectedNodeSizeProperty || !graph || !selectedRadioNodeSize) return;
    const isUserProperty =
      typeof selectedNodeSizeProperty === 'string' &&
      radioOptions.user[selectedRadioNodeSize].includes(selectedNodeSizeProperty);
    const userOrDiseaseIdentifier = isUserProperty ? 'user' : diseaseName;
    const userOrCommonIdentifier = isUserProperty ? 'user' : 'common';
    if (selectedRadioNodeSize === 'Druggability' && typeof selectedNodeSizeProperty === 'string') {
      const minMax = Object.values(universalData).reduce(
        (acc, cur) => {
          const valString = cur[userOrCommonIdentifier].Druggability[selectedNodeSizeProperty];
          if (!valString) return acc;
          const value = +valString;
          return [Math.min(acc[0], value), Math.max(acc[1], value)];
        },
        [1, 0],
      );
      const sizeScale = scaleLinear<number, number>(minMax, [3, defaultNodeSize + 10]);
      graph.updateEachNodeAttributes((node, attr) => {
        const val = +universalData[node]?.[userOrCommonIdentifier].Druggability[selectedNodeSizeProperty];
        if (!Number.isNaN(val)) attr.size = sizeScale(val);
        else attr.size = 0.5;
        return attr;
      });
    } else if (selectedRadioNodeSize === 'TE' && typeof selectedNodeSizeProperty === 'string') {
      // ************ Multiselect code **********************
      // const propertyArray = Array.from(selectedNodeSizeProperty);
      // const userTEArray = radioOptions.user.TE;
      // const minMax = Object.values(universalData).reduce(
      //   (acc, cur) => {
      //     const value = propertyArray.reduce((acc2, property) => {
      //       const val = +cur[userTEArray.includes(property) ? 'user' : 'common'].TE[property];
      //       if (Number.isNaN(val)) return acc2;
      //       return Math.max(acc2, val);
      //     }, Number.NEGATIVE_INFINITY);
      //     return [Math.min(acc[0], value), Math.max(acc[1], value)];
      //   },
      //   [Number.POSITIVE_INFINITY, 0],
      // );
      // const sizeScale = scaleLinear<number, number>(minMax, [3, defaultNodeSize + 10]);
      // graph.updateEachNodeAttributes((node, attr) => {
      //   const val = propertyArray.reduce((acc, property) => {
      //     const value = +universalData[node]?.[userTEArray.includes(property) ? 'user' : 'common'].TE[property];
      //     if (Number.isNaN(value)) return acc;
      //     return Math.max(acc, value);
      //   }, Number.NEGATIVE_INFINITY);
      //   if (!Number.isNaN(val)) attr.size = sizeScale(val);
      //   else attr.size = 0.5;
      //   return attr;
      // });
      // ***************************************************

      const minMax = Object.values(universalData).reduce(
        (acc, cur) => {
          const valString = cur[userOrCommonIdentifier].TE[selectedNodeSizeProperty];
          if (!valString) return acc;
          const value = Number.parseFloat(valString);
          return [Math.min(acc[0], value), Math.max(acc[1], value)];
        },
        [Number.POSITIVE_INFINITY, 0],
      );
      const sizeScale = scaleLinear<number, number>(minMax, [3, defaultNodeSize + 10]);
      graph.updateEachNodeAttributes((node, attr) => {
        const val = Number.parseFloat(
          universalData[node]?.[userOrCommonIdentifier].TE[selectedNodeSizeProperty] ?? Number.NaN,
        );
        if (!Number.isNaN(val)) attr.size = sizeScale(val);
        else attr.size = 0.5;
        return attr;
      });
    } else if (selectedRadioNodeSize === 'LogFC' && typeof selectedNodeSizeProperty === 'string') {
      const max = Object.values(universalData).reduce((acc, cur) => {
        const valString = (cur[userOrDiseaseIdentifier] as OtherSection).LogFC?.[selectedNodeSizeProperty];
        if (!valString) return acc;
        const value = Math.abs(+valString);
        return Math.max(acc, value);
      }, 0);
      const sizeScale = scaleLinear<number, number>([0, max], [3, defaultNodeSize + 10]);
      graph.updateEachNodeAttributes((node, attr) => {
        const val = +(universalData[node]?.[userOrDiseaseIdentifier] as OtherSection)?.[selectedRadioNodeSize][
          selectedNodeSizeProperty
        ];
        if (!Number.isNaN(val)) attr.size = sizeScale(Math.abs(val));
        else attr.size = 0.5;
        return attr;
      });
    } else if (selectedRadioNodeSize === 'GWAS' && typeof selectedNodeSizeProperty === 'string') {
      const minMax = Object.values(universalData).reduce(
        (acc, cur) => {
          const valString = (cur[userOrDiseaseIdentifier] as OtherSection).GWAS?.[selectedNodeSizeProperty];
          if (!valString) return acc;
          const value = +valString;
          return [Math.min(acc[0], value), Math.max(acc[1], value)];
        },
        [1, -1],
      );
      const sizeScale = scaleLinear<number, number>(minMax, [3, defaultNodeSize + 10]);
      graph.updateEachNodeAttributes((node, attr) => {
        const val = +(universalData[node]?.[userOrDiseaseIdentifier] as OtherSection)?.[selectedRadioNodeSize][
          selectedNodeSizeProperty
        ];
        if (!Number.isNaN(val)) attr.size = sizeScale(val);
        else attr.size = 0.5;
        return attr;
      });
    } else if (selectedRadioNodeSize === 'GDA' && typeof selectedNodeSizeProperty === 'string') {
      const minMax = Object.values(universalData).reduce(
        (acc, cur) => {
          const valString = (cur[userOrDiseaseIdentifier] as OtherSection).GDA?.[selectedNodeSizeProperty];
          if (!valString) return acc;
          const value = +valString;
          return [Math.min(acc[0], value), Math.max(acc[1], value)];
        },
        [1, 0],
      );
      const sizeScale = scaleLinear<number, number>(minMax, [3, defaultNodeSize + 10]);
      graph.updateEachNodeAttributes((node, attr) => {
        const val = +(universalData[node]?.[userOrDiseaseIdentifier] as OtherSection)?.[selectedRadioNodeSize][
          selectedNodeSizeProperty
        ];
        if (!Number.isNaN(val)) attr.size = sizeScale(val);
        else attr.size = 0.5;
        return attr;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeSizeProperty, graph, universalData, defaultNodeSize]);

  return null;
}
