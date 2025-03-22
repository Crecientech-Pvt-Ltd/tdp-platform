"use client";

import {
  DISEASE_DEPENDENT_PROPERTIES,
  DISEASE_INDEPENDENT_PROPERTIES,
  type DiseaseDependentProperties,
  type DiseaseIndependentProperties,
  diseaseTooltip,
  graphConfig,
} from "@/lib/data";
import { GENE_UNIVERSAL_QUERY, GET_HEADERS_QUERY } from "@/lib/gql";
import { useStore } from "@/lib/hooks";
import type {
  GeneUniversalData,
  GeneUniversalDataVariables,
  GetHeadersData,
  GetHeadersVariables,
  OtherSection,
  RadioOptions,
} from "@/lib/interface";
import { useLazyQuery } from "@apollo/client";
import { AnimatePresence, motion } from "framer-motion";
import { redirect } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { GeneSearch, NodeColor, NodeSize } from ".";
import { FileSheet } from "../app";
import { RadialAnalysis } from "../right-panel";
import { Combobox } from "../ui/combobox";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Spinner } from "../ui/spinner";

export function LeftSideBar() {
  const diseaseName = useStore(state => state.diseaseName);
  const geneIDs = useStore(state => state.geneIDs);
  const bringCommon = useRef<boolean>(true);

  useEffect(() => {
    const graphConfig = localStorage.getItem("graphConfig");
    if (!graphConfig) redirect("/");
    const diseaseMap = JSON.parse(graphConfig).diseaseMap;
    if (typeof diseaseMap !== "string") return;
    useStore.setState({
      diseaseName: diseaseMap,
    });
  }, []);

  const [fetchHeader, { loading, called }] = useLazyQuery<GetHeadersData, GetHeadersVariables>(
    GET_HEADERS_QUERY(bringCommon.current),
    { returnPartialData: true },
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: Fetchdata dependency is redundant
  useEffect(() => {
    if (!diseaseName) return;
    fetchHeader({
      variables: {
        disease: diseaseName,
      },
    })
      .then(val => {
        const data = val.data?.headers;
        if (!data) return;
        const radioOptions: RadioOptions = {
          database: {
            ...useStore.getState().radioOptions.database,
            LogFC: [],
            GDA: [],
            GWAS: [],
          },
          user: useStore.getState().radioOptions.user,
        };
        bringCommon.current = false;
        for (const { name, description } of data.common ?? []) {
          for (const field of DISEASE_INDEPENDENT_PROPERTIES) {
            if (new RegExp(`^${field}_`, "i").test(name)) {
              radioOptions.database[field].push({
                description,
                name: name.replace(new RegExp(`^${field}_`, "i"), ""),
              });
            }
          }
        }
        for (const { name, description } of data.disease ?? []) {
          for (const field of DISEASE_DEPENDENT_PROPERTIES) {
            if (new RegExp(`^${diseaseName}_${field}_`, "i").test(name)) {
              radioOptions.database[field].push({
                description,
                name: name.replace(new RegExp(`^${diseaseName}_${field}_`, "i"), ""),
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
            Database: {},
            Druggability: {},
            Pathway: {},
            TE: {},
          },
          user: {
            LogFC: {},
            GDA: {},
            GWAS: {},
            Custom_Color: {},
            Druggability: {},
            Pathway: {},
            TE: {},
            Database: {},
          },
        };
      }
    }
  }, [geneIDs]);

  const [fetchUniversal, { loading: universalLoading }] = useLazyQuery<GeneUniversalData, GeneUniversalDataVariables>(
    GENE_UNIVERSAL_QUERY(),
  );
  const selectedRadioNodeSize = useStore(state => state.selectedRadioNodeSize);
  const selectedRadioNodeColor = useStore(state => state.selectedRadioNodeColor);
  const radioOptions = useStore(state => state.radioOptions);
  const queriedFieldSet = useRef<Set<string>>(new Set());

  async function handlePropChange(val: string | Set<string>, type: "color" | "size") {
    const selectedRadio = type === "color" ? selectedRadioNodeColor : selectedRadioNodeSize;
    if (!selectedRadio) return;
    const ddp = DISEASE_DEPENDENT_PROPERTIES.includes(selectedRadio as DiseaseDependentProperties);
    const keys = (val instanceof Set ? Array.from(val) : [val]).reduce<string[]>((acc, v) => {
      const key = `${ddp ? `${diseaseName}_` : ""}${selectedRadio}_${v}`;
      if (!queriedFieldSet.current.has(key) && !radioOptions.user[selectedRadio].includes(key)) {
        acc.push(ddp ? key.slice(diseaseName.length + 1) : key);
      }
      return acc;
    }, []);
    if (keys.length === 0) {
      useStore.setState({
        [type === "color" ? "selectedNodeColorProperty" : "selectedNodeSizeProperty"]: val,
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
            prop.replace(new RegExp(`^${selectedRadio}_`), "")
          ] = gene.common[prop];
        }
        for (const prop in gene.disease?.[diseaseName]) {
          const geneRecord = universalData[gene.ID];
          if (geneRecord[diseaseName] === undefined) {
            geneRecord[diseaseName] = {
              LogFC: {},
              GDA: {},
              GWAS: {},
            } as OtherSection;
          }
          (universalData[gene.ID][diseaseName] as OtherSection)[selectedRadio as DiseaseDependentProperties][
            prop.replace(new RegExp(`^${selectedRadio}_`), "")
          ] = gene.disease[diseaseName][prop];
        }
      }
      useStore.setState({
        universalData,
        [type === "color" ? "selectedNodeColorProperty" : "selectedNodeSizeProperty"]: val,
      });
    }
  }

  return (
    <ScrollArea className="border-r p-2 flex flex-col h-[98vh]">
      <div className="flex flex-col">
        <Label className="font-bold mb-2">Disease Map</Label>
        <div className="flex items-center gap-2">
          <motion.div
            layout
            transition={{ duration: 0.1, ease: "easeInOut" }}
            initial={{ width: "100%" }}
            animate
          >
            <Combobox
              value={diseaseName}
              onChange={value => typeof value === "string" && useStore.setState({ diseaseName: value })}
              data={graphConfig[0].options.map(option => ({
                name: option.label,
                description: diseaseTooltip[option.label],
              }))}
              className="w-full"
            />
          </motion.div>
          <AnimatePresence>
            {(!called || (called && loading) || universalLoading) && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.1 }}
              >
                <Spinner size="small" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <NodeColor onPropChange={val => handlePropChange(val, "color")} />
      <NodeSize onPropChange={val => handlePropChange(val, "size")} />
      <RadialAnalysis />
      <div className="flex flex-col space-y-2 mb-2">
        <GeneSearch />
        <FileSheet />
      </div>
    </ScrollArea>
  );
}
