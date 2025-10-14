'use client';

import { useLazyQuery } from '@apollo/client/react';
import { redirect } from 'next/navigation';
import React, { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  DISEASE_DEPENDENT_PROPERTIES,
  DISEASE_INDEPENDENT_PROPERTIES,
  type DiseaseDependentProperties,
  type DiseaseIndependentProperties,
} from '@/lib/data';
import { GENE_UNIVERSAL_QUERY, GET_HEADERS_QUERY } from '@/lib/gql';
import { useStore } from '@/lib/hooks';
import type {
  GeneUniversalData,
  GeneUniversalDataVariables,
  GetDiseaseData,
  GetHeadersData,
  GetHeadersVariables,
  OtherSection,
  RadioOptions,
} from '@/lib/interface';
import { envURL } from '@/lib/utils';
import { Export, FileSheet } from '../app';
import { DiseaseMapCombobox } from '../DiseaseMapCombobox';
import { RadialAnalysis } from '../right-panel';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Spinner } from '../ui/spinner';
import { GeneSearch, NodeColor, NodeSize } from '.';

export function LeftSideBar({ graphConfigPresent = true }: { graphConfigPresent?: boolean }) {
  const diseaseName = useStore(state => state.diseaseName);
  const geneIDs = useStore(useShallow(state => state.geneNames.map(g => state.geneNameToID.get(g) ?? g)));
  const skipCommon = useRef<boolean>(false);
  const [diseaseData, setDiseaseData] = React.useState<GetDiseaseData | undefined>(undefined);
  const [diseaseMap, setDiseaseMap] = React.useState<string>('MONDO_0004976');
  useEffect(() => {
    const graphConfig = localStorage.getItem('graphConfig');
    if (!graphConfig && graphConfigPresent) redirect('/');
    const diseaseMap = graphConfig ? JSON.parse(graphConfig).diseaseMap : 'MONDO_0004976';
    useStore.setState({
      diseaseName: diseaseMap || 'MONDO_0004976',
    });
    setDiseaseMap(diseaseMap);
    (async () => {
      const response = await fetch(`${envURL(process.env.NEXT_PUBLIC_BACKEND_URL)}/diseases`);
      const data = await response.json();
      setDiseaseData(data);
    })();
  }, [graphConfigPresent]);

  const [fetchHeader, { loading, called }] = useLazyQuery<GetHeadersData, GetHeadersVariables>(GET_HEADERS_QUERY, {
    returnPartialData: true,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchHeader is redundant
  useEffect(() => {
    if (!diseaseName) return;
    fetchHeader({
      variables: {
        disease: diseaseName,
        skipCommon: skipCommon.current,
      },
    })
      .then(val => {
        const data = val.data?.headers;
        if (!data) return;
        const radioOptions: RadioOptions = {
          database: {
            ...useStore.getState().radioOptions.database,
            LogFC: [],
            // OpenTargets: [],
            Genetics: [],
          },
          user: useStore.getState().radioOptions.user,
        };
        if (!skipCommon.current) {
          for (const { name, description } of data.common ?? []) {
            for (const field of DISEASE_INDEPENDENT_PROPERTIES) {
              if (new RegExp(`^${field}_`, 'i').test(name)) {
                radioOptions.database[field].push({
                  description,
                  name: name.replace(new RegExp(`^${field}_`, 'i'), ''),
                });
              }
            }
          }
        }
        skipCommon.current = true;
        for (const { name, description } of data.disease ?? []) {
          for (const field of DISEASE_DEPENDENT_PROPERTIES) {
            if (field === 'OpenTargets') continue;
            if (new RegExp(`^${diseaseName}_${field}_`, 'i').test(name)) {
              radioOptions.database[field].push({
                description,
                name: name.replace(new RegExp(`^${diseaseName}_${field}_`, 'i'), ''),
              });
            }
          }
        }
        useStore.setState({ radioOptions });
      })
      .catch(err => {
        console.error(err);
      });
  }, [diseaseName]);

  useEffect(() => {
    if (!geneIDs) return;
    const universalData = useStore.getState().universalData;
    for (const gene of geneIDs) {
      if (universalData[gene] === undefined) {
        universalData[gene] = {
          common: {
            Custom_Color: {},
            Druggability: {},
            OT_Prioritization: {},
            Pathway: {},
            TE: {},
          },
          user: {
            LogFC: {},
            OpenTargets: {},
            Genetics: {},
            OT_Prioritization: {},
            Custom_Color: {},
            Druggability: {},
            Pathway: {},
            TE: {},
          },
        };
      }
    }
  }, [geneIDs]);

  const [fetchUniversal, { loading: universalLoading }] = useLazyQuery<GeneUniversalData, GeneUniversalDataVariables>(
    GENE_UNIVERSAL_QUERY,
  );
  const selectedRadioNodeSize = useStore(state => state.selectedRadioNodeSize);
  const selectedRadioNodeColor = useStore(state => state.selectedRadioNodeColor);
  const radioOptions = useStore(state => state.radioOptions);
  const queriedFieldSet = useRef<Set<string>>(new Set());

  async function handlePropChange(val: string | Set<string>, type: 'color' | 'size') {
    const selectedRadio = type === 'color' ? selectedRadioNodeColor : selectedRadioNodeSize;
    if (!selectedRadio) return;
    const ddp = DISEASE_DEPENDENT_PROPERTIES.includes(selectedRadio as DiseaseDependentProperties);
    const keys = (val instanceof Set ? Array.from(val) : [val]).reduce<string[]>((acc, v) => {
      const key = `${ddp ? `${diseaseName}_` : ''}${selectedRadio}_${v}`;
      if (!queriedFieldSet.current.has(key) && !radioOptions.user[selectedRadio].includes(key)) {
        acc.push(ddp ? key.slice(diseaseName.length + 1) : key);
      }
      return acc;
    }, []);
    if (keys.length === 0) {
      useStore.setState({
        [type === 'color' ? 'selectedNodeColorProperty' : 'selectedNodeSizeProperty']: val,
      });
    } else {
      const result = await fetchUniversal({
        variables: {
          geneIDs,
          config: [
            {
              properties: keys,
              ...(ddp && { disease: diseaseName }),
            },
          ],
        },
      });
      if (result.error) {
        console.error(result.error);
        return;
      }
      const data = result.data?.genes;
      queriedFieldSet.current = new Set([...queriedFieldSet.current, ...keys]);
      const universalData = useStore.getState().universalData;
      for (const gene of data ?? []) {
        for (const prop in gene.common) {
          universalData[gene.ID].common[selectedRadio as DiseaseIndependentProperties][
            prop.replace(new RegExp(`^${selectedRadio}_`), '')
          ] = gene.common[prop];
        }
        for (const prop in gene.disease?.[diseaseName]) {
          const geneRecord = universalData[gene.ID];
          if (geneRecord[diseaseName] === undefined) {
            geneRecord[diseaseName] = {
              LogFC: {},
              OpenTargets: {},
              Genetics: {},
            } as OtherSection;
          }
          (universalData[gene.ID][diseaseName] as OtherSection)[selectedRadio as DiseaseDependentProperties][
            prop.replace(new RegExp(`^${selectedRadio}_`), '')
          ] = gene.disease[diseaseName][prop];
        }
      }
      useStore.setState({
        universalData,
        [type === 'color' ? 'selectedNodeColorProperty' : 'selectedNodeSizeProperty']: val,
      });
    }
  }

  async function handleDiseaseChange(disease: string) {
    setDiseaseMap(disease);
    useStore.setState({ diseaseName: disease });
  }
  return (
    <ScrollArea className='flex h-[calc(96vh-1.5px)] flex-col border-r bg-secondary'>
      <div className='flex flex-col'>
        <Label className='mb-2 pt-4 pl-2 font-bold'>Disease Map</Label>
        <div className='flex w-full items-center'>
          <div className='min-w-0 flex-grow px-2'>
            <DiseaseMapCombobox
              value={diseaseMap}
              onChange={d => typeof d === 'string' && handleDiseaseChange(d)}
              data={diseaseData}
              className='w-full'
            />
          </div>
          {(!called || (called && loading) || diseaseData === undefined || universalLoading) && (
            <div className='fade-in zoom-in mr-1 animate-in duration-100'>
              <Spinner size='small' />
            </div>
          )}
        </div>
      </div>
      <NodeColor onPropChange={val => handlePropChange(val, 'color')} />
      <NodeSize onPropChange={val => handlePropChange(val, 'size')} />
      <RadialAnalysis />
      <div className='mb-6 flex flex-col space-y-2 px-4'>
        <GeneSearch />
        <FileSheet />
        <Export />
      </div>
    </ScrollArea>
  );
}
